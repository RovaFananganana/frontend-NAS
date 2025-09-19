<!-- components/Shared/ShareModal.vue -->
<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content large" @click.stop>
      <div class="modal-header">
        <h3>Partager "{{ item?.name }}"</h3>
        <button @click="$emit('close')" class="close-btn">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <!-- Aperçu de l'élément -->
        <div class="item-preview">
          <i :class="getItemIcon(item)"></i>
          <div class="item-details">
            <div class="item-name">{{ item?.name }}</div>
            <div class="item-path">{{ item?.path }}</div>
            <div v-if="item?.size" class="item-size">{{ formatBytes(item.size) }}</div>
          </div>
        </div>

        <!-- Options de partage -->
        <div class="share-options">
          <h4>Options de partage</h4>
          
          <!-- Lien public -->
          <div class="share-section">
            <div class="section-header">
              <h5>
                <i class="fas fa-link"></i>
                Lien public
              </h5>
              <button 
                @click="generatePublicLink" 
                class="btn btn-sm btn-outline"
                :disabled="generatingLink"
              >
                <i v-if="generatingLink" class="fas fa-spinner fa-spin"></i>
                <i v-else class="fas fa-plus"></i>
                {{ publicLink ? 'Régénérer' : 'Créer un lien' }}
              </button>
            </div>
            
            <div v-if="publicLink" class="link-container">
              <div class="link-input-group">
                <input 
                  :value="publicLink" 
                  readonly 
                  class="form-input"
                  ref="linkInput"
                />
                <button @click="copyLink" class="btn btn-outline">
                  <i class="fas fa-copy"></i>
                </button>
              </div>
              
              <div class="link-options">
                <div class="form-group inline">
                  <label>
                    <input 
                      v-model="linkSettings.passwordProtected" 
                      type="checkbox"
                    />
                    Protégé par mot de passe
                  </label>
                  <input
                    v-if="linkSettings.passwordProtected"
                    v-model="linkSettings.password"
                    type="password"
                    placeholder="Mot de passe"
                    class="form-input"
                  />
                </div>
                
                <div class="form-group inline">
                  <label>
                    <input 
                      v-model="linkSettings.hasExpiration" 
                      type="checkbox"
                    />
                    Date d'expiration
                  </label>
                  <input
                    v-if="linkSettings.hasExpiration"
                    v-model="linkSettings.expirationDate"
                    type="datetime-local"
                    class="form-input"
                  />
                </div>
                
                <div class="form-group inline">
                  <label>
                    <input 
                      v-model="linkSettings.downloadLimit" 
                      type="checkbox"
                    />
                    Limite de téléchargements
                  </label>
                  <input
                    v-if="linkSettings.downloadLimit"
                    v-model.number="linkSettings.maxDownloads"
                    type="number"
                    min="1"
                    max="1000"
                    class="form-input"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Partage avec utilisateurs -->
          <div class="share-section">
            <div class="section-header">
              <h5>
                <i class="fas fa-users"></i>
                Partager avec des utilisateurs
              </h5>
            </div>
            
            <div class="user-share">
              <div class="add-user-group">
                <input
                  v-model="newUserEmail"
                  type="email"
                  placeholder="Email de l'utilisateur"
                  class="form-input"
                  @keyup.enter="addUserShare"
                />
                <select v-model="newUserPermission" class="form-select">
                  <option value="read">Lecture seule</option>
                  <option value="write">Lecture et écriture</option>
                  <option value="admin">Administrateur</option>
                </select>
                <button @click="addUserShare" class="btn btn-primary">
                  <i class="fas fa-plus"></i>
                  Ajouter
                </button>
              </div>
              
              <div v-if="sharedUsers.length > 0" class="shared-users-list">
                <h6>Utilisateurs avec accès :</h6>
                <div 
                  v-for="user in sharedUsers" 
                  :key="user.email"
                  class="shared-user-item"
                >
                  <div class="user-info">
                    <i class="fas fa-user"></i>
                    <span>{{ user.email }}</span>
                  </div>
                  <div class="user-permission">
                    <select v-model="user.permission" @change="updateUserPermission(user)">
                      <option value="read">Lecture</option>
                      <option value="write">Écriture</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <button @click="removeUserShare(user)" class="btn btn-sm btn-ghost text-error">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="$emit('close')" class="btn btn-secondary">
          Fermer
        </button>
        <button @click="saveShareSettings" class="btn btn-primary" :disabled="saving">
          <i v-if="saving" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-save"></i>
          {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useToast } from '@/services/useToast'
import { getFileIcon, formatBytes } from '@/utils/fileUtils'

export default {
  name: 'ShareModal',
  props: {
    item: {
      type: Object,
      required: true
    }
  },
  emits: ['close'],
  setup(props) {
    const toast = useToast()
    
    const publicLink = ref('')
    const generatingLink = ref(false)
    const saving = ref(false)
    
    const linkSettings = reactive({
      passwordProtected: false,
      password: '',
      hasExpiration: false,
      expirationDate: '',
      downloadLimit: false,
      maxDownloads: 10
    })
    
    const newUserEmail = ref('')
    const newUserPermission = ref('read')
    const sharedUsers = ref([])
    
    const linkInput = ref(null)

    const getItemIcon = (item) => getFileIcon(item)
    
    const generatePublicLink = async () => {
      generatingLink.value = true
      
      try {
        // Simuler la génération de lien - à remplacer par l'API réelle
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const baseUrl = window.location.origin
        const itemId = btoa(props.item.path).replace(/[/+=]/g, '')
        publicLink.value = `${baseUrl}/share/${itemId}`
        
        toast.success('Lien généré avec succès')
      } catch (error) {
        toast.error('Erreur lors de la génération du lien')
      } finally {
        generatingLink.value = false
      }
    }
    
    const copyLink = async () => {
      try {
        await navigator.clipboard.writeText(publicLink.value)
        toast.success('Lien copié dans le presse-papiers')
      } catch (error) {
        // Fallback pour les navigateurs plus anciens
        linkInput.value?.select()
        document.execCommand('copy')
        toast.success('Lien copié')
      }
    }
    
    const addUserShare = () => {
      if (!newUserEmail.value.trim()) {
        toast.error('Veuillez saisir un email')
        return
      }
      
      if (sharedUsers.value.find(u => u.email === newUserEmail.value)) {
        toast.error('Cet utilisateur a déjà accès')
        return
      }
      
      sharedUsers.value.push({
        email: newUserEmail.value.trim(),
        permission: newUserPermission.value,
        id: Date.now()
      })
      
      newUserEmail.value = ''
      toast.success('Utilisateur ajouté')
    }
    
    const removeUserShare = (user) => {
      const index = sharedUsers.value.findIndex(u => u.id === user.id)
      if (index > -1) {
        sharedUsers.value.splice(index, 1)
        toast.success('Accès retiré')
      }
    }
    
    const updateUserPermission = (user) => {
      toast.success('Permission mise à jour')
    }
    
    const saveShareSettings = async () => {
      saving.value = true
      
      try {
        // Simuler la sauvegarde - à remplacer par l'API réelle
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const shareData = {
          itemPath: props.item.path,
          publicLink: publicLink.value ? {
            url: publicLink.value,
            settings: { ...linkSettings }
          } : null,
          users: sharedUsers.value
        }
        
        console.log('Données de partage à sauvegarder:', shareData)
        
        toast.success('Paramètres de partage enregistrés')
      } catch (error) {
        toast.error('Erreur lors de la sauvegarde')
      } finally {
        saving.value = false
      }
    }

    return {
      publicLink,
      generatingLink,
      saving,
      linkSettings,
      newUserEmail,
      newUserPermission,
      sharedUsers,
      linkInput,
      getItemIcon,
      formatBytes,
      generatePublicLink,
      copyLink,
      addUserShare,
      removeUserShare,
      updateUserPermission,
      saveShareSettings
    }
  }
}
</script>

<!-- Styles communs pour les modales -->
<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  min-width: 400px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-content.large {
  min-width: 600px;
  width: 700px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  color: #666;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f5f5f5;
  color: #333;
}

.modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px 20px;
  border-top: 1px solid #e0e0e0;
}

/* Form styles */
.form-group {
  margin-bottom: 16px;
}

.form-group.inline {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #333;
}

.form-group.inline label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 0;
  white-space: nowrap;
}

.form-input,
.form-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #007bff;
}

.form-input.error {
  border-color: #dc3545;
}

.error-message {
  color: #dc3545;
  font-size: 12px;
  margin-top: 4px;
}

/* Item preview */
.item-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
  margin-bottom: 20px;
}

.item-preview i {
  font-size: 24px;
}

.item-details {
  flex: 1;
}

.item-name {
  font-weight: 600;
  margin-bottom: 4px;
}

.item-path {
  font-size: 12px;
  color: #666;
  font-family: monospace;
}

.item-size {
  font-size: 12px;
  color: #666;
}

.old-name {
  text-decoration: line-through;
  color: #666;
}

.new-name {
  font-weight: 600;
  color: #007bff;
}

.location-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
  color: #666;
}

/* Share modal specific styles */
.share-options {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.share-section {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 16px;
}

.section-header {
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h5 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.link-container {
  margin-top: 12px;
}

.link-input-group {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.link-input-group .form-input {
  flex: 1;
  font-family: monospace;
  font-size: 12px;
}

.link-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 4px;
}

.add-user-group {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.add-user-group .form-input {
  flex: 2;
  min-width: 200px;
}

.add-user-group .form-select {
  flex: 1;
  min-width: 120px;
}

.shared-users-list {
  margin-top: 16px;
}

.shared-users-list h6 {
  margin: 0 0 12px 0;
  font-weight: 600;
  color: #333;
}

.shared-user-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  margin-bottom: 8px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.user-permission {
  min-width: 120px;
}

.user-permission select {
  width: 100%;
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
}

/* Button styles */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  color: #333;
  font-size: 14px;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn:hover {
  background: #f8f9fa;
  border-color: #adb5bd;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}

.btn-outline {
  background: transparent;
}

.btn-ghost {
  background: transparent;
  border-color: transparent;
}

.btn-primary {
  background: #007bff;
  border-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
  border-color: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  border-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
  border-color: #5a6268;
}

.text-error {
  color: #dc3545;
}

/* Responsive */
@media (max-width: 768px) {
  .modal-content {
    min-width: 300px;
    margin: 10px;
  }
  
  .modal-content.large {
    min-width: 300px;
    width: 100%;
  }
  
  .add-user-group {
    flex-direction: column;
  }
  
  .add-user-group .form-input,
  .add-user-group .form-select {
    width: 100%;
    min-width: auto;
  }
  
  .shared-user-item {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .user-info {
    width: 100%;
  }
  
  .user-permission {
    min-width: auto;
    width: 100%;
  }
}
</style>