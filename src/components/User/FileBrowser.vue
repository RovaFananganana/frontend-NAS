<template>
  <section class="p-4 space-y-4">
    <header class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold">Mes fichiers</h2>
        <nav class="text-sm text-gray-500 mt-1">
          <span v-for="(b, i) in breadcrumbs" :key="b.path">
            <button class="underline" @click="goToBreadcrumb(i)">{{ b.name || '/' }}</button>
            <span v-if="i < breadcrumbs.length - 1"> / </span>
          </span>
        </nav>
      </div>

      <div class="flex items-center gap-2">
        <button class="btn" @click="toggleView">
          {{ view === 'grid' ? 'Liste' : 'Grille' }}
        </button>
        <button class="btn" @click="openNew(true)">Nouveau dossier</button>
        <button class="btn" @click="openNew(false)">Nouveau fichier (placeholder)</button>
        <FileUpload @uploaded="fetchFiles" />
      </div>
    </header>

    <div class="flex items-center gap-4">
      <input v-model="filter" placeholder="Rechercher..." class="input w-60" @input="applyFilter" />
      <label class="flex items-center gap-2 text-sm">
        <input type="checkbox" v-model="showFavoritesOnly" /> Favoris
      </label>
    </div>

    <div v-if="error" class="alert alert-error">{{ error }}</div>

    <!-- Grid view -->
    <div v-if="view === 'grid'" class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div v-for="item in displayed" :key="item.id" class="card p-3 bg-white rounded-lg border">
        <div class="flex items-start justify-between">
          <div @dblclick="openItem(item)" class="cursor-pointer">
            <div class="text-sm text-gray-500">{{ item.type === 'folder' ? 'Dossier' : 'Fichier' }}</div>
            <div class="font-medium">{{ item.name }}</div>
            <div class="text-xs text-gray-400 mt-1">{{ item.size ? human(item.size) : '' }}</div>
          </div>
          <div class="flex flex-col gap-1 items-end">
            <button class="text-sm" @click="toggleFavorite(item)">{{ isFavorite(item) ? '★' : '☆' }}</button>
            <div class="dropdown">
              <button class="btn-sm">⋯</button>
              <div class="dropdown-content card p-2 mt-2">
                <button class="w-full text-left" @click="openRename(item)">Renommer</button>
                <button class="w-full text-left" @click="confirmDelete(item)">Supprimer</button>
                <button class="w-full text-left" @click="openShare(item)">Partager</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- List view -->
    <div v-else class="bg-white rounded-lg border overflow-hidden">
      <div class="grid grid-cols-6 gap-2 bg-gray-50 p-2 text-sm text-gray-500">
        <div>Nom</div><div>Type</div><div>Taille</div><div>Date</div><div>Favori</div><div class="text-right">Actions</div>
      </div>
      <div v-for="item in displayed" :key="item.id" class="grid grid-cols-6 gap-2 items-center p-2 border-t">
        <div @dblclick="openItem(item)" class="cursor-pointer">{{ item.name }}</div>
        <div>{{ item.type }}</div>
        <div>{{ item.size ? human(item.size) : '—' }}</div>
        <div>{{ formatDate(item.updated_at || item.created_at) }}</div>
        <div>
          <button @click="toggleFavorite(item)">{{ isFavorite(item) ? '★' : '☆' }}</button>
        </div>
        <div class="text-right">
          <button class="btn-sm" @click="openRename(item)">Renommer</button>
          <button class="btn-sm danger" @click="confirmDelete(item)">Supprimer</button>
          <button class="btn-sm" @click="openShare(item)">Partager</button>
        </div>
      </div>
    </div>

    <!-- New item modal -->
    <Modal
      :visible="newModalVisible"
      :title="newIsFolder ? 'Nouveau dossier' : 'Nouveau fichier (placeholder)'"
      show-confirm
      @close="newModalVisible = false"
      @confirm="createNew"
    >
      <input v-model="newName" placeholder="Nom" class="border p-2 w-full mb-2" />
      <div v-if="!newIsFolder" class="text-sm text-gray-500">Pour les fichiers, le téléversement est géré via l'upload existant.</div>
    </Modal>

    <!-- Rename modal -->
    <Modal
      :visible="renameModalVisible"
      title="Renommer"
      show-confirm
      @close="renameModalVisible = false"
      @confirm="renameConfirm"
    >
      <input v-model="renameValue" placeholder="Nouveau nom" class="border p-2 w-full" />
    </Modal>

    <!-- Confirm delete -->
    <Modal
      :visible="deleteModalVisible"
      title="Confirmer la suppression"
      show-confirm
      @close="deleteModalVisible = false"
      @confirm="deleteConfirm"
    >
      <p>Voulez-vous supprimer <strong>{{ toDelete?.name }}</strong> ?</p>
    </Modal>

    <!-- Share modal -->
    <Modal
      :visible="shareModalVisible"
      title="Partager"
      show-confirm
      @close="shareModalVisible = false"
      @confirm="shareConfirm"
    >
      <div class="mb-2">
        <label class="text-sm">Partager avec (utilisateur id ou email)</label>
        <input v-model="shareTarget" placeholder="ex : user@example.com ou 12" class="border p-2 w-full" />
      </div>
      <div class="mb-2">
        <label class="text-sm">Permissions</label>
        <select v-model="sharePermission" class="border p-2 w-full">
          <option value="read">Lecture</option>
          <option value="write">Lecture / écriture</option>
        </select>
      </div>
      <div class="text-xs text-gray-500">Note: l'API de partage doit exister côté backend (POST /files/share) — sinon adapte l'URL.</div>
    </Modal>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Modal from '@/components/Shared/Modal.vue'
import { userAPI } from '@/services/api'
import FileUpload from '../Shared/FileUpload.vue'
import api from '@/services/api' // pour appels libres

const view = ref('grid') // 'grid' | 'list'
const currentPath = ref('/') // string path representation
const items = ref([]) // files + folders
const filter = ref('')
const showFavoritesOnly = ref(false)
const favorites = ref(new Set())
const error = ref('')
const loading = ref(false)


// modals state
const newModalVisible = ref(false)
const newIsFolder = ref(true)
const newName = ref('')

const renameModalVisible = ref(false)
const renameValue = ref('')
const renameTarget = ref(null)

const deleteModalVisible = ref(false)
const toDelete = ref(null)

const shareModalVisible = ref(false)
const shareTarget = ref('')
const sharePermission = ref('read')
const shareTargetItem = ref(null)


// breadcrumbs
const breadcrumbs = computed(() => {
  const parts = currentPath.value === '/' ? [''] : currentPath.value.split('/').filter(Boolean)
  const acc = []
  let p = ''
  acc.push({ name: '/', path: '/' })
  for (const part of parts) {
    p = p === '/' ? `/${part}` : `${p}/${part}`
    acc.push({ name: part, path: p })
  }
  return acc
})

const displayed = computed(() => {
  let list = items.value.slice()
  if (filter.value) {
    const q = filter.value.toLowerCase()
    list = list.filter(i => (i.name || '').toLowerCase().includes(q))
  }
  if (showFavoritesOnly.value) {
    list = list.filter(i => favorites.value.has(i.id))
  }
  return list
})

function toggleView() {
  view.value = view.value === 'grid' ? 'list' : 'grid'
}

function human(v) {
  if (v === 0) return '0 B'
  if (!v) return '—'
  const i = Math.floor(Math.log(v) / Math.log(1024))
  const sizes = ['B','KB','MB','GB','TB']
  return `${(v / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
}

function formatDate(v) {
  if (!v) return '—'
  return new Date(v).toLocaleString()
}

function applyFilter() {
  // computed displayed handles filter
}

function isFavorite(item) {
  return favorites.value.has(item.id)
}
function toggleFavorite(item) {
  if (favorites.value.has(item.id)) favorites.value.delete(item.id)
  else favorites.value.add(item.id)
  // optionally persist to server/localStorage
  localStorage.setItem('favorites', JSON.stringify(Array.from(favorites.value)))
}

function openNew(isFolder) {
  newIsFolder.value = isFolder
  newName.value = ''
  newModalVisible.value = true
}

function openRename(item) {
  renameTarget.value = item
  renameValue.value = item.name
  renameModalVisible.value = true
}

async function renameConfirm() {
  if (!renameTarget.value) return
  try {
    // try using userAPI.updateFolder or generic endpoint
    if (renameTarget.value.type === 'folder') {
      await userAPI.updateFolder(renameTarget.value.id, renameValue.value)
    } else {
      // generic file rename - assuming there's an endpoint; fallback to api.put
      await api.put(`/files/files/${renameTarget.value.id}`, { name: renameValue.value })
    }
    renameModalVisible.value = false
    await load()
  } catch (e) {
    alert(e?.response?.data?.message || e?.message || 'Erreur renommage')
  }
}

function confirmDelete(item) {
  toDelete.value = item
  deleteModalVisible.value = true
}

async function deleteConfirm() {
  if (!toDelete.value) return
  try {
    if (toDelete.value.type === 'folder') {
      await userAPI.deleteFolder(toDelete.value.id)
    } else {
      await userAPI.deleteFile(toDelete.value.id)
    }
    deleteModalVisible.value = false
    await load()
  } catch (e) {
    alert(e?.response?.data?.message || e?.message || 'Erreur suppression')
  }
}

function openShare(item) {
  shareTargetItem.value = item
  shareTarget.value = ''
  sharePermission.value = 'read'
  shareModalVisible.value = true
}

async function shareConfirm() {
  if (!shareTargetItem.value) return
  try {
    // best-effort: POST /files/share
    await api.post('/files/share', {
      item_id: shareTargetItem.value.id,
      item_type: shareTargetItem.value.type,
      target: shareTarget,
      permission: sharePermission,
    })
    shareModalVisible.value = false
    alert('Partage demandé (vérifie l\'API backend si nécessaire)')
  } catch (e) {
    alert(e?.response?.data?.message || e?.message || 'Erreur partage')
  }
}

async function createNew() {
  if (!newName.value) return alert('Donne un nom')
  try {
    if (newIsFolder.value) {
      // create folder under current path
      await userAPI.createFolder(newName.value, currentPath.value === '/' ? null : currentPath.value)
    } else {
      // placeholder: real upload should use file.upload endpoint
      await api.post('/files/upload', {
        name: newName.value,
        folder_path: currentPath.value,
      })
    }
    newModalVisible.value = false
    await load()
  } catch (e) {
    alert(e?.response?.data?.message || e?.message || 'Erreur création')
  }
}

function goToBreadcrumb(index) {
  const b = breadcrumbs.value[index]
  if (b) {
    currentPath.value = b.path
    load()
  }
}

async function openItem(item) {
  if (item.type === 'folder') {
    // assume folder path in item.path
    currentPath.value = item.path || (currentPath.value === '/' ? `/${item.name}` : `${currentPath.value}/${item.name}`)
    await load()
  } else {
    // open file (download or preview)
    window.open(`/files/${item.id}/download`, '_blank')
  }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    // we use userAPI.getFolders & getFiles based on your services/api.js
    const fd = await userAPI.getFolders(currentPath.value === '/' ? null : currentPath.value)
    const fl = await userAPI.getFiles(currentPath.value === '/' ? null : currentPath.value)
    // normalize into items array
    const folders = (fd.data || []).map(f => ({ ...f, type: 'folder' }))
    const files = (fl.data || []).map(f => ({ ...f, type: 'file' }))
    items.value = [...folders, ...files]
    // load favorites from localStorage
    const fav = JSON.parse(localStorage.getItem('favorites') || '[]')
    favorites.value = new Set(fav)
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || 'Erreur chargement'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.input { @apply border rounded px-3 py-2; }
.btn { @apply px-3 py-2 rounded border bg-white hover:bg-gray-50; }
.btn-sm { @apply px-2 py-1 rounded border text-sm; }
.card { @apply rounded-lg shadow-sm; }
.alert-error { @apply bg-red-50 border border-red-200 text-red-700 p-2 rounded; }

/* simple dropdown (for illustration) */
.dropdown { position: relative; }
.dropdown-content { position: absolute; right: 0; display: flex; flex-direction: column; gap: 4px; z-index: 30; background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 6px; min-width: 160px; }
</style>
