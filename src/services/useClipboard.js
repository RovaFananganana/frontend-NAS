// services/useClipboard.js
import { ref, reactive } from 'vue'
import { useSynologyAPI } from './useSynologyAPI'

const clipboardState = reactive({
  items: [],
  operation: null // 'copy' | 'cut'
})

export function useClipboard() {
  const synologyAPI = useSynologyAPI()

  const copy = (items) => {
    clipboardState.items = [...items]
    clipboardState.operation = 'copy'
  }

  const cut = (items) => {
    clipboardState.items = [...items]
    clipboardState.operation = 'cut'
  }

  const paste = async (destPath, onProgress = null) => {
    if (clipboardState.items.length === 0) return

    const results = []
    const totalItems = clipboardState.items.length
    
    for (let i = 0; i < clipboardState.items.length; i++) {
      const item = clipboardState.items[i]
      
      try {
        // Callback de progression pour l'élément actuel
        const itemProgress = (progress) => {
          if (onProgress) {
            const overallProgress = {
              currentItem: i + 1,
              totalItems: totalItems,
              currentItemProgress: progress,
              overallProgress: Math.round(((i + (progress.progress || 0) / 100) / totalItems) * 100),
              currentPath: item.path,
              status: progress.status || 'processing'
            }
            onProgress(overallProgress)
          }
        }
        
        if (clipboardState.operation === 'copy') {
          // Utiliser l'API de copie avec suivi de progression
          const result = await synologyAPI.copyFile(item.path, destPath, itemProgress)
          results.push({ item, success: true, result })
        } else if (clipboardState.operation === 'cut') {
          const result = await synologyAPI.moveFile(item.path, destPath)
          results.push({ item, success: true, result })
        }
      } catch (error) {
        results.push({ item, success: false, error: error.message })
      }
    }

    // Vider le presse-papiers après un cut
    if (clipboardState.operation === 'cut') {
      clear()
    }

    return results
  }

  const clear = () => {
    clipboardState.items = []
    clipboardState.operation = null
  }

  return {
    items: clipboardState.items,
    operation: clipboardState.operation,
    copy,
    cut,
    paste,
    clear
  }
}