<template>
  <div class="file-toolbar">
    <button @click="$emit('create-folder')" title="Nouveau dossier">📁 Nouveau</button>
    <button @click="$emit('upload')" title="Uploader fichier">⬆️ Upload</button>
    <button @click="$emit('delete')" title="Supprimer sélection">🗑️ Supprimer</button>
    <button @click="$emit('rename')" title="Renommer sélection">✏️ Renommer</button>
    <button @click="$emit('refresh')" title="Actualiser">🔄 Actualiser</button>
    <div class="view-mode">
      <button @click="$emit('set-view', 'grid')" :class="{ active: viewMode==='grid' }">🔳 Grille</button>
      <button @click="$emit('set-view', 'list')" :class="{ active: viewMode==='list' }">📃 Liste</button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
const props = defineProps({
  viewMode: { type: String, default: 'grid' }
})
</script>

<style scoped>
.file-toolbar {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem;
  background: var(--toolbar-bg, #fafafa);
  border-bottom: 1px solid #ddd;
  align-items: center;
}
.file-toolbar button {
  padding: 0.4rem 0.8rem;
  border: 1px solid #ccc;
  border-radius: 0.35rem;
  background: white;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: all 0.2s ease;
}
.file-toolbar button:hover {
  background: #eef2f6;
  border-color: #007bff;
}
.file-toolbar button.active {
  background: #007bff;
  color: white;
}
.view-mode {
  margin-left: auto;
  display: flex;
  gap: 0.25rem;
}
</style>
