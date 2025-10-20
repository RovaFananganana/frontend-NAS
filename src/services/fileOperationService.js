import { ref, computed } from 'vue'
import { nasAPI } from './nasAPI.js'

class FileOperationService {
  constructor() {
    this.operations = ref([])
    this.currentOperation = ref(null)
  }

  // Computed properties
  get isProcessing() {
    return computed(() => this.currentOperation.value !== null)
  }

  get activeOperations() {
    return computed(() => this.operations.value.filter(op => op.status === 'processing'))
  }

  // Start a copy operation
  async startCopy(items, destinationPath, options = {}) {
    const operation = this.createOperation('copy', items, destinationPath, options)
    this.operations.value.push(operation)
    this.currentOperation.value = operation

    try {
      await this.executeCopyOperation(operation)
    } catch (error) {
      operation.error = error.message
      operation.status = 'error'
    } finally {
      this.currentOperation.value = null
    }

    return operation
  }

  // Start a move operation
  async startMove(items, destinationPath, options = {}) {
    const operation = this.createOperation('move', items, destinationPath, options)
    this.operations.value.push(operation)
    this.currentOperation.value = operation

    try {
      await this.executeMoveOperation(operation)
    } catch (error) {
      operation.error = error.message
      operation.status = 'error'
    } finally {
      this.currentOperation.value = null
    }

    return operation
  }

  // Create operation object
  createOperation(type, items, destinationPath, options) {
    const totalSize = items.reduce((sum, item) => sum + (item.size || 0), 0)
    
    return {
      id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      type, // 'copy' or 'move'
      items: [...items],
      destinationPath,
      status: 'processing', // 'processing', 'completed', 'error', 'cancelled'
      progress: 0,
      currentFile: null,
      totalSize,
      transferredSize: 0,
      startTime: Date.now(),
      endTime: null,
      speed: 0,
      timeRemaining: 0,
      error: null,
      cancelled: false,
      ...options
    }
  }

  // Execute copy operation
  async executeCopyOperation(operation) {
    operation.status = 'processing'
    
    for (let i = 0; i < operation.items.length; i++) {
      if (operation.cancelled) {
        operation.status = 'cancelled'
        return
      }

      const item = operation.items[i]
      operation.currentFile = item.name
      
      try {
        // Update progress for current file
        const fileProgress = (i / operation.items.length) * 100
        operation.progress = fileProgress

        // Simulate file copy with progress updates
        await this.copyFileWithProgress(item, operation.destinationPath, (progress) => {
          const itemProgress = (progress / 100) * (100 / operation.items.length)
          const baseProgress = (i / operation.items.length) * 100
          operation.progress = baseProgress + itemProgress
          
          // Update speed and time estimates
          this.updateOperationStats(operation)
        })

        operation.transferredSize += item.size || 0
        
      } catch (error) {
        console.error(`Error copying ${item.name}:`, error)
        // Continue with other files, but log the error
        operation.error = `Erreur lors de la copie de ${item.name}: ${error.message}`
      }
    }

    operation.status = 'completed'
    operation.progress = 100
    operation.endTime = Date.now()
    operation.currentFile = null
  }

  // Execute move operation
  async executeMoveOperation(operation) {
    operation.status = 'processing'
    
    for (let i = 0; i < operation.items.length; i++) {
      if (operation.cancelled) {
        operation.status = 'cancelled'
        return
      }

      const item = operation.items[i]
      operation.currentFile = item.name
      
      try {
        // Update progress for current file
        const fileProgress = (i / operation.items.length) * 100
        operation.progress = fileProgress

        // Move file (copy + delete)
        await this.moveFileWithProgress(item, operation.destinationPath, (progress) => {
          const itemProgress = (progress / 100) * (100 / operation.items.length)
          const baseProgress = (i / operation.items.length) * 100
          operation.progress = baseProgress + itemProgress
          
          // Update speed and time estimates
          this.updateOperationStats(operation)
        })

        operation.transferredSize += item.size || 0
        
      } catch (error) {
        console.error(`Error moving ${item.name}:`, error)
        operation.error = `Erreur lors du déplacement de ${item.name}: ${error.message}`
        break // Stop on move errors as it's more critical
      }
    }

    operation.status = operation.error ? 'error' : 'completed'
    operation.progress = operation.error ? operation.progress : 100
    operation.endTime = Date.now()
    operation.currentFile = null
  }

  // Copy file with progress callback
  async copyFileWithProgress(item, destinationPath, onProgress) {
    const sourcePath = item.path
    const destPath = `${destinationPath}/${item.name}`
    
    // For large files, simulate chunked transfer with progress
    if (item.size > 10 * 1024 * 1024) { // > 10MB
      return this.copyLargeFileWithProgress(sourcePath, destPath, item.size, onProgress)
    } else {
      // Small files - direct copy
      onProgress(0)
      await nasAPI.copyFile(sourcePath, destPath)
      onProgress(100)
    }
  }

  // Move file with progress callback
  async moveFileWithProgress(item, destinationPath, onProgress) {
    const sourcePath = item.path
    const destPath = `${destinationPath}/${item.name}`
    
    // For large files, show progress
    if (item.size > 10 * 1024 * 1024) { // > 10MB
      // Copy with progress
      await this.copyLargeFileWithProgress(sourcePath, destPath, item.size, (progress) => {
        onProgress(progress * 0.8) // Copy is 80% of the operation
      })
      
      // Delete original (20% of the operation)
      onProgress(80)
      await nasAPI.deleteFile(sourcePath)
      onProgress(100)
    } else {
      // Small files - direct move
      onProgress(0)
      await nasAPI.moveFile(sourcePath, destPath)
      onProgress(100)
    }
  }

  // Simulate large file copy with progress
  async copyLargeFileWithProgress(sourcePath, destPath, fileSize, onProgress) {
    const chunkSize = 1024 * 1024 // 1MB chunks
    const totalChunks = Math.ceil(fileSize / chunkSize)
    
    // Simulate chunked transfer
    for (let chunk = 0; chunk < totalChunks; chunk++) {
      if (this.currentOperation.value?.cancelled) {
        throw new Error('Operation cancelled')
      }
      
      // Simulate network delay based on chunk size
      const delay = Math.min(100, chunkSize / (1024 * 10)) // Max 100ms delay
      await new Promise(resolve => setTimeout(resolve, delay))
      
      const progress = ((chunk + 1) / totalChunks) * 100
      onProgress(progress)
    }
    
    // Actually perform the copy (this would be the real API call)
    await nasAPI.copyFile(sourcePath, destPath)
  }

  // Update operation statistics
  updateOperationStats(operation) {
    const now = Date.now()
    const elapsed = now - operation.startTime
    
    if (elapsed > 1000 && operation.transferredSize > 0) {
      // Calculate speed (bytes per second)
      operation.speed = operation.transferredSize / (elapsed / 1000)
      
      // Estimate time remaining
      const remainingSize = operation.totalSize - operation.transferredSize
      if (operation.speed > 0) {
        operation.timeRemaining = (remainingSize / operation.speed) * 1000
      }
    }
  }

  // Cancel operation
  cancelOperation(operationId) {
    const operation = this.operations.value.find(op => op.id === operationId)
    if (operation && operation.status === 'processing') {
      operation.cancelled = true
      operation.status = 'cancelled'
      
      if (this.currentOperation.value?.id === operationId) {
        this.currentOperation.value = null
      }
    }
  }

  // Remove completed/error operations
  removeOperation(operationId) {
    const index = this.operations.value.findIndex(op => op.id === operationId)
    if (index !== -1) {
      this.operations.value.splice(index, 1)
    }
  }

  // Clear all completed operations
  clearCompleted() {
    this.operations.value = this.operations.value.filter(
      op => op.status === 'processing'
    )
  }

  // Get operation by ID
  getOperation(operationId) {
    return this.operations.value.find(op => op.id === operationId)
  }
}

// Create singleton instance
export const fileOperationService = new FileOperationService()
export default fileOperationService