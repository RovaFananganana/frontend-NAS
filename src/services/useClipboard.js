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

  const paste = async (destPath) => {
    if (clipboardState.items.length === 0) return

    const results = []
    
    for (const item of clipboardState.items) {
      try {
        if (clipboardState.operation === 'copy') {
          // Pour la copie, on devrait implémenter une API de copie
          // Pour l'instant, on simule avec un déplacement temporaire
          console.warn('Copy operation not fully implemented')
          results.push({ item, success: false, error: 'Copy not implemented' })
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