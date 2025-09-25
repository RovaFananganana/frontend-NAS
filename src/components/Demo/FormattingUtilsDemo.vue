<template>
  <div class="formatting-utils-demo p-6 bg-base-100 rounded-lg shadow-lg">
    <h2 class="text-2xl font-bold mb-6 text-base-content">Démonstration des utilitaires de formatage</h2>
    
    <!-- File Size Formatting -->
    <div class="mb-8">
      <h3 class="text-lg font-semibold mb-4 text-primary">Formatage des tailles de fichiers</h3>
      <div class="grid grid-cols-2 gap-4">
        <div v-for="size in sampleSizes" :key="size" class="bg-base-200 p-3 rounded">
          <span class="font-mono text-sm">{{ size }} bytes</span>
          <span class="mx-2">→</span>
          <span class="font-semibold text-primary">{{ formatFileSize(size) }}</span>
        </div>
      </div>
    </div>

    <!-- Date Formatting -->
    <div class="mb-8">
      <h3 class="text-lg font-semibold mb-4 text-primary">Formatage des dates</h3>
      <div class="space-y-2">
        <div v-for="date in sampleDates" :key="date" class="bg-base-200 p-3 rounded">
          <div class="text-sm text-base-content/70">{{ date }}</div>
          <div class="mt-1">
            <span class="badge badge-outline mr-2">Complet:</span>
            <span class="font-semibold">{{ formatDate(date, 'full') }}</span>
          </div>
          <div class="mt-1">
            <span class="badge badge-outline mr-2">Relatif:</span>
            <span class="font-semibold">{{ formatDate(date, 'relative') }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- File Type Detection -->
    <div class="mb-8">
      <h3 class="text-lg font-semibold mb-4 text-primary">Détection des types de fichiers</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="file in sampleFiles" :key="file.name" class="bg-base-200 p-4 rounded-lg">
          <div class="flex items-center space-x-3 mb-2">
            <div :class="[
              'w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br',
              getFileIcon(file).bgColor
            ]">
              <i :class="[getFileIcon(file).icon, getFileIcon(file).textColor]"></i>
            </div>
            <div>
              <div class="font-semibold">{{ file.name }}</div>
              <div class="text-sm text-base-content/70">{{ getFileType(file) }}</div>
            </div>
          </div>
          <div class="text-xs space-y-1">
            <div><span class="font-medium">Extension:</span> {{ detectFileType(file.name).extension }}</div>
            <div><span class="font-medium">Catégorie:</span> {{ detectFileType(file.name).category }}</div>
            <div><span class="font-medium">MIME:</span> {{ getMimeType(file.name) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- File Type Checkers -->
    <div class="mb-8">
      <h3 class="text-lg font-semibold mb-4 text-primary">Vérificateurs de types</h3>
      <div class="overflow-x-auto">
        <table class="table table-sm w-full">
          <thead>
            <tr>
              <th>Fichier</th>
              <th>Image</th>
              <th>Vidéo</th>
              <th>Audio</th>
              <th>Document</th>
              <th>Code</th>
              <th>Archive</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="file in sampleFiles" :key="file.name">
              <td class="font-mono text-sm">{{ file.name }}</td>
              <td><span :class="isImageFile(file.name) ? 'text-success' : 'text-base-content/30'">{{ isImageFile(file.name) ? '✓' : '✗' }}</span></td>
              <td><span :class="isVideoFile(file.name) ? 'text-success' : 'text-base-content/30'">{{ isVideoFile(file.name) ? '✓' : '✗' }}</span></td>
              <td><span :class="isAudioFile(file.name) ? 'text-success' : 'text-base-content/30'">{{ isAudioFile(file.name) ? '✓' : '✗' }}</span></td>
              <td><span :class="isDocumentFile(file.name) ? 'text-success' : 'text-base-content/30'">{{ isDocumentFile(file.name) ? '✓' : '✗' }}</span></td>
              <td><span :class="isCodeFile(file.name) ? 'text-success' : 'text-base-content/30'">{{ isCodeFile(file.name) ? '✓' : '✗' }}</span></td>
              <td><span :class="isArchiveFile(file.name) ? 'text-success' : 'text-base-content/30'">{{ isArchiveFile(file.name) ? '✓' : '✗' }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Sorting Demo -->
    <div class="mb-8">
      <h3 class="text-lg font-semibold mb-4 text-primary">Démonstration du tri</h3>
      <div class="flex gap-2 mb-4">
        <select v-model="sortBy" class="select select-sm select-bordered">
          <option value="name">Nom</option>
          <option value="size">Taille</option>
          <option value="type">Type</option>
          <option value="modified">Date</option>
        </select>
        <select v-model="sortOrder" class="select select-sm select-bordered">
          <option value="asc">Croissant</option>
          <option value="desc">Décroissant</option>
        </select>
      </div>
      <div class="space-y-2">
        <div v-for="file in sortedFiles" :key="file.name" class="flex items-center justify-between bg-base-200 p-2 rounded">
          <div class="flex items-center space-x-2">
            <div :class="[
              'w-6 h-6 rounded flex items-center justify-center bg-gradient-to-br text-xs',
              getFileIcon(file).bgColor,
              getFileIcon(file).textColor
            ]">
              <i :class="getFileIcon(file).icon"></i>
            </div>
            <span class="font-medium">{{ file.name }}</span>
          </div>
          <div class="text-sm text-base-content/70">
            {{ file.size ? formatFileSize(file.size) : 'Dossier' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  formatFileSize,
  formatDate,
  detectFileType,
  getFileIcon,
  getFileType,
  getMimeType,
  isImageFile,
  isVideoFile,
  isAudioFile,
  isDocumentFile,
  isCodeFile,
  isArchiveFile,
  sortFiles
} from '@/utils/fileUtils.js'

// Sample data
const sampleSizes = [0, 512, 1024, 1536, 1048576, 2097152, 1073741824, 5368709120]

const sampleDates = [
  new Date().toISOString(), // Now
  new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
  new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
  '2024-01-15T10:30:00Z'
]

const sampleFiles = [
  { name: 'Documents', is_directory: true },
  { name: 'rapport.pdf', is_directory: false, size: 2048576, modified_time: '2024-01-15T10:30:00Z' },
  { name: 'photo.jpg', is_directory: false, size: 1048576, modified_time: '2024-01-14T15:20:00Z' },
  { name: 'video.mp4', is_directory: false, size: 52428800, modified_time: '2024-01-13T09:15:00Z' },
  { name: 'musique.mp3', is_directory: false, size: 4194304, modified_time: '2024-01-12T18:45:00Z' },
  { name: 'script.js', is_directory: false, size: 8192, modified_time: '2024-01-11T14:30:00Z' },
  { name: 'archive.zip', is_directory: false, size: 10485760, modified_time: '2024-01-10T11:20:00Z' },
  { name: 'document.docx', is_directory: false, size: 524288, modified_time: '2024-01-09T16:10:00Z' },
  { name: 'tableur.xlsx', is_directory: false, size: 262144, modified_time: '2024-01-08T13:25:00Z' }
]

// Sorting controls
const sortBy = ref('name')
const sortOrder = ref('asc')

const sortedFiles = computed(() => {
  return sortFiles(sampleFiles, sortBy.value, sortOrder.value)
})
</script>

<style scoped>
.formatting-utils-demo {
  max-width: 1200px;
  margin: 0 auto;
}
</style>