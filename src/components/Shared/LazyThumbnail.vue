<!-- components/Shared/LazyThumbnail.vue -->
<template>
  <div 
    ref="thumbnailRef"
    class="lazy-thumbnail"
    :class="{
      'loading': isLoading,
      'loaded': isLoaded,
      'error': hasError
    }"
    :style="{ width: `${size.width}px`, height: `${size.height}px` }"
  >
    <!-- Loading State -->
    <div v-if="isLoading && !isLoaded" class="loading-placeholder">
      <div class="loading-spinner">
        <span class="loading loading-spinner loading-sm"></span>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="hasError" class="error-placeholder">
      <i class="fas fa-exclamation-triangle text-error"></i>
      <span class="text-xs text-error mt-1">Erreur</span>
    </div>

    <!-- Loaded Thumbnail -->
    <img 
      v-else-if="thumbnailData"
      :src="`data:image/jpeg;base64,${thumbnailData}`"
      :alt="altText"
      class="thumbnail-image"
      @load="onImageLoad"
      @error="onImageError"
    />

    <!-- Fallback Icon -->
    <div v-else class="fallback-icon">
      <i :class="fileIcon" class="text-2xl text-base-content/50"></i>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useLazyFileLoading } from '@/composables/useLazyFileLoading'
import { getFileTypeIcon } from '@/utils/fileTypeDetection'

const props = defineProps({
  filePath: {
    type: String,
    required: true
  },
  size: {
    type: Object,
    default: () => ({ width: 200, height: 200 })
  },
  altText: {
    type: String,
    default: 'File thumbnail'
  },
  eager: {
    type: Boolean,
    default: false
  },
  fileExtension: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['load', 'error'])

// Template refs
const thumbnailRef = ref(null)

// Lazy loading composable
const {
  setupThumbnailLoading,
  loadContent,
  isLoading: isLoadingFromComposable,
  isLoaded: isLoadedFromComposable,
  getContent,
  getError
} = useLazyFileLoading()

// Local state
const thumbnailData = ref(null)
const imageLoaded = ref(false)

// Computed properties
const isLoading = computed(() => {
  return isLoadingFromComposable(props.filePath) && !thumbnailData.value
})

const isLoaded = computed(() => {
  return isLoadedFromComposable(props.filePath) && thumbnailData.value && imageLoaded.value
})

const hasError = computed(() => {
  return !!getError(props.filePath)
})

const fileIcon = computed(() => {
  if (props.fileExtension) {
    return getFileTypeIcon(null, props.fileExtension)
  }
  return 'fas fa-file'
})

// Methods
const onThumbnailLoad = (thumbnail) => {
  thumbnailData.value = thumbnail
  emit('load', thumbnail)
}

const onThumbnailError = (error) => {
  console.error('Thumbnail loading error:', error)
  emit('error', error)
}

const onImageLoad = () => {
  imageLoaded.value = true
}

const onImageError = () => {
  imageLoaded.value = false
  onThumbnailError(new Error('Image failed to load'))
}

const loadThumbnail = async () => {
  if (props.eager) {
    // Load immediately without lazy loading
    try {
      const thumbnail = await loadContent(props.filePath, 'thumbnail', {
        size: props.size
      })
      onThumbnailLoad(thumbnail)
    } catch (error) {
      onThumbnailError(error)
    }
  } else {
    // Setup lazy loading
    setupThumbnailLoading(thumbnailRef, props.filePath, {
      size: props.size,
      onLoad: onThumbnailLoad,
      onError: onThumbnailError
    })
  }
}

// Watch for changes in file path
watch(() => props.filePath, () => {
  thumbnailData.value = null
  imageLoaded.value = false
  
  // Check if already loaded
  const existingContent = getContent(props.filePath)
  if (existingContent) {
    onThumbnailLoad(existingContent)
  } else {
    loadThumbnail()
  }
}, { immediate: false })

// Lifecycle
onMounted(() => {
  // Check if already loaded
  const existingContent = getContent(props.filePath)
  if (existingContent) {
    onThumbnailLoad(existingContent)
  } else {
    loadThumbnail()
  }
})
</script>

<style scoped>
.lazy-thumbnail {
  @apply relative overflow-hidden rounded-lg bg-base-200 flex items-center justify-center;
  transition: all 0.3s ease;
}

.lazy-thumbnail.loading {
  @apply animate-pulse;
}

.lazy-thumbnail.loaded {
  @apply shadow-sm;
}

.lazy-thumbnail.error {
  @apply border-2 border-error border-dashed;
}

.loading-placeholder {
  @apply flex flex-col items-center justify-center h-full w-full;
}

.loading-spinner {
  @apply flex items-center justify-center;
}

.error-placeholder {
  @apply flex flex-col items-center justify-center h-full w-full text-center p-2;
}

.thumbnail-image {
  @apply w-full h-full object-cover;
  transition: opacity 0.3s ease;
}

.fallback-icon {
  @apply flex items-center justify-center h-full w-full;
}

/* Hover effects */
.lazy-thumbnail:hover {
  @apply shadow-md transform scale-105;
}

.lazy-thumbnail:hover .thumbnail-image {
  @apply opacity-90;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .lazy-thumbnail:hover {
    @apply transform-none scale-100;
  }
}
</style>