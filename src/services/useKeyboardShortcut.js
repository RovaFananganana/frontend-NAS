// composables/useKeyboardShortcut.js
import { onMounted, onUnmounted } from 'vue'

export function useKeyboardShortcuts(shortcuts = {}) {
  const handleKeydown = (event) => {
    const key = event.key.toLowerCase()
    const modifiers = {
      ctrl: event.ctrlKey || event.metaKey,
      shift: event.shiftKey,
      alt: event.altKey
    }

    // Construire la clé de raccourci
    let shortcutKey = ''
    if (modifiers.ctrl) shortcutKey += 'ctrl+'
    if (modifiers.shift) shortcutKey += 'shift+'
    if (modifiers.alt) shortcutKey += 'alt+'
    shortcutKey += key

    // Exécuter le raccourci s'il existe
    if (shortcuts[shortcutKey]) {
      event.preventDefault()
      shortcuts[shortcutKey](event)
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
  })

  return {
    handleKeydown
  }
}
