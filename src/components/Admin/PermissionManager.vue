<template>
  <div class="p-6 space-y-6">
    <!-- Header with actions -->
    <div class="flex items-center justify-between">

      <div class="flex gap-2">
        <button class="btn btn-sm btn-outline" @click="refreshPermissions" :disabled="loading">
          <i class="fas fa-sync-alt mr-2"></i>
          {{ loading ? 'Actualiser...' : 'Actualiser' }}
        </button>

        <button class="btn btn-sm btn-primary" @click="openBulkPermissionModal">
          <i class="fas fa-users-cog mr-2"></i>
          Permissions groupées
        </button>
      </div>
    </div>

    <!-- Filters and search -->
    <div class="flex items-center gap-4 flex-wrap">
      <div class="flex-1 min-w-64">
        <div class="relative">
          <input v-model="searchQuery" placeholder="Recherche par nom..."
            class="input input-bordered w-full pl-10" />
          <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
        </div>
      </div>

      <select v-model="filterPermission" class="select select-bordered">
        <option value="all">Toutes les permissions</option>
        <option value="read">Lecture</option>
        <option value="write">Écriture</option>
        <option value="delete">Suppression</option>
        <option value="share">Partage</option>
      </select>
    </div>

    <!-- Loading state -->
    <div v-if="loading && folders.length === 0" class="space-y-4">
      <div v-for="i in 5" :key="i" class="skeleton h-16 w-full"></div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="alert alert-error">
      <i class="fas fa-exclamation-triangle"></i>
      <span>{{ error }}</span>
      <button class="btn btn-sm btn-outline" @click="loadFolders">
        <i class="fas fa-refresh mr-2"></i>
        Retry
      </button>
    </div>

    <!-- Empty state -->
    <div v-else-if="filteredFolders.length === 0" class="text-center py-12">
      <i class="fas fa-folder-open text-6xl text-gray-300 mb-4"></i>
      <h3 class="text-lg font-semibold text-gray-600 mb-2">No folders found</h3>
      <p class="text-gray-500">
        {{ searchQuery ? 'No folders match your search criteria' : 'No folders have been created yet' }}
      </p>
    </div>

    <!-- Permission cards view -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      <div v-for="folder in paginatedFolders" :key="folder.id"
        class="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
        <div class="card-body">
          <!-- Folder header -->
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center">
              <i class="fas fa-folder text-primary text-xl mr-3"></i>
              <div>
                <h3 class="font-semibold text-lg">{{ folder.name }}</h3>
                <p class="text-sm text-base-content/70">{{ folder.permissions.length }} permission(s)</p>
              </div>
            </div>
            <div class="dropdown dropdown-end">
              <button tabindex="0" class="btn btn-ghost btn-sm">
                <i class="fas fa-ellipsis-v"></i>
              </button>
              <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
                <li><a @click="openAddPermissionModal(folder)"><i class="fas fa-plus mr-2"></i>Ajouter permission</a></li>
                <li><a @click="viewFolderDetails(folder)"><i class="fas fa-eye mr-2"></i>Voir détails</a></li>
                <li><a @click="exportFolderPermissions(folder)"><i class="fas fa-download mr-2"></i>Exporter</a></li>
              </ul>
            </div>
          </div>

          <!-- Permissions list -->
          <div class="space-y-3 max-h-64 overflow-y-auto">
            <div v-for="perm in folder.permissions" :key="perm.id"
              class="flex items-center justify-between p-3 bg-base-200 rounded-lg">
              <div class="flex items-center flex-1">
                <div class="avatar placeholder mr-3">
                  <div class="bg-neutral-focus text-neutral-content rounded-full w-8">
                    <i class="fas" :class="perm.target_type === 'user' ? 'fa-user' : 'fa-users'"></i>
                  </div>
                </div>
                <div class="flex-1">
                  <div class="font-medium">{{ perm.target_name }}</div>
                  <div class="text-xs text-base-content/70">{{ perm.target_type }}</div>
                </div>
              </div>

              <!-- Permission badges -->
              <div class="flex gap-1 mr-3">
                <button :class="['badge badge-xs cursor-pointer transition-colors',
                  perm.can_read ? 'badge-success' : 'badge-outline hover:badge-success']"
                  @click="confirmTogglePermission(folder, perm, 'can_read', !perm.can_read)"
                  :title="perm.can_read ? 'Retirer l\'accès en lecture' : 'Accorder l\'accès en lecture'">
                  R
                </button>
                <button :class="['badge badge-xs cursor-pointer transition-colors',
                  perm.can_write ? 'badge-warning' : 'badge-outline hover:badge-warning']"
                  @click="confirmTogglePermission(folder, perm, 'can_write', !perm.can_write)"
                  :title="perm.can_write ? 'Retirer l\'accès en écriture' : 'Accorder l\'accès en écriture'">
                  W
                </button>
                <button :class="['badge badge-xs cursor-pointer transition-colors',
                  perm.can_delete ? 'badge-error' : 'badge-outline hover:badge-error']"
                  @click="confirmTogglePermission(folder, perm, 'can_delete', !perm.can_delete)"
                  :title="perm.can_delete ? 'Retirer l\'accès en suppression' : 'Accorder l\'accès en suppression'">
                  D
                </button>
                <button :class="['badge badge-xs cursor-pointer transition-colors',
                  perm.can_share ? 'badge-info' : 'badge-outline hover:badge-info']"
                  @click="confirmTogglePermission(folder, perm, 'can_share', !perm.can_share)"
                  :title="perm.can_share ? 'Retirer l\'accès au partage' : 'Accorder l\'accès au partage'">
                  S
                </button>
              </div>

              <!-- Actions -->
              <button @click="confirmRemovePermission(folder, perm)" 
                class="btn btn-ghost btn-xs text-error hover:bg-error hover:text-error-content"
                title="Supprimer cette permission">
                <i class="fas fa-trash"></i>
              </button>
            </div>

            <!-- Empty permissions state -->
            <div v-if="folder.permissions.length === 0" class="text-center py-6 text-base-content/50">
              <i class="fas fa-lock text-2xl mb-2"></i>
              <p class="text-sm">No permissions set</p>
              <button class="btn btn-xs btn-primary mt-2" @click="openAddPermissionModal(folder)">
                Add Permission
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex justify-center">
      <div class="btn-group">
        <button class="btn btn-sm" :disabled="currentPage === 1" @click="currentPage = 1">
          <i class="fas fa-angle-double-left"></i>
        </button>
        <button class="btn btn-sm" :disabled="currentPage === 1" @click="currentPage--">
          <i class="fas fa-angle-left"></i>
        </button>
        <span class="btn btn-sm btn-disabled">
          {{ currentPage }} / {{ totalPages }}
        </span>
        <button class="btn btn-sm" :disabled="currentPage === totalPages" @click="currentPage++">
          <i class="fas fa-angle-right"></i>
        </button>
        <button class="btn btn-sm" :disabled="currentPage === totalPages" @click="currentPage = totalPages">
          <i class="fas fa-angle-double-right"></i>
        </button>
      </div>
    </div>

    <!-- Modal pour ajouter/modifier une permission -->
    <div v-if="modal.visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-xl w-96 max-w-md">
        <h3 class="font-bold text-lg mb-4">
          {{ modal.editing ? 'Modifier' : 'Ajouter' }} permission pour {{ modal.folder?.name }}
        </h3>
        <div class="flex flex-col gap-4 mb-6">
          <label class="form-control">
            <div class="label">
              <span class="label-text">Type:</span>
            </div>
            <select v-model="modal.targetType" class="select select-bordered w-full" :disabled="modal.editing"
              @change="onTargetTypeChange">
              <option value="user">Utilisateur</option>
              <option value="group">Groupe</option>
            </select>
          </label>

          <label class="form-control">
            <div class="label">
              <span class="label-text">{{ modal.targetType === 'user' ? 'Utilisateur' : 'Groupe' }}:</span>
            </div>
            <select v-model="modal.targetId" class="select select-bordered w-full" :disabled="modal.editing">
              <option value="">-- Sélectionner --</option>
              <option v-for="item in availableTargets" :key="item.id" :value="item.id">
                {{ item.name }}
              </option>
            </select>
          </label>

          <div class="form-control">
            <div class="label">
              <span class="label-text">Permissions:</span>
            </div>
            <div class="flex flex-col gap-2">
              <label class="cursor-pointer label justify-start gap-3">
                <input type="checkbox" v-model="modal.permissions.can_read" class="checkbox checkbox-success" />
                <span class="label-text">Lecture</span>
              </label>
              <label class="cursor-pointer label justify-start gap-3">
                <input type="checkbox" v-model="modal.permissions.can_write" class="checkbox checkbox-warning" />
                <span class="label-text">Écriture</span>
              </label>
              <label class="cursor-pointer label justify-start gap-3">
                <input type="checkbox" v-model="modal.permissions.can_delete" class="checkbox checkbox-error" />
                <span class="label-text">Suppression</span>
              </label>
              <label class="cursor-pointer label justify-start gap-3">
                <input type="checkbox" v-model="modal.permissions.can_share" class="checkbox checkbox-info" />
                <span class="label-text">Partage</span>
              </label>
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-2">
          <button class="btn btn-outline" @click="closeModal">Annuler</button>
          <button class="btn btn-primary" @click="showConfirmationModal" :disabled="!modal.targetId">
            {{ modal.editing ? 'Enregistrer' : 'Ajouter' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de confirmation -->
    <div v-if="confirmationModal.visible"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-xl w-96 max-w-md">
        <h3 class="font-bold text-lg mb-4 flex items-center">
          <i class="fas fa-exclamation-triangle text-warning mr-2"></i>
          Confirmer l'ajout de permission
        </h3>
        <div class="mb-6">
          <p class="mb-4">Vous êtes sur le point d'ajouter les permissions suivantes :</p>
          <div class="bg-base-200 p-4 rounded-lg">
            <div class="font-semibold mb-2">
              <i class="fas fa-folder mr-2"></i>{{ modal.folder?.name }}
            </div>
            <div class="mb-2">
              <i class="fas mr-2" :class="modal.targetType === 'user' ? 'fa-user' : 'fa-users'"></i>
              {{ getTargetName() }} ({{ modal.targetType === 'user' ? 'Utilisateur' : 'Groupe' }})
            </div>
            <div class="flex gap-2 flex-wrap">
              <span v-if="modal.permissions.can_read" class="badge badge-success">Lecture</span>
              <span v-if="modal.permissions.can_write" class="badge badge-warning">Écriture</span>
              <span v-if="modal.permissions.can_delete" class="badge badge-error">Suppression</span>
              <span v-if="modal.permissions.can_share" class="badge badge-info">Partage</span>
              <span v-if="!hasAnyPermission" class="badge badge-outline">Aucune permission</span>
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-2">
          <button class="btn btn-outline" @click="closeConfirmationModal">Annuler</button>
          <button class="btn btn-primary" @click="confirmSavePermission">
            <i class="fas fa-check mr-2"></i>
            Confirmer
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de succès -->
    <div v-if="successModal.visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-xl w-96 max-w-md">
        <div class="text-center">
          <div
            class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-success text-success-content mb-4">
            <i class="fas fa-check text-xl"></i>
          </div>
          <h3 class="font-bold text-lg mb-2">Permission ajoutée avec succès !</h3>
          <p class="text-base-content/70 mb-6">
            La permission a été accordée à {{ successModal.targetName }} pour le dossier {{ successModal.folderName }}.
          </p>
          <button class="btn btn-primary" @click="closeSuccessModal">
            <i class="fas fa-thumbs-up mr-2"></i>
            Parfait !
          </button>
        </div>
      </div>
    </div>



    <!-- Modal de confirmation de suppression de dossier -->
    <div v-if="deleteModal.visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-xl w-96 max-w-md">
        <h3 class="font-bold text-lg mb-4 flex items-center">
          <i class="fas fa-exclamation-triangle text-error mr-2"></i>
          Supprimer le dossier
        </h3>
        <div class="mb-6">
          <p class="mb-4">Êtes-vous sûr de vouloir supprimer le dossier :</p>
          <div class="bg-base-200 p-3 rounded-lg mb-4">
            <div class="flex items-center">
              <i class="fas fa-folder text-primary mr-2"></i>
              <span class="font-semibold">{{ deleteModal.folder?.name }}</span>
            </div>
            <div class="text-sm text-base-content/70 mt-1">
              {{ deleteModal.folder?.permissions?.length || 0 }} permission(s)
            </div>
          </div>
          <div class="alert alert-error">
            <i class="fas fa-warning"></i>
            <span class="text-sm">Cette action est irréversible. Toutes les permissions associées seront perdues.</span>
          </div>
        </div>
        <div class="flex justify-end gap-2">
          <button class="btn btn-outline" @click="closeDeleteModal">Annuler</button>
          <button class="btn btn-error" @click="deleteFolderDirect" :disabled="loading">
            <i class="fas fa-trash mr-2"></i>
            Supprimer
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de détails du dossier -->
    <div v-if="detailsModal.visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-xl w-[600px] max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-6">
          <h3 class="font-bold text-xl flex items-center">
            <i class="fas fa-folder text-primary mr-3"></i>
            Détails des permissions - {{ detailsModal.folder?.name }}
          </h3>
          <button @click="closeDetailsModal" class="btn btn-ghost btn-sm">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div v-if="detailsModal.folder?.permissions?.length === 0" class="text-center py-12">
          <i class="fas fa-lock text-6xl text-gray-300 mb-4"></i>
          <h4 class="text-lg font-semibold text-gray-600 mb-2">Aucune permission définie</h4>
          <p class="text-gray-500 mb-4">Ce dossier n'a pas encore de permissions accordées.</p>
          <button class="btn btn-primary" @click="openAddPermissionModal(detailsModal.folder)">
            <i class="fas fa-plus mr-2"></i>
            Ajouter une permission
          </button>
        </div>

        <div v-else class="space-y-4">
          <div v-for="perm in detailsModal.folder?.permissions" :key="perm.id"
            class="border border-base-300 rounded-lg p-4">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center">
                <div class="avatar placeholder mr-3">
                  <div class="bg-neutral-focus text-neutral-content rounded-full w-10">
                    <i class="fas" :class="perm.target_type === 'user' ? 'fa-user' : 'fa-users'"></i>
                  </div>
                </div>
                <div>
                  <div class="font-semibold text-lg">{{ perm.target_name }}</div>
                  <div class="text-sm text-base-content/70 capitalize">{{ perm.target_type === 'user' ? 'Utilisateur' : 'Groupe' }}</div>
                </div>
              </div>
              <button @click="confirmRemovePermission(detailsModal.folder, perm)" 
                class="btn btn-error btn-sm">
                <i class="fas fa-trash mr-2"></i>
                Supprimer
              </button>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                <div class="flex items-center">
                  <i class="fas fa-eye text-success mr-2"></i>
                  <span class="font-medium">Lecture</span>
                </div>
                <input type="checkbox" :checked="perm.can_read" 
                  @change="confirmTogglePermission(detailsModal.folder, perm, 'can_read', $event.target.checked)"
                  class="toggle toggle-success" />
              </div>
              <div class="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                <div class="flex items-center">
                  <i class="fas fa-edit text-warning mr-2"></i>
                  <span class="font-medium">Écriture</span>
                </div>
                <input type="checkbox" :checked="perm.can_write" 
                  @change="confirmTogglePermission(detailsModal.folder, perm, 'can_write', $event.target.checked)"
                  class="toggle toggle-warning" />
              </div>
              <div class="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                <div class="flex items-center">
                  <i class="fas fa-trash text-error mr-2"></i>
                  <span class="font-medium">Suppression</span>
                </div>
                <input type="checkbox" :checked="perm.can_delete" 
                  @change="confirmTogglePermission(detailsModal.folder, perm, 'can_delete', $event.target.checked)"
                  class="toggle toggle-error" />
              </div>
              <div class="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                <div class="flex items-center">
                  <i class="fas fa-share text-info mr-2"></i>
                  <span class="font-medium">Partage</span>
                </div>
                <input type="checkbox" :checked="perm.can_share" 
                  @change="confirmTogglePermission(detailsModal.folder, perm, 'can_share', $event.target.checked)"
                  class="toggle toggle-info" />
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-6">
          <button class="btn btn-outline" @click="closeDetailsModal">Fermer</button>
          <button class="btn btn-primary" @click="openAddPermissionModal(detailsModal.folder)">
            <i class="fas fa-plus mr-2"></i>
            Ajouter permission
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de confirmation pour toggle de permission -->
    <div v-if="toggleModal.visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-xl w-96 max-w-md">
        <h3 class="font-bold text-lg mb-4 flex items-center">
          <i class="fas fa-exclamation-triangle text-warning mr-2"></i>
          Confirmer la modification
        </h3>
        <div class="mb-6">
          <p class="mb-4">Voulez-vous {{ toggleModal.newValue ? 'accorder' : 'retirer' }} la permission suivante ?</p>
          <div class="bg-base-200 p-4 rounded-lg">
            <div class="font-semibold mb-2">
              <i class="fas fa-folder mr-2"></i>{{ toggleModal.folder?.name }}
            </div>
            <div class="mb-2">
              <i class="fas mr-2" :class="toggleModal.permission?.target_type === 'user' ? 'fa-user' : 'fa-users'"></i>
              {{ toggleModal.permission?.target_name }} ({{ toggleModal.permission?.target_type === 'user' ? 'Utilisateur' : 'Groupe' }})
            </div>
            <div class="flex items-center">
              <i class="fas mr-2" :class="getPermissionIcon(toggleModal.permissionType)"></i>
              <span class="font-medium">{{ getPermissionLabel(toggleModal.permissionType) }}</span>
              <span :class="['badge ml-2', toggleModal.newValue ? 'badge-success' : 'badge-error']">
                {{ toggleModal.newValue ? 'Accordée' : 'Retirée' }}
              </span>
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-2">
          <button class="btn btn-outline" @click="closeToggleModal">Annuler</button>
          <button class="btn btn-primary" @click="confirmToggleChange">
            <i class="fas fa-check mr-2"></i>
            Confirmer
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de succès pour toggle -->
    <div v-if="toggleSuccessModal.visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-xl w-96 max-w-md">
        <div class="text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-success text-success-content mb-4">
            <i class="fas fa-check text-xl"></i>
          </div>
          <h3 class="font-bold text-lg mb-2">Permission modifiée avec succès !</h3>
          <p class="text-base-content/70 mb-6">
            La permission {{ toggleSuccessModal.permissionLabel }} a été {{ toggleSuccessModal.granted ? 'accordée à' : 'retirée de' }} 
            {{ toggleSuccessModal.targetName }} pour le dossier {{ toggleSuccessModal.folderName }}.
          </p>
          <button class="btn btn-primary" @click="closeToggleSuccessModal">
            <i class="fas fa-thumbs-up mr-2"></i>
            Parfait !
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de confirmation pour suppression de permission -->
    <div v-if="removePermissionModal.visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-xl w-96 max-w-md">
        <h3 class="font-bold text-lg mb-4 flex items-center">
          <i class="fas fa-exclamation-triangle text-error mr-2"></i>
          Supprimer la permission
        </h3>
        <div class="mb-6">
          <p class="mb-4">Êtes-vous sûr de vouloir supprimer cette permission ?</p>
          <div class="bg-base-200 p-4 rounded-lg">
            <div class="font-semibold mb-2">
              <i class="fas fa-folder mr-2"></i>{{ removePermissionModal.folder?.name }}
            </div>
            <div class="mb-2">
              <i class="fas mr-2" :class="removePermissionModal.permission?.target_type === 'user' ? 'fa-user' : 'fa-users'"></i>
              {{ removePermissionModal.permission?.target_name }} ({{ removePermissionModal.permission?.target_type === 'user' ? 'Utilisateur' : 'Groupe' }})
            </div>
            <div class="flex gap-2 flex-wrap">
              <span v-if="removePermissionModal.permission?.can_read" class="badge badge-success">Lecture</span>
              <span v-if="removePermissionModal.permission?.can_write" class="badge badge-warning">Écriture</span>
              <span v-if="removePermissionModal.permission?.can_delete" class="badge badge-error">Suppression</span>
              <span v-if="removePermissionModal.permission?.can_share" class="badge badge-info">Partage</span>
            </div>
          </div>
          <div class="alert alert-warning mt-4">
            <i class="fas fa-info-circle"></i>
            <span class="text-sm">Cette action est irréversible.</span>
          </div>
        </div>
        <div class="flex justify-end gap-2">
          <button class="btn btn-outline" @click="closeRemovePermissionModal">Annuler</button>
          <button class="btn btn-error" @click="confirmRemovePermissionAction" :disabled="loading">
            <i class="fas fa-trash mr-2"></i>
            Supprimer
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de succès pour suppression de permission -->
    <div v-if="removeSuccessModal.visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-xl w-96 max-w-md">
        <div class="text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-success text-success-content mb-4">
            <i class="fas fa-check text-xl"></i>
          </div>
          <h3 class="font-bold text-lg mb-2">Permission supprimée avec succès !</h3>
          <p class="text-base-content/70 mb-6">
            La permission a été supprimée pour {{ removeSuccessModal.targetName }} sur le dossier {{ removeSuccessModal.folderName }}.
          </p>
          <button class="btn btn-primary" @click="closeRemoveSuccessModal">
            <i class="fas fa-thumbs-up mr-2"></i>
            Parfait !
          </button>
        </div>
      </div>
    </div>

    <!-- Modal pour permissions en masse -->
    <div v-if="bulkModal.visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-xl w-[600px] max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <h3 class="font-bold text-lg mb-4 flex items-center">
          <i class="fas fa-users-cog text-primary mr-2"></i>
          Permissions en masse
        </h3>

        <!-- Sélection des dossiers -->
        <div class="mb-6">
          <label class="form-control">
            <div class="label">
              <span class="label-text font-semibold">Sélectionner les dossiers :</span>
            </div>
            <div class="max-h-48 overflow-y-auto border border-base-300 rounded-lg p-3 space-y-2">
              <label v-for="folder in folders" :key="folder.id" class="cursor-pointer label justify-start gap-3">
                <input type="checkbox" :value="folder.id" v-model="bulkModal.selectedFolders"
                  class="checkbox checkbox-primary" />
                <div class="flex items-center">
                  <i class="fas fa-folder text-primary mr-2"></i>
                  <span class="label-text">{{ folder.name }}</span>
                </div>
              </label>
            </div>
          </label>
        </div>

        <!-- Sélection des utilisateurs -->
        <div class="mb-6">
          <label class="form-control">
            <div class="label">
              <span class="label-text font-semibold">Sélectionner les utilisateurs :</span>
            </div>
            <div class="max-h-48 overflow-y-auto border border-base-300 rounded-lg p-3 space-y-2">
              <div v-if="users.length === 0" class="text-center text-base-content/50 py-4">
                <i class="fas fa-user-slash text-2xl mb-2"></i>
                <p class="text-sm">Aucun utilisateur disponible</p>
              </div>
              <label v-for="user in users" :key="user.id" class="cursor-pointer label justify-start gap-3">
                <input type="checkbox" :value="user.id" v-model="bulkModal.selectedUsers"
                  class="checkbox checkbox-primary" />
                <div class="flex items-center">
                  <i class="fas fa-user text-primary mr-2"></i>
                  <span class="label-text">{{ user.username }}</span>
                  <span class="badge badge-outline badge-xs ml-2">{{ user.role }}</span>
                </div>
              </label>
            </div>
          </label>
        </div>

        <!-- Sélection des groupes -->
        <div class="mb-6">
          <label class="form-control">
            <div class="label">
              <span class="label-text font-semibold">Sélectionner les groupes :</span>
            </div>
            <div class="max-h-48 overflow-y-auto border border-base-300 rounded-lg p-3 space-y-2">
              <div v-if="groups.length === 0" class="text-center text-base-content/50 py-4">
                <i class="fas fa-users-slash text-2xl mb-2"></i>
                <p class="text-sm">Aucun groupe disponible</p>
              </div>
              <label v-for="group in groups" :key="group.id" class="cursor-pointer label justify-start gap-3">
                <input type="checkbox" :value="group.id" v-model="bulkModal.selectedGroups"
                  class="checkbox checkbox-secondary" />
                <div class="flex items-center">
                  <i class="fas fa-users text-secondary mr-2"></i>
                  <span class="label-text">{{ group.name }}</span>
                  <span class="badge badge-outline badge-xs ml-2">{{ group.members?.length || 0 }} membre(s)</span>
                </div>
              </label>
            </div>
          </label>
        </div>

        <!-- Permissions -->
        <div class="form-control mb-6">
          <div class="label">
            <span class="label-text font-semibold">Permissions à appliquer :</span>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <label class="cursor-pointer label justify-start gap-3">
              <input type="checkbox" v-model="bulkModal.permissions.can_read" class="checkbox checkbox-success" />
              <span class="label-text">Lecture</span>
            </label>
            <label class="cursor-pointer label justify-start gap-3">
              <input type="checkbox" v-model="bulkModal.permissions.can_write" class="checkbox checkbox-warning" />
              <span class="label-text">Écriture</span>
            </label>
            <label class="cursor-pointer label justify-start gap-3">
              <input type="checkbox" v-model="bulkModal.permissions.can_delete" class="checkbox checkbox-error" />
              <span class="label-text">Suppression</span>
            </label>
            <label class="cursor-pointer label justify-start gap-3">
              <input type="checkbox" v-model="bulkModal.permissions.can_share" class="checkbox checkbox-info" />
              <span class="label-text">Partage</span>
            </label>
          </div>
        </div>

        <!-- Résumé -->
        <div
          v-if="bulkModal.selectedFolders.length > 0 && (bulkModal.selectedUsers.length > 0 || bulkModal.selectedGroups.length > 0)"
          class="bg-base-200 p-4 rounded-lg mb-6">
          <h4 class="font-semibold mb-3">Résumé :</h4>

          <!-- Dossiers sélectionnés -->
          <div class="mb-3">
            <p class="text-sm font-medium mb-1">
              <i class="fas fa-folder text-primary mr-1"></i>
              <strong>{{ bulkModal.selectedFolders.length }}</strong> dossier(s) sélectionné(s)
            </p>
          </div>

          <!-- Utilisateurs sélectionnés -->
          <div v-if="bulkModal.selectedUsers.length > 0" class="mb-3">
            <p class="text-sm font-medium mb-1">
              <i class="fas fa-users text-primary mr-1"></i>
              <strong>{{ bulkModal.selectedUsers.length }}</strong> utilisateur(s) :
            </p>
            <div class="flex gap-1 flex-wrap ml-4">
              <span v-for="userId in bulkModal.selectedUsers" :key="userId" class="badge badge-primary badge-sm">
                {{ getUserName(userId) }}
              </span>
            </div>
          </div>

          <!-- Groupes sélectionnés -->
          <div v-if="bulkModal.selectedGroups.length > 0" class="mb-3">
            <p class="text-sm font-medium mb-1">
              <i class="fas fa-users text-secondary mr-1"></i>
              <strong>{{ bulkModal.selectedGroups.length }}</strong> groupe(s) :
            </p>
            <div class="flex gap-1 flex-wrap ml-4">
              <span v-for="groupId in bulkModal.selectedGroups" :key="groupId" class="badge badge-secondary badge-sm">
                {{ getGroupName(groupId) }}
              </span>
            </div>
          </div>

          <!-- Permissions -->
          <div>
            <p class="text-sm font-medium mb-1">
              <i class="fas fa-shield-alt text-info mr-1"></i>
              Permissions à appliquer :
            </p>
            <div class="flex gap-2 flex-wrap ml-4">
              <span v-if="bulkModal.permissions.can_read" class="badge badge-success">Lecture</span>
              <span v-if="bulkModal.permissions.can_write" class="badge badge-warning">Écriture</span>
              <span v-if="bulkModal.permissions.can_delete" class="badge badge-error">Suppression</span>
              <span v-if="bulkModal.permissions.can_share" class="badge badge-info">Partage</span>
              <span v-if="!hasBulkPermissions" class="badge badge-outline">Aucune permission</span>
            </div>
          </div>

          <!-- Total des opérations -->
          <div class="mt-3 pt-3 border-t border-base-300">
            <p class="text-sm font-semibold text-info">
              <i class="fas fa-calculator mr-1"></i>
              Total : {{ getTotalOperations() }} opération(s) de permission
            </p>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-2">
          <button class="btn btn-outline" @click="closeBulkModal">Annuler</button>
          <button class="btn btn-primary" @click="applyBulkPermissions"
            :disabled="bulkModal.selectedFolders.length === 0 || (bulkModal.selectedUsers.length === 0 && bulkModal.selectedGroups.length === 0)">
            <i class="fas fa-check mr-2"></i>
            Appliquer les permissions
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { permissionAPI } from '@/services/api'
import { useStore } from 'vuex'
import { createCachedApiCall, permissionCache, PerformanceMonitor } from '@/services/performance'
import httpClient from '@/services/httpClient.js'

const store = useStore()

// Reactive data
const folders = ref([])
const users = ref([])
const groups = ref([])
const loading = ref(false)
const error = ref('')

// Filters and search
const searchQuery = ref('')
const filterPermission = ref('all')

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(9)

// Cached API calls
const cachedGetAllResources = createCachedApiCall(
  permissionAPI.getAllResources,
  () => 'all-resources',
  permissionCache
)

const cachedGetFolderPermissions = createCachedApiCall(
  permissionAPI.getFolderPermissions,
  (folderId) => `folder-permissions-${folderId}`,
  permissionCache
)

// Modal state
const modal = ref({
  visible: false,
  editing: false,
  folder: null,
  targetType: 'user',
  targetId: '',
  permissions: { can_read: false, can_write: false, can_delete: false, can_share: false },
  editingId: null
})

const confirmationModal = ref({
  visible: false
})

const successModal = ref({
  visible: false,
  targetName: '',
  folderName: ''
})



const deleteModal = ref({
  visible: false,
  folder: null
})

const bulkModal = ref({
  visible: false,
  selectedFolders: [],
  selectedUsers: [],
  selectedGroups: [],
  permissions: { can_read: false, can_write: false, can_delete: false, can_share: false }
})

// Nouveaux modals
const detailsModal = ref({
  visible: false,
  folder: null
})

const toggleModal = ref({
  visible: false,
  folder: null,
  permission: null,
  permissionType: '',
  newValue: false
})

const toggleSuccessModal = ref({
  visible: false,
  targetName: '',
  folderName: '',
  permissionLabel: '',
  granted: false
})

const removePermissionModal = ref({
  visible: false,
  folder: null,
  permission: null
})

const removeSuccessModal = ref({
  visible: false,
  targetName: '',
  folderName: ''
})

// Computed properties
const filteredFolders = computed(() => {
  let filtered = folders.value

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(folder => {
      const folderMatch = folder.name.toLowerCase().includes(query)
      const permissionMatch = folder.permissions.some(p =>
        p.target_name.toLowerCase().includes(query)
      )
      return folderMatch || permissionMatch
    })
  }

  // Apply permission filter
  if (filterPermission.value !== 'all') {
    filtered = filtered.filter(folder =>
      folder.permissions.some(p => p[`can_${filterPermission.value}`])
    )
  }

  // Sort by name (case insensitive)
  filtered.sort((a, b) => {
    const aName = (a.name || '').toLowerCase()
    const bName = (b.name || '').toLowerCase()
    return aName.localeCompare(bName)
  })

  return filtered
})

const totalPages = computed(() => {
  return Math.ceil(filteredFolders.value.length / itemsPerPage.value)
})

const paginatedFolders = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredFolders.value.slice(start, end)
})

const availableTargets = computed(() => {
  if (modal.value.targetType === 'user') {
    return users.value.map(u => ({ id: u.id, name: u.username }))
  } else {
    return groups.value.map(g => ({ id: g.id, name: g.name }))
  }
})

const hasAnyPermission = computed(() => {
  return modal.value.permissions.can_read ||
    modal.value.permissions.can_write ||
    modal.value.permissions.can_delete ||
    modal.value.permissions.can_share
})

// Methods
const loadFolders = async () => {
  const monitor = PerformanceMonitor.start('PermissionManager.loadFolders')

  loading.value = true
  error.value = ''

  try {
    const res = await cachedGetAllResources()

    folders.value = res.data.folders.map(f => ({
      id: f.id,
      name: f.name,
      type: 'folder',
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
    console.error('Error loading folders:', err)
    error.value = 'Failed to load folders and permissions'
    store.dispatch('showError', error.value)
  } finally {
    loading.value = false
    monitor.end()
  }
}

const refreshPermissions = async () => {
  loading.value = true
  try {
    // Clear cache
    permissionCache.clear()

    // Reload folders
    await loadFolders()

    // Success notification
    store.dispatch('showSuccess', 'Permissions refreshed')
  } catch (error) {
    console.error('Error refreshing permissions:', error)
    store.dispatch('showError', 'Failed to refresh permissions')
  } finally {
    // Stop spinner no matter what
    loading.value = false
  }
}



const confirmDeleteFolder = (folder) => {
  deleteModal.value = {
    visible: true,
    folder: folder
  }
}

const deleteFolder = async () => {
  if (!deleteModal.value.folder) return

  loading.value = true
  try {
    // Use the HTTP client for folder deletion
    const result = await httpClient.delete(`/folders/${deleteModal.value.folder.id}`)

    // Remove folder from local data
    folders.value = folders.value.filter(f => f.id !== deleteModal.value.folder.id)

    // Close modal
    deleteModal.value.visible = false

    // Show success message
    store.dispatch('showSuccess', `Dossier "${deleteModal.value.folder.name}" supprimé avec succès`)

  } catch (error) {
    console.error('Error deleting folder:', error)
    store.dispatch('showError', `Erreur lors de la suppression : ${error.message}`)
  } finally {
    loading.value = false
  }
}

const closeDeleteModal = () => {
  deleteModal.value.visible = false
}

const deleteFolderDirect = async () => {
  if (!deleteModal.value.folder) return

  loading.value = true
  try {
    // Try different API endpoints
    const folderId = deleteModal.value.folder.id
    let result

    try {
      // Try the admin API first
      result = await httpClient.delete(`/admin/folders/${folderId}`)
    } catch (adminError) {
      // If admin endpoint doesn't work, try the regular folders endpoint
      result = await httpClient.delete(`/folders/${folderId}`)
    }

    // Remove folder from local data
    folders.value = folders.value.filter(f => f.id !== deleteModal.value.folder.id)

    // Close modal
    deleteModal.value.visible = false

    // Show success message
    store.dispatch('showSuccess', `Dossier "${deleteModal.value.folder.name}" supprimé avec succès`)

  } catch (error) {
    console.error('Error deleting folder:', error)

    // If API deletion fails, try to remove from local data anyway
    if (error.message.includes('404')) {
      folders.value = folders.value.filter(f => f.id !== deleteModal.value.folder.id)
      deleteModal.value.visible = false
      store.dispatch('showSuccess', `Dossier "${deleteModal.value.folder.name}" retiré de la liste (n'existait plus sur le serveur)`)
    } else {
      store.dispatch('showError', `Erreur lors de la suppression : ${error.message}`)
    }
  } finally {
    loading.value = false
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

// Modal methods
const openAddPermissionModal = (folder) => {
  modal.value.visible = true
  modal.value.editing = false
  modal.value.folder = folder
  modal.value.targetType = 'user'
  modal.value.targetId = ''
  modal.value.permissions = { can_read: false, can_write: false, can_delete: false, can_share: false }
}

const editPermission = (folder, perm) => {
  modal.value.visible = true
  modal.value.editing = true
  modal.value.folder = folder
  modal.value.targetType = perm.target_type
  modal.value.targetId = perm.target_id
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

const onTargetTypeChange = () => {
  modal.value.targetId = ''
}

const getTargetName = () => {
  if (modal.value.targetType === 'user') {
    const user = users.value.find(u => u.id === modal.value.targetId)
    return user ? user.username : ''
  } else {
    const group = groups.value.find(g => g.id === modal.value.targetId)
    return group ? group.name : ''
  }
}

const showConfirmationModal = () => {
  if (!modal.value.targetId) return
  confirmationModal.value.visible = true
}

const closeConfirmationModal = () => {
  confirmationModal.value.visible = false
}

const closeSuccessModal = () => {
  successModal.value.visible = false
  closeModal()
  loadFolders()
}

const confirmSavePermission = async () => {
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
      closeConfirmationModal()
      closeModal()
      loadFolders()
    } else {
      // Ajout
      const targetId = modal.value.targetId
      if (modal.value.targetType === 'user') {
        await permissionAPI.setFolderUserPermission(modal.value.folder.id, targetId, modal.value.permissions)
      } else {
        await permissionAPI.setFolderGroupPermission(modal.value.folder.id, targetId, modal.value.permissions)
      }

      // Show success modal
      successModal.value.visible = true
      successModal.value.targetName = getTargetName()
      successModal.value.folderName = modal.value.folder.name
      closeConfirmationModal()
      // Rafraîchir automatiquement les données
      await loadFolders()
    }
  } catch (err) {
    console.error(err)
    store.dispatch('showError', 'Impossible de sauvegarder la permission')
    closeConfirmationModal()
  }
}

// Additional methods for the enhanced UI
const openBulkPermissionModal = () => {
  bulkModal.value.visible = true
  bulkModal.value.selectedFolders = []
  bulkModal.value.selectedUsers = []
  bulkModal.value.selectedGroups = []
  bulkModal.value.permissions = { can_read: false, can_write: false, can_delete: false, can_share: false }
}






// Bulk permissions methods
const closeBulkModal = () => {
  bulkModal.value.visible = false
}

const getUserName = (userId) => {
  const user = users.value.find(u => u.id === userId)
  return user ? user.username : `User ${userId}`
}

const getGroupName = (groupId) => {
  const group = groups.value.find(g => g.id === groupId)
  return group ? group.name : `Group ${groupId}`
}

const getTotalOperations = () => {
  const totalTargets = bulkModal.value.selectedUsers.length + bulkModal.value.selectedGroups.length
  return bulkModal.value.selectedFolders.length * totalTargets
}

const hasBulkPermissions = computed(() => {
  return bulkModal.value.permissions.can_read ||
    bulkModal.value.permissions.can_write ||
    bulkModal.value.permissions.can_delete ||
    bulkModal.value.permissions.can_share
})

const applyBulkPermissions = async () => {
  if (bulkModal.value.selectedFolders.length === 0 ||
    (bulkModal.value.selectedUsers.length === 0 && bulkModal.value.selectedGroups.length === 0)) {
    return
  }

  loading.value = true
  let successCount = 0
  let errorCount = 0
  const errors = []

  try {
    // Apply permissions for each folder
    for (const folderId of bulkModal.value.selectedFolders) {
      // Apply permissions for selected users
      for (const userId of bulkModal.value.selectedUsers) {
        try {
          await permissionAPI.setFolderUserPermission(folderId, userId, bulkModal.value.permissions)
          successCount++
        } catch (err) {
          console.error(`Error setting user permission for folder ${folderId}, user ${userId}:`, err)
          errorCount++
          errors.push(`Utilisateur ${getUserName(userId)} sur dossier ${getFolderName(folderId)}`)
        }
      }

      // Apply permissions for selected groups
      for (const groupId of bulkModal.value.selectedGroups) {
        try {
          await permissionAPI.setFolderGroupPermission(folderId, groupId, bulkModal.value.permissions)
          successCount++
        } catch (err) {
          console.error(`Error setting group permission for folder ${folderId}, group ${groupId}:`, err)
          errorCount++
          errors.push(`Groupe ${getGroupName(groupId)} sur dossier ${getFolderName(folderId)}`)
        }
      }
    }

    // Show results
    if (successCount > 0) {
      const totalUsers = bulkModal.value.selectedUsers.length
      const totalGroups = bulkModal.value.selectedGroups.length
      const totalFolders = bulkModal.value.selectedFolders.length

      store.dispatch('showSuccess',
        `Permissions appliquées avec succès ! ${successCount} opération(s) réussie(s) sur ${totalFolders} dossier(s), ${totalUsers} utilisateur(s) et ${totalGroups} groupe(s).`
      )
    }

    if (errorCount > 0) {
      const errorMessage = `Erreur lors de ${errorCount} opération(s). Échecs: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}`
      store.dispatch('showError', errorMessage)
    }

    // Refresh data and close modal
    closeBulkModal()
    await loadFolders()

  } catch (err) {
    console.error('Error applying bulk permissions:', err)
    store.dispatch('showError', 'Erreur lors de l\'application des permissions en masse')
  } finally {
    loading.value = false
  }
}

const getFolderName = (folderId) => {
  const folder = folders.value.find(f => f.id === folderId)
  return folder ? folder.name : `Folder ${folderId}`
}

// Watchers
watch(searchQuery, () => {
  currentPage.value = 1 // Reset to first page when searching
})

// Nouvelles méthodes pour les modals

// Modal de détails du dossier
const viewFolderDetails = (folder) => {
  detailsModal.value.folder = folder
  detailsModal.value.visible = true
}

const closeDetailsModal = () => {
  detailsModal.value.visible = false
  detailsModal.value.folder = null
}

// Modal de confirmation pour toggle de permission
const confirmTogglePermission = (folder, permission, permissionType, newValue) => {
  toggleModal.value.folder = folder
  toggleModal.value.permission = permission
  toggleModal.value.permissionType = permissionType
  toggleModal.value.newValue = newValue
  toggleModal.value.visible = true
}

const closeToggleModal = () => {
  toggleModal.value.visible = false
  toggleModal.value.folder = null
  toggleModal.value.permission = null
  toggleModal.value.permissionType = ''
  toggleModal.value.newValue = false
}

const confirmToggleChange = async () => {
  try {
    const { folder, permission, permissionType, newValue } = toggleModal.value
    
    // Appeler l'API pour modifier la permission
    await toggleRight(folder, permission, permissionType, newValue)
    
    // Fermer le modal de confirmation
    closeToggleModal()
    
    // Afficher le modal de succès
    toggleSuccessModal.value.targetName = permission.target_name
    toggleSuccessModal.value.folderName = folder.name
    toggleSuccessModal.value.permissionLabel = getPermissionLabel(permissionType)
    toggleSuccessModal.value.granted = newValue
    toggleSuccessModal.value.visible = true
    
    // Rafraîchir automatiquement les données
    await loadFolders()
    
  } catch (error) {
    console.error('Erreur lors de la modification de la permission:', error)
    // Ici on pourrait afficher un toast d'erreur
  }
}

const closeToggleSuccessModal = () => {
  toggleSuccessModal.value.visible = false
  toggleSuccessModal.value.targetName = ''
  toggleSuccessModal.value.folderName = ''
  toggleSuccessModal.value.permissionLabel = ''
  toggleSuccessModal.value.granted = false
}

// Modal de confirmation pour suppression de permission
const confirmRemovePermission = (folder, permission) => {
  removePermissionModal.value.folder = folder
  removePermissionModal.value.permission = permission
  removePermissionModal.value.visible = true
}

const closeRemovePermissionModal = () => {
  removePermissionModal.value.visible = false
  removePermissionModal.value.folder = null
  removePermissionModal.value.permission = null
}

const closeRemoveSuccessModal = () => {
  removeSuccessModal.value.visible = false
  removeSuccessModal.value.targetName = ''
  removeSuccessModal.value.folderName = ''
}

const confirmRemovePermissionAction = async () => {
  try {
    const { folder, permission } = removePermissionModal.value
    
    // Appeler l'API pour supprimer la permission
    await permissionAPI.deleteFolderPermission(folder.id, permission.id)
    
    // Supprimer localement de la liste
    folder.permissions = folder.permissions.filter(p => p.id !== permission.id)
    
    // Fermer le modal de confirmation
    closeRemovePermissionModal()
    
    // Afficher le modal de succès
    removeSuccessModal.value.targetName = permission.target_name
    removeSuccessModal.value.folderName = folder.name
    removeSuccessModal.value.visible = true
    
    // Invalider le cache et rafraîchir
    permissionCache.delete(`folder-permissions-${folder.id}`)
    await loadFolders()
    
  } catch (error) {
    console.error('Erreur lors de la suppression de la permission:', error)
    store.dispatch('showError', 'Impossible de supprimer la permission')
    closeRemovePermissionModal()
  }
}

// Méthodes utilitaires
const getPermissionIcon = (permissionType) => {
  const icons = {
    can_read: 'fa-eye text-success',
    can_write: 'fa-edit text-warning', 
    can_delete: 'fa-trash text-error',
    can_share: 'fa-share text-info'
  }
  return icons[permissionType] || 'fa-question'
}

const getPermissionLabel = (permissionType) => {
  const labels = {
    can_read: 'Lecture',
    can_write: 'Écriture',
    can_delete: 'Suppression', 
    can_share: 'Partage'
  }
  return labels[permissionType] || permissionType
}

// Méthode pour exporter en PDF
const exportFolderPermissions = async (folder) => {
  try {
    // Importer jsPDF dynamiquement
    const { jsPDF } = await import('jspdf')
    
    const doc = new jsPDF()
    
    // Titre du document
    doc.setFontSize(20)
    doc.text('Rapport des Permissions', 20, 20)
    
    // Informations du dossier
    doc.setFontSize(16)
    doc.text(`Dossier: ${folder.name}`, 20, 40)
    
    doc.setFontSize(12)
    doc.text(`Date d'export: ${new Date().toLocaleDateString('fr-FR')}`, 20, 50)
    doc.text(`Nombre de permissions: ${folder.permissions.length}`, 20, 60)
    
    // Ligne de séparation
    doc.line(20, 70, 190, 70)
    
    let yPosition = 80
    
    if (folder.permissions.length === 0) {
      doc.text('Aucune permission définie pour ce dossier.', 20, yPosition)
    } else {
      // En-têtes du tableau
      doc.setFontSize(10)
      doc.text('Utilisateur/Groupe', 20, yPosition)
      doc.text('Type', 80, yPosition)
      doc.text('Lecture', 110, yPosition)
      doc.text('Écriture', 130, yPosition)
      doc.text('Suppression', 150, yPosition)
      doc.text('Partage', 175, yPosition)
      
      yPosition += 10
      doc.line(20, yPosition - 5, 190, yPosition - 5)
      
      // Données des permissions
      folder.permissions.forEach((perm, index) => {
        if (yPosition > 270) { // Nouvelle page si nécessaire
          doc.addPage()
          yPosition = 20
        }
        
        doc.text(perm.target_name, 20, yPosition)
        doc.text(perm.target_type === 'user' ? 'Utilisateur' : 'Groupe', 80, yPosition)
        doc.text(perm.can_read ? 'Oui' : 'Non', 110, yPosition)
        doc.text(perm.can_write ? 'Oui' : 'Non', 130, yPosition)
        doc.text(perm.can_delete ? 'Oui' : 'Non', 150, yPosition)
        doc.text(perm.can_share ? 'Oui' : 'Non', 175, yPosition)
        
        yPosition += 8
      })
    }
    
    // Pied de page
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.text(`Page ${i} sur ${pageCount}`, 170, 290)
      doc.text('Généré par le système NAS', 20, 290)
    }
    
    // Télécharger le PDF
    const fileName = `permissions_${folder.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(fileName)
    
    // Afficher un message de succès
    store.dispatch('showSuccess', 'Export PDF généré avec succès')
    
  } catch (error) {
    console.error('Erreur lors de l\'export PDF:', error)
    store.dispatch('showError', 'Erreur lors de l\'export PDF')
  }
}

// Modifier la méthode toggleRight existante pour ne pas avoir de modal automatique
const toggleRight = async (folder, permission, right, newValue = null) => {
  try {
    const currentValue = permission[right]
    const targetValue = newValue !== null ? newValue : !currentValue
    
    // Créer l'objet de permissions avec la nouvelle valeur
    const permissions = {
      can_read: permission.can_read,
      can_write: permission.can_write,
      can_delete: permission.can_delete,
      can_share: permission.can_share,
      [right]: targetValue
    }
    
    // Trouver l'ID de l'utilisateur/groupe à partir du nom
    let targetId
    if (permission.target_type === 'user') {
      const user = users.value.find(u => u.username === permission.target_name)
      if (!user) {
        throw new Error(`Utilisateur ${permission.target_name} non trouvé`)
      }
      targetId = user.id
      await permissionAPI.setFolderUserPermission(folder.id, targetId, permissions)
    } else {
      const group = groups.value.find(g => g.name === permission.target_name)
      if (!group) {
        throw new Error(`Groupe ${permission.target_name} non trouvé`)
      }
      targetId = group.id
      await permissionAPI.setFolderGroupPermission(folder.id, targetId, permissions)
    }

    // Mettre à jour localement
    permission[right] = targetValue
    
    // Invalider le cache
    permissionCache.delete(`folder-permissions-${folder.id}`)
    
  } catch (error) {
    console.error('Erreur lors de la modification de la permission:', error)
    throw error
  }
}

onMounted(() => loadFolders())
</script>
