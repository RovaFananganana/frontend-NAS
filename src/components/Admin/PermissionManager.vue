<template>
  <div class="p-6">
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="text-lg font-bold mb-4">Gestion des permissions par dossier</h2>

        <!-- Cas aucun dossier -->
        <div v-if="folders.length === 0" class="text-center text-gray-500">
          Aucun dossier chargé
        </div>

        <!-- Tableau des dossiers et permissions -->
        <div v-else class="overflow-x-auto">
          <table class="table table-zebra w-full">
            <thead>
              <tr>
                <th>Dossier</th>
                <th>Utilisateur / Groupe</th>
                <th>Lecture</th>
                <th>Écriture</th>
                <th>Suppression</th>
                <th>Partage</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="folder in folders" :key="folder.id">
                <tr v-for="perm in folder.permissions" :key="perm.id">
                  <td>{{ folder.name }}</td>
                  <td>{{ perm.target_name }}</td>
                  <td>
                    <button
                      :class="['badge badge-xs cursor-pointer', perm.can_read ? 'badge-success' : 'badge-outline']"
                      @click="toggleRight(folder, perm, 'can_read')"
                    >R</button>
                  </td>
                  <td>
                    <button
                      :class="['badge badge-xs cursor-pointer', perm.can_write ? 'badge-success' : 'badge-outline']"
                      @click="toggleRight(folder, perm, 'can_write')"
                    >W</button>
                  </td>
                  <td>
                    <button
                      :class="['badge badge-xs cursor-pointer', perm.can_delete ? 'badge-success' : 'badge-outline']"
                      @click="toggleRight(folder, perm, 'can_delete')"
                    >D</button>
                  </td>
                  <td>
                    <button
                      :class="['badge badge-xs cursor-pointer', perm.can_share ? 'badge-success' : 'badge-outline']"
                      @click="toggleRight(folder, perm, 'can_share')"
                    >S</button>
                  </td>
                  <td class="flex gap-1">
                    <button class="btn btn-xs btn-success" @click="openAddPermissionModal(folder)">+</button>
                    <button class="btn btn-xs btn-warning" @click="editPermission(folder, perm)">✎</button>
                    <button class="btn btn-xs btn-error" @click="removePermission(folder, perm)">🗑</button>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal pour ajouter/modifier une permission -->
    <div v-if="modal.visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-4 rounded shadow-lg w-96">
        <h3 class="font-bold mb-2">
          {{ modal.editing ? 'Modifier' : 'Ajouter' }} permission pour {{ modal.folder?.name }}
        </h3>
        <div class="flex flex-col gap-2 mb-4">
          <label>
            Type:
            <select v-model="modal.targetType" class="input input-bordered w-full" :disabled="modal.editing">
              <option value="user">Utilisateur</option>
              <option value="group">Groupe</option>
            </select>
          </label>
          <label>
            Nom:
            <input v-model="modal.targetName" class="input input-bordered w-full" placeholder="Nom utilisateur ou groupe" :disabled="modal.editing"/>
          </label>
          <div class="flex flex-col gap-1">
            <label><input type="checkbox" v-model="modal.permissions.can_read" /> Lecture</label>
            <label><input type="checkbox" v-model="modal.permissions.can_write" /> Écriture</label>
            <label><input type="checkbox" v-model="modal.permissions.can_delete" /> Suppression</label>
            <label><input type="checkbox" v-model="modal.permissions.can_share" /> Partage</label>
          </div>
        </div>
        <div class="flex justify-end gap-2">
          <button class="btn btn-sm" @click="closeModal">Annuler</button>
          <button class="btn btn-sm btn-primary" @click="savePermission">
            {{ modal.editing ? 'Enregistrer' : 'Ajouter' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { permissionAPI } from '@/services/api'
import { useStore } from 'vuex'

const store = useStore()
const folders = ref([])
const users = ref([])
const groups = ref([])

const modal = ref({
  visible: false,
  editing: false,
  folder: null,
  targetType: 'user',
  targetName: '',
  permissions: { can_read: false, can_write: false, can_delete: false, can_share: false }
})

// Chargement des dossiers + permissions + utilisateurs/groupes
const loadFolders = async () => {
  try {
    const res = await permissionAPI.getAllResources()
    folders.value = res.data.folders.map(f => ({
      id: f.id,
      name: f.name,
      permissions: (f.permissions || []).map(p => ({
        id: p.id,
        target_name: p.target_name,
        target_type: p.type,
        can_read: p.can_read,
        can_write: p.can_write,
        can_delete: p.can_delete,
        can_share: p.can_share
      }))
    }))
    users.value = res.data.users || []
    groups.value = res.data.groups || []
  } catch (err) {
    console.error('Erreur lors du chargement:', err)
    store.dispatch('showError', 'Impossible de charger les dossiers')
  }
}

// Toggle droit
const toggleRight = async (folder, perm, right) => {
  const payload = { [right]: !perm[right] }
  try {
    if (perm.target_type === 'user') {
      await permissionAPI.setFolderUserPermission(folder.id, perm.id, payload)
    } else {
      await permissionAPI.setFolderGroupPermission(folder.id, perm.id, payload)
    }
    perm[right] = !perm[right]
    store.dispatch('showSuccess', `Permission ${right} mise à jour pour ${perm.target_name}`)
  } catch (err) {
    console.error(err)
    store.dispatch('showError', 'Impossible de modifier la permission')
  }
}

// Supprimer permission
const removePermission = async (folder, perm) => {
  try {
    await permissionAPI.deleteFolderPermission(folder.id, perm.id)
    folder.permissions = folder.permissions.filter(p => p.id !== perm.id)
    store.dispatch('showSuccess', `Permission supprimée pour ${perm.target_name}`)
  } catch (err) {
    console.error(err)
    store.dispatch('showError', 'Impossible de supprimer la permission')
  }
}

// Modal
const openAddPermissionModal = (folder) => {
  modal.value.visible = true
  modal.value.editing = false
  modal.value.folder = folder
  modal.value.targetType = 'user'
  modal.value.targetName = ''
  modal.value.permissions = { can_read: false, can_write: false, can_delete: false, can_share: false }
}

const editPermission = (folder, perm) => {
  modal.value.visible = true
  modal.value.editing = true
  modal.value.folder = folder
  modal.value.targetType = perm.target_type
  modal.value.targetName = perm.target_name
  modal.value.permissions = { 
    can_read: perm.can_read,
    can_write: perm.can_write,
    can_delete: perm.can_delete,
    can_share: perm.can_share
  }
  modal.value.editingId = perm.id
}

const closeModal = () => {
  modal.value.visible = false
}

const savePermission = async () => {
  if (!modal.value.targetName) return
  try {
    if (modal.value.editing) {
      // Modification
      const permId = modal.value.editingId
      if (modal.value.targetType === 'user') {
        await permissionAPI.setFolderUserPermission(modal.value.folder.id, permId, modal.value.permissions)
      } else {
        await permissionAPI.setFolderGroupPermission(modal.value.folder.id, permId, modal.value.permissions)
      }
      store.dispatch('showSuccess', 'Permission modifiée')
    } else {
      // Ajout
      let targetId
      if (modal.value.targetType === 'user') {
        const user = users.value.find(u => u.username === modal.value.targetName)
        if (!user) return store.dispatch('showError', 'Utilisateur introuvable')
        targetId = user.id
      } else {
        const group = groups.value.find(g => g.name === modal.value.targetName)
        if (!group) return store.dispatch('showError', 'Groupe introuvable')
        targetId = group.id
      }
      await permissionAPI.setFolderUserPermission(modal.value.folder.id, targetId, modal.value.permissions)
      store.dispatch('showSuccess', 'Permission ajoutée')
    }
    closeModal()
    loadFolders()
  } catch (err) {
    console.error(err)
    store.dispatch('showError', 'Impossible de sauvegarder la permission')
  }
}

onMounted(() => loadFolders())
</script>
