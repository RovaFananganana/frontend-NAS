// composables/useFileOperation.js
import { ref } from 'vue'
import { useSynologyAPI } from './useSynologyAPI'
import { useToast } from './useToast'

export function useFileOperations() {
  const synologyAPI = useSynologyAPI()
  const toast = useToast()
  
  const uploadProgress = ref({
    active: false,
    files: [],
    current: 0,
    total: 0,
    percent: 0
  })

  const uploadFiles = async (files, destPath) => {
    const fileArray = Array.from(files)
    
    uploadProgress.value = {
      active: true,
      files: fileArray.map(f => ({ name: f.name, status: 'pending' })),
      current: 0,
      total: fileArray.length,
      percent: 0
    }

    const results = []

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i]
      uploadProgress.value.files[i].status = 'uploading'
      
      try {
        const result = await synologyAPI.uploadFile(file, destPath, (percent) => {
          uploadProgress.value.files[i].percent = percent
        })
        
        uploadProgress.value.files[i].status = 'success'
        results.push({ file, success: true, result })
        
      } catch (error) {
        uploadProgress.value.files[i].status = 'error'
        uploadProgress.value.files[i].error = error.message
        results.push({ file, success: false, error: error.message })
      }

      uploadProgress.value.current = i + 1
      uploadProgress.value.percent = Math.round(((i + 1) / fileArray.length) * 100)
    }

    uploadProgress.value.active = false
    
    const successCount = results.filter(r => r.success).length
    const errorCount = results.filter(r => !r.success).length
    
    if (successCount > 0) {
      toast.success(`${successCount} fichier(s) uploadé(s) avec succès`)
    }
    
    if (errorCount > 0) {
      toast.error(`${errorCount} fichier(s) ont échoué`)
    }

    return results
  }

  const deleteItems = async (items) => {
    const results = []
    
    for (const item of items) {
      try {
        const result = await synologyAPI.deleteFile(item.path)
        results.push({ item, success: true, result })
      } catch (error) {
        results.push({ item, success: false, error: error.message })
      }
    }

    const successCount = results.filter(r => r.success).length
    const errorCount = results.filter(r => !r.success).length
    
    if (successCount > 0) {
      toast.success(`${successCount} élément(s) supprimé(s)`)
    }
    
    if (errorCount > 0) {
      toast.error(`${errorCount} élément(s) n'ont pas pu être supprimés`)
    }

    return results
  }

  const renameItem = async (item, newName) => {
    try {
      const result = await synologyAPI.renameFile(item.path, newName)
      toast.success('Élément renommé avec succès')
      return { success: true, result }
    } catch (error) {
      toast.error(`Erreur lors du renommage: ${error.message}`)
      return { success: false, error: error.message }
    }
  }

  const moveItems = async (items, destPath) => {
    const results = []
    
    for (const item of items) {
      try {
        const result = await synologyAPI.moveFile(item.path, destPath)
        results.push({ item, success: true, result })
      } catch (error) {
        results.push({ item, success: false, error: error.message })
      }
    }

    const successCount = results.filter(r => r.success).length
    const errorCount = results.filter(r => !r.success).length
    
    if (successCount > 0) {
      toast.success(`${successCount} élément(s) déplacé(s)`)
    }
    
    if (errorCount > 0) {
      toast.error(`${errorCount} élément(s) n'ont pas pu être déplacés`)
    }

    return results
  }

  return {
    uploadProgress,
    uploadFiles,
    deleteItems,
    renameItem,
    moveItems
  }
}