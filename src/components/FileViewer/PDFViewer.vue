<template>
  <div class="pdf-viewer flex flex-col h-full bg-base-100">
    <!-- PDF Toolbar -->
    <div class="pdf-toolbar flex items-center justify-between p-3 border-b border-base-300 bg-base-200">
      <!-- Navigation Controls -->
      <div class="flex items-center space-x-2">
        <button
          @click="previousPage"
          :disabled="currentPage <= 1"
          class="btn btn-sm btn-ghost"
          title="Page précédente"
        >
          <i class="fas fa-chevron-left"></i>
        </button>
        
        <div class="flex items-center space-x-2">
          <input
            v-model.number="pageInput"
            @keyup.enter="goToPage"
            @blur="goToPage"
            type="number"
            :min="1"
            :max="totalPages"
            class="input input-sm input-bordered w-16 text-center"
          />
          <span class="text-sm text-base-content/70">/ {{ totalPages }}</span>
        </div>
        
        <button
          @click="nextPage"
          :disabled="currentPage >= totalPages"
          class="btn btn-sm btn-ghost"
          title="Page suivante"
        >
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>

      <!-- Zoom Controls -->
      <div class="flex items-center space-x-2">
        <button
          @click="zoomOut"
          :disabled="scale <= 0.5"
          class="btn btn-sm btn-ghost"
          title="Zoom arrière"
        >
          <i class="fas fa-search-minus"></i>
        </button>
        
        <select
          v-model="scaleMode"
          @change="handleScaleModeChange"
          class="select select-sm select-bordered"
        >
          <option value="fit-width">Ajuster largeur</option>
          <option value="fit-page">Ajuster page</option>
          <option value="auto">Auto</option>
          <option value="custom">{{ Math.round(scale * 100) }}%</option>
        </select>
        
        <button
          @click="zoomIn"
          :disabled="scale >= 3"
          class="btn btn-sm btn-ghost"
          title="Zoom avant"
        >
          <i class="fas fa-search-plus"></i>
        </button>
      </div>

      <!-- Search Controls -->
      <div class="flex items-center space-x-2">
        <div class="relative">
          <input
            v-model="searchQuery"
            @keyup.enter="searchNext"
            @input="handleSearchInput"
            type="text"
            placeholder="Rechercher..."
            class="input input-sm input-bordered pr-8"
          />
          <button
            v-if="searchQuery"
            @click="clearSearch"
            class="absolute right-2 top-1/2 transform -translate-y-1/2 text-base-content/50 hover:text-base-content"
          >
            <i class="fas fa-times text-xs"></i>
          </button>
        </div>
        
        <div v-if="searchResults.length > 0" class="flex items-center space-x-1">
          <button
            @click="searchPrevious"
            :disabled="currentSearchIndex <= 0"
            class="btn btn-sm btn-ghost"
            title="Résultat précédent"
          >
            <i class="fas fa-chevron-up"></i>
          </button>
          
          <span class="text-sm text-base-content/70">
            {{ currentSearchIndex + 1 }} / {{ searchResults.length }}
          </span>
          
          <button
            @click="searchNext"
            :disabled="currentSearchIndex >= searchResults.length - 1"
            class="btn btn-sm btn-ghost"
            title="Résultat suivant"
          >
            <i class="fas fa-chevron-down"></i>
          </button>
        </div>
        
        <!-- Bookmarks Toggle -->
        <div class="flex items-center space-x-2">
          <button
            @click="toggleBookmarks"
            :class="{ 'btn-active': showBookmarks }"
            :disabled="bookmarks.length === 0"
            class="btn btn-sm btn-ghost"
            title="Signets"
          >
            <i class="fas fa-bookmark"></i>
            Signets
          </button>
        </div>

        <!-- Annotation Toggle -->
        <div class="flex items-center space-x-2">
          <button
            @click="toggleAnnotations"
            :class="{ 'btn-active': showAnnotations }"
            class="btn btn-sm btn-ghost"
            title="Annotations"
          >
            <i class="fas fa-edit"></i>
            Annotations
          </button>
        </div>
      </div>
    </div>

    <!-- Annotation Tools -->
    <PDFAnnotationTools
      v-if="showAnnotations"
      :pdf-url="pdfUrl"
      :current-page="currentPage"
      :scale="scale"
      :canvas-element="pdfCanvas"
      @annotations-changed="handleAnnotationsChanged"
      @annotation-selected="handleAnnotationSelected"
      @save-annotations="handleSaveAnnotations"
    />

    <!-- PDF Content -->
    <div class="pdf-content flex-1 overflow-auto bg-gray-100" ref="pdfContainer">
      <!-- Loading State -->
      <div
        v-if="isLoading"
        class="flex items-center justify-center h-full"
      >
        <div class="text-center">
          <div class="loading loading-spinner loading-lg mb-4"></div>
          <p class="text-base-content/70">{{ loadingMessage }}</p>
        </div>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="flex items-center justify-center h-full p-8"
      >
        <div class="text-center max-w-md">
          <div class="text-6xl mb-4 text-error">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <h3 class="text-xl font-semibold mb-2">Erreur de chargement PDF</h3>
          <p class="text-base-content/70 mb-4">{{ error }}</p>
          <button @click="retryLoad" class="btn btn-sm btn-outline">
            <i class="fas fa-redo mr-1"></i>
            Réessayer
          </button>
        </div>
      </div>

      <!-- PDF Pages -->
      <div
        v-else-if="pdfDocument"
        class="pdf-pages-container flex"
      >
        <!-- Bookmarks Panel -->
        <div
          v-if="showBookmarks && bookmarks.length > 0"
          class="bookmarks-panel w-64 bg-base-100 border-r border-base-300 p-4 overflow-y-auto"
        >
          <h3 class="font-semibold mb-3 flex items-center justify-between">
            Signets
            <button
              @click="showBookmarks = false"
              class="btn btn-xs btn-ghost"
            >
              <i class="fas fa-times"></i>
            </button>
          </h3>
          
          <div class="space-y-1">
            <div
              v-for="(bookmark, index) in bookmarks"
              :key="index"
              class="bookmark-item cursor-pointer hover:bg-base-200 p-2 rounded text-sm"
              :class="{ 'ml-4': bookmark.level > 0, 'ml-8': bookmark.level > 1 }"
              @click="navigateToBookmark(bookmark)"
            >
              <i class="fas fa-bookmark text-xs mr-2 text-primary"></i>
              {{ bookmark.title }}
            </div>
          </div>
        </div>

        <!-- PDF Canvas Container -->
        <div class="flex-1 flex flex-col items-center py-4">
          <canvas
            ref="pdfCanvas"
            class="pdf-page shadow-lg mb-4 bg-white"
            :style="{ transform: `scale(${scale})`, transformOrigin: 'top center' }"
          ></canvas>
        </div>
      </div>
    </div>

    <!-- Status Bar -->
    <div class="pdf-status-bar flex items-center justify-between p-2 border-t border-base-300 bg-base-50 text-sm text-base-content/70">
      <div class="flex items-center space-x-4">
        <span v-if="metadata">
          {{ metadata.title || filename }}
        </span>
        <span v-if="metadata?.author">
          par {{ metadata.author }}
        </span>
      </div>
      
      <div class="flex items-center space-x-4">
        <span v-if="metadata?.pageCount">
          {{ metadata.pageCount }} pages
        </span>
        <span v-if="metadata?.fileSize">
          {{ formatFileSize(metadata.fileSize) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'
import PDFAnnotationTools from './PDFAnnotationTools.vue'

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString()

// Props
const props = defineProps({
  pdfUrl: {
    type: String,
    required: true
  },
  filename: {
    type: String,
    default: 'document.pdf'
  },
  metadata: {
    type: Object,
    default: () => ({})
  }
})

// Emits
const emit = defineEmits([
  'error',
  'loaded',
  'page-changed',
  'annotations-changed',
  'annotations-saved'
])

// Refs
const pdfContainer = ref(null)
const pdfCanvas = ref(null)

// State
const isLoading = ref(true)
const error = ref(null)
const loadingMessage = ref('Chargement du PDF...')
const pdfDocument = ref(null)
const currentPage = ref(1)
const totalPages = ref(0)
const pageInput = ref(1)
const scale = ref(1.0)
const scaleMode = ref('fit-width')

// Search state
const searchQuery = ref('')
const searchResults = ref([])
const currentSearchIndex = ref(-1)
const searchTask = ref(null)

// Annotation state
const showAnnotations = ref(false)
const annotations = ref([])
const selectedAnnotation = ref(null)

// Bookmark state
const showBookmarks = ref(false)
const bookmarks = ref([])
const pageLinks = ref([])

// Methods
const loadPDF = async () => {
  try {
    isLoading.value = true
    error.value = null
    loadingMessage.value = 'Chargement du PDF...'

    const loadingTask = pdfjsLib.getDocument(props.pdfUrl)
    
    loadingTask.onProgress = (progress) => {
      if (progress.total > 0) {
        const percent = Math.round((progress.loaded / progress.total) * 100)
        loadingMessage.value = `Chargement du PDF... ${percent}%`
      }
    }

    const pdf = await loadingTask.promise
    pdfDocument.value = pdf
    totalPages.value = pdf.numPages
    
    // Extract bookmarks and links
    await extractBookmarksAndLinks(pdf)
    
    // Load first page
    await renderPage(1)
    
    emit('loaded', {
      totalPages: totalPages.value,
      metadata: await extractMetadata(pdf),
      bookmarks: bookmarks.value
    })
    
  } catch (err) {
    console.error('Error loading PDF:', err)
    error.value = `Impossible de charger le PDF: ${err.message}`
    emit('error', err)
  } finally {
    isLoading.value = false
  }
}

const renderPage = async (pageNum) => {
  if (!pdfDocument.value || !pdfCanvas.value) return
  
  try {
    const page = await pdfDocument.value.getPage(pageNum)
    const canvas = pdfCanvas.value
    const context = canvas.getContext('2d')
    
    // Calculate scale based on mode
    const viewport = page.getViewport({ scale: 1.0 })
    let renderScale = scale.value
    
    if (scaleMode.value === 'fit-width' && pdfContainer.value) {
      const containerWidth = pdfContainer.value.clientWidth - 40 // padding
      renderScale = containerWidth / viewport.width
    } else if (scaleMode.value === 'fit-page' && pdfContainer.value) {
      const containerWidth = pdfContainer.value.clientWidth - 40
      const containerHeight = pdfContainer.value.clientHeight - 40
      const scaleX = containerWidth / viewport.width
      const scaleY = containerHeight / viewport.height
      renderScale = Math.min(scaleX, scaleY)
    }
    
    const scaledViewport = page.getViewport({ scale: renderScale })
    
    // Set canvas dimensions
    canvas.height = scaledViewport.height
    canvas.width = scaledViewport.width
    
    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height)
    
    // Render page
    const renderContext = {
      canvasContext: context,
      viewport: scaledViewport
    }
    
    await page.render(renderContext).promise
    
    // Update scale if it was calculated
    if (scaleMode.value !== 'custom') {
      scale.value = renderScale
    }
    
    currentPage.value = pageNum
    pageInput.value = pageNum
    
    emit('page-changed', pageNum)
    
  } catch (err) {
    console.error('Error rendering page:', err)
    error.value = `Erreur lors du rendu de la page: ${err.message}`
  }
}

const extractMetadata = async (pdf) => {
  try {
    const metadata = await pdf.getMetadata()
    return {
      title: metadata.info?.Title || '',
      author: metadata.info?.Author || '',
      subject: metadata.info?.Subject || '',
      creator: metadata.info?.Creator || '',
      producer: metadata.info?.Producer || '',
      creationDate: metadata.info?.CreationDate || '',
      modificationDate: metadata.info?.ModDate || '',
      pageCount: pdf.numPages
    }
  } catch (err) {
    console.warn('Could not extract PDF metadata:', err)
    return { pageCount: pdf.numPages }
  }
}

// Navigation methods
const previousPage = () => {
  if (currentPage.value > 1) {
    renderPage(currentPage.value - 1)
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    renderPage(currentPage.value + 1)
  }
}

const goToPage = () => {
  const page = Math.max(1, Math.min(totalPages.value, pageInput.value))
  if (page !== currentPage.value) {
    renderPage(page)
  }
  pageInput.value = page
}

// Zoom methods
const zoomIn = () => {
  if (scale.value < 3) {
    scaleMode.value = 'custom'
    scale.value = Math.min(3, scale.value * 1.2)
    renderPage(currentPage.value)
  }
}

const zoomOut = () => {
  if (scale.value > 0.5) {
    scaleMode.value = 'custom'
    scale.value = Math.max(0.5, scale.value / 1.2)
    renderPage(currentPage.value)
  }
}

const handleScaleModeChange = () => {
  if (scaleMode.value !== 'custom') {
    renderPage(currentPage.value)
  }
}

// Search methods
const handleSearchInput = () => {
  if (searchQuery.value.trim()) {
    searchInPDF()
  } else {
    clearSearch()
  }
}

const searchInPDF = async () => {
  if (!pdfDocument.value || !searchQuery.value.trim()) return
  
  try {
    searchResults.value = []
    currentSearchIndex.value = -1
    
    const query = searchQuery.value.toLowerCase()
    
    for (let pageNum = 1; pageNum <= totalPages.value; pageNum++) {
      const page = await pdfDocument.value.getPage(pageNum)
      const textContent = await page.getTextContent()
      
      const pageText = textContent.items
        .map(item => item.str)
        .join(' ')
        .toLowerCase()
      
      if (pageText.includes(query)) {
        searchResults.value.push({
          pageNum,
          text: pageText
        })
      }
    }
    
    if (searchResults.value.length > 0) {
      currentSearchIndex.value = 0
      goToSearchResult(0)
    }
    
  } catch (err) {
    console.error('Error searching PDF:', err)
  }
}

const searchNext = () => {
  if (searchResults.value.length > 0) {
    currentSearchIndex.value = Math.min(
      searchResults.value.length - 1,
      currentSearchIndex.value + 1
    )
    goToSearchResult(currentSearchIndex.value)
  }
}

const searchPrevious = () => {
  if (searchResults.value.length > 0) {
    currentSearchIndex.value = Math.max(0, currentSearchIndex.value - 1)
    goToSearchResult(currentSearchIndex.value)
  }
}

const goToSearchResult = (index) => {
  if (searchResults.value[index]) {
    const result = searchResults.value[index]
    renderPage(result.pageNum)
  }
}

const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = []
  currentSearchIndex.value = -1
}

// Utility methods
const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

const retryLoad = () => {
  loadPDF()
}

// Annotation methods
const toggleAnnotations = () => {
  showAnnotations.value = !showAnnotations.value
}

const handleAnnotationsChanged = (newAnnotations) => {
  annotations.value = newAnnotations
  emit('annotations-changed', newAnnotations)
}

const handleAnnotationSelected = (annotation) => {
  selectedAnnotation.value = annotation
}

const handleSaveAnnotations = (annotationsToSave) => {
  // Here we could implement server-side saving
  // For now, we'll just emit the event
  emit('annotations-saved', {
    pdfUrl: props.pdfUrl,
    annotations: annotationsToSave
  })
}

// Bookmark methods
const toggleBookmarks = () => {
  showBookmarks.value = !showBookmarks.value
}

const navigateToBookmark = async (bookmark) => {
  if (!pdfDocument.value) return
  
  try {
    // Import PDFHandler to use navigation method
    const { PDFHandler } = await import('./handlers/PDFHandler.js')
    const handler = new PDFHandler()
    
    const navResult = await handler.navigateToDestination(pdfDocument.value, bookmark.dest)
    
    if (navResult) {
      renderPage(navResult.pageNum)
    } else if (bookmark.url) {
      // External link
      window.open(bookmark.url, bookmark.newWindow ? '_blank' : '_self')
    }
  } catch (error) {
    console.error('Error navigating to bookmark:', error)
  }
}

const extractBookmarksAndLinks = async (pdf) => {
  try {
    // Import PDFHandler to use extraction methods
    const { PDFHandler } = await import('./handlers/PDFHandler.js')
    const handler = new PDFHandler()
    
    // Extract bookmarks
    const extractedBookmarks = await handler.extractBookmarks(pdf)
    bookmarks.value = extractedBookmarks
    
    // Extract links from current page
    if (currentPage.value > 0) {
      const page = await pdf.getPage(currentPage.value)
      const links = await handler.extractPageLinks(page)
      pageLinks.value = links
    }
  } catch (error) {
    console.warn('Could not extract bookmarks and links:', error)
  }
}

// Keyboard shortcuts
const handleKeydown = (event) => {
  switch (event.key) {
    case 'ArrowLeft':
      if (!event.ctrlKey) {
        event.preventDefault()
        previousPage()
      }
      break
    case 'ArrowRight':
      if (!event.ctrlKey) {
        event.preventDefault()
        nextPage()
      }
      break
    case 'Home':
      event.preventDefault()
      renderPage(1)
      break
    case 'End':
      event.preventDefault()
      renderPage(totalPages.value)
      break
    case '+':
    case '=':
      if (event.ctrlKey) {
        event.preventDefault()
        zoomIn()
      }
      break
    case '-':
      if (event.ctrlKey) {
        event.preventDefault()
        zoomOut()
      }
      break
    case 'f':
      if (event.ctrlKey) {
        event.preventDefault()
        // Focus search input
        const searchInput = document.querySelector('.pdf-toolbar input[type="text"]')
        if (searchInput) {
          searchInput.focus()
        }
      }
      break
  }
}

// Watchers
watch(() => props.pdfUrl, () => {
  if (props.pdfUrl) {
    loadPDF()
  }
}, { immediate: true })

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  if (pdfDocument.value) {
    pdfDocument.value.destroy()
  }
})
</script>

<style scoped>
.pdf-viewer {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.pdf-content {
  background: #f5f5f5;
}

.pdf-page {
  border: 1px solid #ddd;
  border-radius: 4px;
}

.pdf-pages-container {
  min-height: 100%;
}

/* Scrollbar styling */
.pdf-content::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

.pdf-content::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.pdf-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 6px;
}

.pdf-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>