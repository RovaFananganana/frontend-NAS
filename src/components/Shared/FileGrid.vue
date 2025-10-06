<template>
  <div class="file-grid">
    <div
      v-for="item in items"
      :key="item.id"
      class="file-tile"
      :class="{ selected: isSelected(item) }"
      tabindex="0"
      @click="toggleSelect(item)"
      @dblclick="openItem(item)"
      @keydown.enter.prevent="openItem(item)"
    >
      <div class="file-icon">
        <i :class="item.type === 'folder' ? 'i-folder' : 'i-file'" />
      </div>
      <div class="file-name">{{ item.name }}</div>
    </div>
  </div>
</template>

<script setup>
// ============================================================================
// 🧱 FileGrid.vue — Vue en grille de fichiers
// ============================================================================
import { computed } from 'vue'
const props = defineProps({
  items: { type: Array, default: () => [] },
  selected: { type: Array, default: () => [] },
})
const emit = defineEmits(['open', 'select'])

const isSelected = (item) => props.selected.some(f => f.id === item.id)
const toggleSelect = (item) => emit('select', item)
const openItem = (item) => emit('open', item)
</script>

<style scoped>
.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 1rem;
}

.file-tile {
  background: var(--tile-bg, #f9f9f9);
  border-radius: 0.75rem;
  padding: 1rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.file-tile:hover {
  background: var(--tile-hover-bg, #eef2f6);
}
.file-tile.selected {
  border: 2px solid #007bff;
}

.file-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}
.file-name {
  font-size: 0.9rem;
  word-break: break-word;
}
</style>
