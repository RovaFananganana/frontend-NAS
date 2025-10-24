// services/uploadService.js

import { ref, reactive } from 'vue'
import { nasAPI } from './nasAPI'

class UploadService {
  constructor() {
    this.uploads = reactive(new Map())
    this.maxConcurrentUploads = 3 // Retour à 3 uploads simultanés
    this.uploadQueue = []
    this.activeUploads = 0
    this.nextUploadId = 1
  }

  // Créer un nouvel upload
  createUpload(file, targetPath) {
    const uploadId = this.nextUploadId++
    
    // Calculer le chemin de destination final
    let finalTargetPath = targetPath
    if (file.relativePath && file.relativePath !== file.name) {
      // Le fichier fait partie d'un dossier, préserver la structure
      const relativeDirPath = file.relativePath.substring(0, file.relativePath.lastIndexOf('/'))
      if (relativeDirPath) {
        finalTargetPath = targetPath + '/' + relativeDirPath
      }
    }
    
    const upload = {
      id: uploadId,
      fileName: file.name,
      fileSize: file.size,
      file: file,
      targetPath: finalTargetPath,
      originalTargetPath: targetPath,
      relativePath: file.relativePath || file.name,
      uploadedBytes: 0,
      progress: 0,
      status: 'pending', // pending, uploading, completed, error, cancelled
      error: null,
      startTime: null,
      estimatedTime: 0,
      speed: 0,
      retryCount: 0,
      maxRetries: 3
    }

    this.uploads.set(uploadId, upload)
    return upload
  }

  // Ajouter des fichiers à uploader
  async addFiles(files, targetPath) {
    console.log(`🚀 UploadService: Adding ${files.length} files to upload queue`)
    const newUploads = []
    
    // Identifier tous les dossiers à créer
    const foldersToCreate = new Set()
    
    for (const file of files) {
      const upload = this.createUpload(file, targetPath)
      newUploads.push(upload)
      
      // Si le fichier a un chemin relatif (fait partie d'un dossier)
      if (file.relativePath && file.relativePath !== file.name) {
        const relativeDirPath = file.relativePath.substring(0, file.relativePath.lastIndexOf('/'))
        if (relativeDirPath) {
          // Ajouter tous les dossiers parents
          const pathParts = relativeDirPath.split('/')
          let currentPath = ''
          for (const part of pathParts) {
            currentPath = currentPath ? `${currentPath}/${part}` : part
            foldersToCreate.add(`${targetPath}/${currentPath}`)
          }
        }
      }
      
      console.log(`📁 Added to queue: ${file.name} (${file.size} bytes) -> ${upload.targetPath}`)
    }

    // Créer les dossiers nécessaires
    if (foldersToCreate.size > 0) {
      console.log(`📂 Creating ${foldersToCreate.size} folders:`, Array.from(foldersToCreate))
      await this.createFolders(Array.from(foldersToCreate))
    }

    // Ajouter les uploads à la queue
    for (const upload of newUploads) {
      this.uploadQueue.push(upload.id)
    }

    console.log(`📋 Upload queue now has ${this.uploadQueue.length} items`)
    
    // Démarrer les uploads
    this.processQueue()
    
    return newUploads
  }

  // Traiter la queue d'uploads
  async processQueue() {
    console.log(`🔄 Processing queue: ${this.uploadQueue.length} pending, ${this.activeUploads}/${this.maxConcurrentUploads} active`)
    
    while (this.uploadQueue.length > 0 && this.activeUploads < this.maxConcurrentUploads) {
      const uploadId = this.uploadQueue.shift()
      const upload = this.uploads.get(uploadId)
      
      if (upload && upload.status === 'pending') {
        console.log(`▶️ Starting upload: ${upload.fileName}`)
        this.startUpload(upload)
      }
    }
  }

  // Créer les dossiers nécessaires
  async createFolders(folderPaths) {
    for (const folderPath of folderPaths) {
      try {
        console.log(`📂 Creating folder: ${folderPath}`)
        
        // Séparer le chemin parent et le nom du dossier
        const lastSlashIndex = folderPath.lastIndexOf('/')
        const parentPath = folderPath.substring(0, lastSlashIndex) || '/'
        const folderName = folderPath.substring(lastSlashIndex + 1)
        
        // Utiliser l'API pour créer le dossier
        const response = await nasAPI.createFolder(parentPath, folderName)
        if (response.success) {
          console.log(`✅ Folder created: ${folderPath}`)
        } else {
          console.log(`ℹ️ Folder might already exist: ${folderPath}`)
        }
      } catch (error) {
        // Ignorer les erreurs si le dossier existe déjà
        console.log(`ℹ️ Folder creation skipped (might exist): ${folderPath} - ${error.message}`)
      }
    }
  }

  // Démarrer un upload individuel
  async startUpload(upload) {
    try {
      this.activeUploads++
      upload.status = 'uploading'
      upload.startTime = Date.now()

      // Fonction de callback pour la progression
      const onProgress = (percentComplete) => {
        console.log(`📊 Progress for ${upload.fileName}: ${percentComplete.toFixed(1)}%`)
        
        upload.progress = Math.min(100, Math.max(0, percentComplete)) // Clamp entre 0 et 100
        upload.uploadedBytes = (upload.progress / 100) * upload.fileSize
        
        // Calculer la vitesse et le temps estimé
        const now = Date.now()
        const elapsed = (now - upload.startTime) / 1000 // en secondes
        
        if (elapsed > 0) {
          upload.speed = upload.uploadedBytes / elapsed // bytes par seconde
          
          const remainingBytes = upload.fileSize - upload.uploadedBytes
          if (upload.speed > 0) {
            upload.estimatedTime = remainingBytes / upload.speed
          }
        }
      }

      const response = await nasAPI.uploadFile(upload.file, upload.targetPath, false, onProgress)
      
      if (response.success) {
        console.log(`✅ Upload completed successfully: ${upload.fileName}`)
        upload.status = 'completed'
        upload.progress = 100
        upload.estimatedTime = 0
      } else {
        throw new Error(response.message || 'Upload failed')
      }

    } catch (error) {
      console.error(`❌ Upload error for ${upload.fileName} to ${upload.targetPath}:`, error)
      upload.status = 'error'
      upload.error = error.message || 'Erreur inconnue'
      
      // Retry automatique si pas encore atteint le maximum
      if (upload.retryCount < upload.maxRetries) {
        upload.retryCount++
        console.log(`🔄 Scheduling retry for ${upload.fileName} (attempt ${upload.retryCount}/${upload.maxRetries})`)
        setTimeout(() => {
          this.retryUpload(upload.id)
        }, 2000) // Attendre 2 secondes avant retry
      } else {
        console.log(`💀 Max retries reached for ${upload.fileName}`)
      }
    } finally {
      this.activeUploads--
      console.log(`📉 Active uploads decreased to ${this.activeUploads}, queue: ${this.uploadQueue.length} pending`)
      // Continuer avec les uploads suivants
      this.processQueue()
    }
  }



  // Réessayer un upload
  async retryUpload(uploadId) {
    const upload = this.uploads.get(uploadId)
    if (!upload) return

    upload.retryCount++
    upload.status = 'pending'
    upload.error = null
    upload.progress = 0
    upload.uploadedBytes = 0
    upload.speed = 0
    upload.estimatedTime = 0

    // Remettre en queue
    this.uploadQueue.unshift(uploadId) // Priorité haute
    this.processQueue()
  }

  // Annuler un upload
  cancelUpload(uploadId) {
    const upload = this.uploads.get(uploadId)
    if (!upload) return

    upload.status = 'cancelled'
    upload.error = 'Annulé par l\'utilisateur'
    
    // Retirer de la queue si pas encore démarré
    const queueIndex = this.uploadQueue.indexOf(uploadId)
    if (queueIndex > -1) {
      this.uploadQueue.splice(queueIndex, 1)
    }
  }

  // Annuler tous les uploads
  cancelAllUploads() {
    for (const [uploadId, upload] of this.uploads) {
      if (upload.status === 'pending' || upload.status === 'uploading') {
        this.cancelUpload(uploadId)
      }
    }
    this.uploadQueue = []
  }

  // Obtenir tous les uploads
  getAllUploads() {
    return Array.from(this.uploads.values())
  }

  // Obtenir les uploads actifs
  getActiveUploads() {
    return Array.from(this.uploads.values()).filter(upload => 
      upload.status === 'pending' || upload.status === 'uploading'
    )
  }

  // Nettoyer les uploads terminés
  clearCompletedUploads() {
    for (const [uploadId, upload] of this.uploads) {
      if (upload.status === 'completed') {
        this.uploads.delete(uploadId)
      }
    }
  }

  // Vérifier si des uploads sont en cours
  hasActiveUploads() {
    return this.getActiveUploads().length > 0
  }

  // Obtenir les statistiques globales
  getGlobalStats() {
    const uploads = this.getAllUploads()
    const total = uploads.length
    const completed = uploads.filter(u => u.status === 'completed').length
    const failed = uploads.filter(u => u.status === 'error').length
    const active = uploads.filter(u => u.status === 'uploading' || u.status === 'pending').length

    const totalBytes = uploads.reduce((sum, u) => sum + u.fileSize, 0)
    const uploadedBytes = uploads.reduce((sum, u) => sum + u.uploadedBytes, 0)
    const globalProgress = totalBytes > 0 ? (uploadedBytes / totalBytes) * 100 : 0

    // Log des statistiques si tous les uploads sont terminés
    if (active === 0 && total > 0) {
      console.log(`📊 Upload session complete: ${completed}/${total} successful, ${failed} failed`)
      if (failed > 0) {
        const failedUploads = uploads.filter(u => u.status === 'error')
        console.log(`❌ Failed uploads:`, failedUploads.map(u => `${u.fileName}: ${u.error}`))
      }
    }

    return {
      total,
      completed,
      failed,
      active,
      totalBytes,
      uploadedBytes,
      globalProgress
    }
  }
}

// Instance singleton
export const uploadService = new UploadService()

// Composable pour utiliser le service dans les composants
export function useUploadService() {
  const uploads = ref([])
  
  // Mettre à jour la liste des uploads
  const updateUploads = () => {
    uploads.value = uploadService.getAllUploads()
  }

  // Surveiller les changements (polling simple)
  const startPolling = () => {
    const interval = setInterval(updateUploads, 500)
    return () => clearInterval(interval)
  }

  return {
    uploads,
    uploadService,
    updateUploads,
    startPolling
  }
}