/**
 * Upload Service - Manages batch uploads with progress tracking and error recovery
 */

import { ref, reactive, computed } from 'vue'
import { nasAPI } from './nasAPI.js'

// Upload queue item structure
class UploadItem {
  constructor(file, targetPath, options = {}) {
    this.id = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.file = file
    this.targetPath = targetPath
    this.fileName = file.name
    this.fileSize = file.size
    this.relativePath = file.relativePath || file.name
    this.uploadedBytes = 0
    this.progress = 0
    this.status = 'pending' // pending, uploading, completed, error, cancelled
    this.error = null
    this.startTime = null
    this.endTime = null
    this.retryCount = 0
    this.maxRetries = options.maxRetries || 3
    this.overwrite = options.overwrite || false
  }

  get estimatedTime() {
    if (this.status !== 'uploading' || this.uploadedBytes === 0) return null
    
    const elapsed = Date.now() - this.startTime
    const bytesPerMs = this.uploadedBytes / elapsed
    const remainingBytes = this.fileSize - this.uploadedBytes
    
    return remainingBytes / bytesPerMs
  }

  get uploadSpeed() {
    if (this.status !== 'uploading' || !this.startTime) return 0
    
    const elapsed = Date.now() - this.startTime
    return elapsed > 0 ? (this.uploadedBytes / elapsed) * 1000 : 0 // bytes per second
  }
}

class UploadService {
  constructor() {
    // Reactive state
    this.queue = ref([])
    this.activeUploads = ref([])
    this.completedUploads = ref([])
    this.failedUploads = ref([])
    
    // Configuration
    this.maxConcurrentUploads = ref(3)
    this.autoRetry = ref(true)
    this.retryDelay = ref(1000) // ms
    
    // Statistics
    this.stats = reactive({
      totalFiles: 0,
      completedFiles: 0,
      failedFiles: 0,
      totalBytes: 0,
      uploadedBytes: 0,
      startTime: null,
      endTime: null
    })
    
    // Processing state
    this.isProcessing = ref(false)
    this.isPaused = ref(false)
  }

  // Computed properties
  get overallProgress() {
    if (this.stats.totalBytes === 0) return 0
    return (this.stats.uploadedBytes / this.stats.totalBytes) * 100
  }

  get uploadSpeed() {
    if (!this.stats.startTime || this.stats.uploadedBytes === 0) return 0
    
    const elapsed = Date.now() - this.stats.startTime
    return elapsed > 0 ? (this.stats.uploadedBytes / elapsed) * 1000 : 0 // bytes per second
  }

  get estimatedTimeRemaining() {
    if (this.uploadSpeed === 0) return null
    
    const remainingBytes = this.stats.totalBytes - this.stats.uploadedBytes
    return remainingBytes / this.uploadSpeed
  }

  get allUploads() {
    return [
      ...this.queue.value,
      ...this.activeUploads.value,
      ...this.completedUploads.value,
      ...this.failedUploads.value
    ]
  }

  // Add files to upload queue
  addFiles(files, targetPath, options = {}) {
    console.log('📤 Adding', files.length, 'files to upload queue')
    
    const uploadItems = files.map(file => new UploadItem(file, targetPath, options))
    
    // Add to queue
    this.queue.value.push(...uploadItems)
    
    // Update statistics
    this.stats.totalFiles += files.length
    this.stats.totalBytes += files.reduce((sum, file) => sum + file.size, 0)
    
    // Start processing if not already running
    if (!this.isProcessing.value && !this.isPaused.value) {
      this.startProcessing()
    }
    
    return uploadItems.map(item => item.id)
  }

  // Start processing the upload queue
  async startProcessing() {
    if (this.isProcessing.value) return
    
    console.log('🚀 Starting upload processing')
    this.isProcessing.value = true
    this.stats.startTime = Date.now()
    
    try {
      while (this.queue.value.length > 0 && !this.isPaused.value) {
        // Start uploads up to the concurrent limit
        while (
          this.activeUploads.value.length < this.maxConcurrentUploads.value &&
          this.queue.value.length > 0 &&
          !this.isPaused.value
        ) {
          const uploadItem = this.queue.value.shift()
          this.processUpload(uploadItem)
        }
        
        // Wait a bit before checking again
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      // Wait for all active uploads to complete
      while (this.activeUploads.value.length > 0 && !this.isPaused.value) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
    } catch (error) {
      console.error('Upload processing error:', error)
    } finally {
      this.isProcessing.value = false
      this.stats.endTime = Date.now()
      console.log('✅ Upload processing completed')
    }
  }

  // Process individual upload
  async processUpload(uploadItem) {
    console.log('📤 Processing upload:', uploadItem.fileName)
    
    // Move to active uploads
    this.activeUploads.value.push(uploadItem)
    uploadItem.status = 'uploading'
    uploadItem.startTime = Date.now()
    
    try {
      // Ensure target directory exists
      await this.ensureDirectoryExists(uploadItem.targetPath, uploadItem.relativePath)
      
      // Determine final upload path
      const finalPath = this.getFinalUploadPath(uploadItem.targetPath, uploadItem.relativePath)
      
      // Upload the file
      await nasAPI.uploadFile(
        uploadItem.file,
        finalPath,
        uploadItem.overwrite,
        (progress) => {
          // Update item progress
          uploadItem.progress = progress
          uploadItem.uploadedBytes = (progress / 100) * uploadItem.fileSize
          
          // Update overall statistics
          this.updateOverallProgress()
        }
      )
      
      // Upload completed successfully
      uploadItem.status = 'completed'
      uploadItem.endTime = Date.now()
      uploadItem.progress = 100
      uploadItem.uploadedBytes = uploadItem.fileSize
      
      // Move to completed uploads
      this.moveToCompleted(uploadItem)
      this.stats.completedFiles++
      
      console.log('✅ Upload completed:', uploadItem.fileName)
      
    } catch (error) {
      console.error('❌ Upload failed:', uploadItem.fileName, error)
      
      uploadItem.error = error.message
      uploadItem.status = 'error'
      uploadItem.endTime = Date.now()
      
      // Try to retry if enabled and retries available
      if (this.autoRetry.value && uploadItem.retryCount < uploadItem.maxRetries) {
        uploadItem.retryCount++
        uploadItem.status = 'pending'
        uploadItem.error = null
        
        console.log(`🔄 Retrying upload (${uploadItem.retryCount}/${uploadItem.maxRetries}):`, uploadItem.fileName)
        
        // Add back to queue after delay
        setTimeout(() => {
          this.queue.value.unshift(uploadItem)
        }, this.retryDelay.value)
        
      } else {
        // Move to failed uploads
        this.moveToFailed(uploadItem)
        this.stats.failedFiles++
      }
    } finally {
      // Remove from active uploads
      const index = this.activeUploads.value.findIndex(item => item.id === uploadItem.id)
      if (index !== -1) {
        this.activeUploads.value.splice(index, 1)
      }
    }
  }

  // Helper methods
  async ensureDirectoryExists(targetPath, relativePath) {
    if (relativePath === undefined || relativePath === null) return targetPath
    
    // Extract directory path from relative path
    const lastSlashIndex = relativePath.lastIndexOf('/')
    if (lastSlashIndex === -1) return targetPath
    
    const relativeDirPath = relativePath.substring(0, lastSlashIndex)
    const fullDirPath = nasAPI.joinPaths(targetPath, relativeDirPath)
    
    try {
      // Check if directory exists
      await nasAPI.browse(fullDirPath)
    } catch (error) {
      // Directory doesn't exist, create it recursively
      await this.createDirectoryRecursively(fullDirPath)
    }
    
    return fullDirPath
  }

  async createDirectoryRecursively(dirPath) {
    const pathSegments = dirPath.split('/').filter(segment => segment !== '')
    let currentPath = '/'
    
    for (const segment of pathSegments) {
      currentPath = nasAPI.joinPaths(currentPath, segment)
      
      try {
        await nasAPI.browse(currentPath)
      } catch (error) {
        // Directory doesn't exist, create it
        const parentPath = nasAPI.getParentPath(currentPath)
        const folderName = nasAPI.getFilename(currentPath)
        
        await nasAPI.createFolder(parentPath, folderName)
        console.log('📁 Created directory:', currentPath)
      }
    }
  }

  getFinalUploadPath(targetPath, relativePath) {
    if (!relativePath || relativePath === '') return targetPath
    
    const lastSlashIndex = relativePath.lastIndexOf('/')
    if (lastSlashIndex === -1) return targetPath
    
    const relativeDirPath = relativePath.substring(0, lastSlashIndex)
    return nasAPI.joinPaths(targetPath, relativeDirPath)
  }

  moveToCompleted(uploadItem) {
    this.completedUploads.value.push(uploadItem)
  }

  moveToFailed(uploadItem) {
    this.failedUploads.value.push(uploadItem)
  }

  updateOverallProgress() {
    // Calculate total uploaded bytes across all items
    let totalUploaded = 0
    
    // Add completed uploads
    totalUploaded += this.completedUploads.value.reduce((sum, item) => sum + item.fileSize, 0)
    
    // Add progress from active uploads
    totalUploaded += this.activeUploads.value.reduce((sum, item) => sum + item.uploadedBytes, 0)
    
    this.stats.uploadedBytes = totalUploaded
  }

  // Control methods
  pause() {
    console.log('⏸️ Pausing uploads')
    this.isPaused.value = true
  }

  resume() {
    console.log('▶️ Resuming uploads')
    this.isPaused.value = false
    
    if (!this.isProcessing.value && this.queue.value.length > 0) {
      this.startProcessing()
    }
  }

  cancel(uploadId) {
    console.log('❌ Cancelling upload:', uploadId)
    
    // Find and remove from queue
    const queueIndex = this.queue.value.findIndex(item => item.id === uploadId)
    if (queueIndex !== -1) {
      const item = this.queue.value.splice(queueIndex, 1)[0]
      item.status = 'cancelled'
      this.failedUploads.value.push(item)
      return true
    }
    
    // Find in active uploads (can't cancel active uploads easily with current API)
    const activeIndex = this.activeUploads.value.findIndex(item => item.id === uploadId)
    if (activeIndex !== -1) {
      const item = this.activeUploads.value[activeIndex]
      item.status = 'cancelled'
      // Note: The actual upload will continue, but we mark it as cancelled
      return true
    }
    
    return false
  }

  retry(uploadId) {
    console.log('🔄 Retrying upload:', uploadId)
    
    const failedIndex = this.failedUploads.value.findIndex(item => item.id === uploadId)
    if (failedIndex !== -1) {
      const item = this.failedUploads.value.splice(failedIndex, 1)[0]
      
      // Reset item state
      item.status = 'pending'
      item.error = null
      item.progress = 0
      item.uploadedBytes = 0
      item.startTime = null
      item.endTime = null
      
      // Add back to queue
      this.queue.value.push(item)
      
      // Start processing if not running
      if (!this.isProcessing.value && !this.isPaused.value) {
        this.startProcessing()
      }
      
      return true
    }
    
    return false
  }

  clear() {
    console.log('🧹 Clearing upload service')
    
    this.queue.value = []
    this.completedUploads.value = []
    this.failedUploads.value = []
    
    // Reset statistics
    this.stats.totalFiles = 0
    this.stats.completedFiles = 0
    this.stats.failedFiles = 0
    this.stats.totalBytes = 0
    this.stats.uploadedBytes = 0
    this.stats.startTime = null
    this.stats.endTime = null
  }

  // Get upload by ID
  getUpload(uploadId) {
    return this.allUploads.find(item => item.id === uploadId)
  }

  // Get uploads by status
  getUploadsByStatus(status) {
    return this.allUploads.filter(item => item.status === status)
  }
}

// Create and export singleton instance
export const uploadService = new UploadService()
export { UploadItem }
export default uploadService