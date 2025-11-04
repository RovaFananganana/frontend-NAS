<template>
  <div v-if="isOpen" class="modal modal-open">
    <div class="modal-box max-w-7xl h-[90vh] flex flex-col p-0">
      <SimpleTextEditor
        :file-path="file.path"
        :mode="mode"
        @close="$emit('close')"
        @saved="$emit('saved')"
      />
    </div>
  </div>
</template>

<script setup>
import SimpleTextEditor from './SimpleTextEditor.vue'

defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  file: {
    type: Object,
    required: true
  },
  mode: {
    type: String,
    default: 'edit'
  }
})

defineEmits(['close', 'saved'])
</script>
