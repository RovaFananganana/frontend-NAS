<template>
  <div class="modal modal-open">
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-4">Créer un nouveau fichier</h3>

      <form @submit.prevent="handleSubmit">
        <!-- Nom du fichier -->
        <div class="form-control mb-4">
          <label class="label">
            <span class="label-text">Nom du fichier *</span>
          </label>
          <input ref="fileNameInput" v-model="fileName" type="text" class="input input-bordered w-full"
            :class="{ 'input-error': errors.fileName }" placeholder="exemple.txt" required @input="validateFileName" />
          <label v-if="errors.fileName" class="label">
            <span class="label-text-alt text-error">{{ errors.fileName }}</span>
          </label>
        </div>

        <!-- Type de fichier -->
        <div class="form-control mb-4">
          <label class="label">
            <span class="label-text">Type de fichier</span>
          </label>
          <select v-model="fileType" class="select select-bordered w-full" @change="updateFileExtension">
            <option value="txt">Fichier texte (.txt)</option>
            <option value="md">Markdown (.md)</option>
            <option value="json">JSON (.json)</option>
            <option value="csv">CSV (.csv)</option>
            <option value="xml">XML (.xml)</option>
            <option value="html">HTML (.html)</option>
            <option value="css">CSS (.css)</option>
            <option value="js">JavaScript (.js)</option>
            <option value="py">Python (.py)</option>
            <option value="pdf">Document PDF (.pdf)</option>
            <option value="docx">Document Word (.docx)</option>
            <option value="doc">Document Word (.doc)</option>
            <option value="xlsx">Classeur Excel (.xlsx)</option>
            <option value="xls">Classeur Excel (.xls)</option>
            <option value="pptx">Présentation PowerPoint (.pptx)</option>
            <option value="ppt">Présentation PowerPoint (.ppt)</option>
            <option value="accdb">Base de données Access (.accdb)</option>
            <option value="mdb">Base de données Access (.mdb)</option>
            <option value="custom">Autre (spécifier l'extension)</option>
          </select>
        </div>

        <!-- Extension personnalisée -->
        <div v-if="fileType === 'custom'" class="form-control mb-4">
          <label class="label">
            <span class="label-text">Extension personnalisée</span>
          </label>
          <input v-model="customExtension" type="text" class="input input-bordered w-full"
            :class="{ 'input-error': errors.customExtension }" placeholder="ex: log, conf, ini"
            @input="validateCustomExtension" />
          <label v-if="errors.customExtension" class="label">
            <span class="label-text-alt text-error">{{ errors.customExtension }}</span>
          </label>
        </div>

        <!-- Aperçu du nom final -->
        <div v-if="finalFileName" class="alert alert-info mb-4">
          <i class="fas fa-info-circle"></i>
          <span>Le fichier sera créé sous le nom : <strong>{{ finalFileName }}</strong></span>
        </div>

        <!-- Messages d'erreur -->
        <div v-if="error" class="alert alert-error mb-4">
          <i class="fas fa-exclamation-triangle"></i>
          <span>{{ error }}</span>
        </div>

        <!-- Actions -->
        <div class="modal-action">
          <button type="button" class="btn btn-ghost" @click="$emit('close')" :disabled="loading">
            Annuler
          </button>
          <button type="submit" class="btn btn-primary" :disabled="!isFormValid || loading">
            <span v-if="loading" class="loading loading-spinner loading-sm"></span>
            {{ loading ? 'Création...' : 'Créer le fichier' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { nasAPI } from '@/services/nasAPI.js'

const props = defineProps({
  currentPath: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['close', 'created'])

// État du formulaire
const fileName = ref('')
const fileType = ref('txt')
const customExtension = ref('')
const loading = ref(false)
const error = ref('')

// Erreurs de validation
const errors = ref({
  fileName: '',
  customExtension: ''
})

// Référence pour le focus
const fileNameInput = ref(null)

// Nom final du fichier
const finalFileName = computed(() => {
  if (!fileName.value) return ''

  let name = fileName.value.trim()
  if (!name) return ''

  // Si le nom contient déjà une extension, la garder
  if (name.includes('.')) {
    return name
  }

  // Sinon, ajouter l'extension selon le type
  let extension = ''
  if (fileType.value === 'custom') {
    extension = customExtension.value.trim()
    if (extension && !extension.startsWith('.')) {
      extension = '.' + extension
    }
  } else {
    extension = '.' + fileType.value
  }

  return name + extension
})

// Validation du formulaire
const isFormValid = computed(() => {
  return fileName.value.trim() &&
    !errors.value.fileName &&
    (fileType.value !== 'custom' || (customExtension.value.trim() && !errors.value.customExtension))
})

// Validation du nom de fichier
const validateFileName = () => {
  const name = fileName.value.trim()
  errors.value.fileName = ''

  if (!name) {
    errors.value.fileName = 'Le nom du fichier est requis'
    return
  }

  // Caractères interdits dans les noms de fichiers
  const invalidChars = /[<>:"/\\|?*]/
  if (invalidChars.test(name)) {
    errors.value.fileName = 'Le nom contient des caractères interdits: < > : " / \\ | ? *'
    return
  }

  // Noms réservés Windows
  const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9']
  const nameWithoutExt = name.split('.')[0].toUpperCase()
  if (reservedNames.includes(nameWithoutExt)) {
    errors.value.fileName = 'Ce nom est réservé par le système'
    return
  }

  // Longueur maximale
  if (name.length > 255) {
    errors.value.fileName = 'Le nom du fichier est trop long (maximum 255 caractères)'
    return
  }
}

// Validation de l'extension personnalisée
const validateCustomExtension = () => {
  const ext = customExtension.value.trim()
  errors.value.customExtension = ''

  if (fileType.value === 'custom' && !ext) {
    errors.value.customExtension = 'L\'extension est requise'
    return
  }

  if (ext) {
    // Supprimer le point initial s'il existe pour la validation
    const cleanExt = ext.startsWith('.') ? ext.slice(1) : ext

    // Caractères interdits dans les extensions
    const invalidChars = /[<>:"/\\|?*\s]/
    if (invalidChars.test(cleanExt)) {
      errors.value.customExtension = 'L\'extension contient des caractères interdits'
      return
    }

    // Longueur maximale pour l'extension
    if (cleanExt.length > 10) {
      errors.value.customExtension = 'L\'extension est trop longue (maximum 10 caractères)'
      return
    }
  }
}

// Mettre à jour l'extension quand le type change
const updateFileExtension = () => {
  if (fileType.value !== 'custom') {
    customExtension.value = ''
    errors.value.customExtension = ''
  }
}

// Soumettre le formulaire
const handleSubmit = async () => {
  // Valider le formulaire
  validateFileName()
  if (fileType.value === 'custom') {
    validateCustomExtension()
  }

  if (!isFormValid.value) {
    return
  }

  loading.value = true
  error.value = ''

  try {
    const response = await nasAPI.createFile(props.currentPath, finalFileName.value)

    if (response.success) {
      emit('created', {
        fileName: finalFileName.value,
        path: response.path || `${props.currentPath}/${finalFileName.value}`
      })
      emit('close')
    } else {
      error.value = response.error || 'Erreur lors de la création du fichier'
    }
  } catch (err) {
    console.error('Error creating file:', err)
    error.value = err.message || 'Erreur lors de la création du fichier'
  } finally {
    loading.value = false
  }
}

// Focus sur le champ nom au montage
onMounted(() => {
  nextTick(() => {
    if (fileNameInput.value) {
      fileNameInput.value.focus()
    }
  })
})
</script>