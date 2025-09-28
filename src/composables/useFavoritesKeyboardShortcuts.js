/**
 * Keyboard Shortcuts Composable for Favorites Navigation
 * Provides comprehensive keyboard navigation for favorites panel
 */

import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useKeyboardShortcuts } from './useKeyboardShortcuts.js'
import { FAVORITES_SHORTCUTS, ACCESSIBILITY_ANNOUNCEMENTS } from '@/utils/feedbackMessages.js'

/**
 * Composable for favorites-specific keyboard shortcuts
 * @param {Object} options - Configuration options
 * @returns {Object} Keyboard shortcuts API
 */
export function useFavoritesKeyboardShortcuts(options = {}) {
  const {
    favoritesRef = null,
    onNavigate = null,
    onAdd = null,
    onRemove = null,
    onRename = null,
    onValidate = null,
    onSearch = null,
    announceToScreenReader = null
  } = options

  // State
  const isActive = ref(true)
  const selectedIndex = ref(-1)
  const favorites = ref([])
  const searchQuery = ref('')
  const isSearchMode = ref(false)

  // Computed
  const filteredFavorites = computed(() => {
    if (!isSearchMode.value || !searchQuery.value) {
      return favorites.value
    }
    
    const query = searchQuery.value.toLowerCase()
    return favorites.value.filter(fav => 
      fav.name.toLowerCase().includes(query) ||
      fav.path.toLowerCase().includes(query)
    )
  })

  const selectedFavorite = computed(() => {
    const list = filteredFavorites.value
    return selectedIndex.value >= 0 && selectedIndex.value < list.length
      ? list[selectedIndex.value]
      : null
  })

  const canNavigateUp = computed(() => selectedIndex.value > 0)
  const canNavigateDown = computed(() => selectedIndex.value < filteredFavorites.value.length - 1)

  // Keyboard shortcut handlers
  const shortcuts = {
    // Navigation
    'Up': handleNavigateUp,
    'Down': handleNavigateDown,
    'Home': handleNavigateToFirst,
    'End': handleNavigateToLast,
    'PageUp': handlePageUp,
    'PageDown': handlePageDown,
    
    // Actions
    'Enter': handleOpenSelected,
    'Space': handleOpenSelected,
    'F2': handleRenameSelected,
    'Delete': handleRemoveSelected,
    'Shift+Delete': handleRemoveSelectedPermanent,
    
    // Management
    'Ctrl+A': handleSelectAll,
    'Ctrl+R': handleRefresh,
    'Ctrl+V': handleValidateAll,
    'Ctrl+F': handleStartSearch,
    'Ctrl+N': handleAddCurrent,
    
    // Search
    'Esc': handleEscapeOrClear,
    'Ctrl+Backspace': handleClearSearch,
    
    // Quick navigation
    'Ctrl+1': () => handleQuickNavigate(0),
    'Ctrl+2': () => handleQuickNavigate(1),
    'Ctrl+3': () => handleQuickNavigate(2),
    'Ctrl+4': () => handleQuickNavigate(3),
    'Ctrl+5': () => handleQuickNavigate(4),
    'Ctrl+6': () => handleQuickNavigate(5),
    'Ctrl+7': () => handleQuickNavigate(6),
    'Ctrl+8': () => handleQuickNavigate(7),
    'Ctrl+9': () => handleQuickNavigate(8),
    'Ctrl+0': () => handleQuickNavigate(9),
    
    // Help
    'F1': handleShowHelp,
    '?': handleShowHelp,
    'Ctrl+H': handleShowHelp
  }

  // Initialize keyboard shortcuts
  const { 
    addShortcut, 
    removeShortcut, 
    setActive: setShortcutsActive,
    setCurrentFocus
  } = useKeyboardShortcuts(shortcuts, {
    context: 'favorites',
    priority: 10 // High priority for favorites
  })

  // Navigation handlers
  function handleNavigateUp(event) {
    if (!canNavigateUp.value) return
    
    event.preventDefault()
    selectedIndex.value--
    scrollToSelected()
    announceSelection()
  }

  function handleNavigateDown(event) {
    if (!canNavigateDown.value) return
    
    event.preventDefault()
    selectedIndex.value++
    scrollToSelected()
    announceSelection()
  }

  function handleNavigateToFirst(event) {
    if (filteredFavorites.value.length === 0) return
    
    event.preventDefault()
    selectedIndex.value = 0
    scrollToSelected()
    announceSelection()
  }

  function handleNavigateToLast(event) {
    if (filteredFavorites.value.length === 0) return
    
    event.preventDefault()
    selectedIndex.value = filteredFavorites.value.length - 1
    scrollToSelected()
    announceSelection()
  }

  function handlePageUp(event) {
    event.preventDefault()
    const pageSize = 5 // Navigate 5 items at a time
    selectedIndex.value = Math.max(0, selectedIndex.value - pageSize)
    scrollToSelected()
    announceSelection()
  }

  function handlePageDown(event) {
    event.preventDefault()
    const pageSize = 5
    const maxIndex = filteredFavorites.value.length - 1
    selectedIndex.value = Math.min(maxIndex, selectedIndex.value + pageSize)
    scrollToSelected()
    announceSelection()
  }

  // Action handlers
  function handleOpenSelected(event) {
    const favorite = selectedFavorite.value
    if (!favorite) return
    
    event.preventDefault()
    
    if (onNavigate && typeof onNavigate === 'function') {
      onNavigate(favorite)
      announce(ACCESSIBILITY_ANNOUNCEMENTS.FAVORITE_OPENED(favorite.name))
    }
  }

  function handleRenameSelected(event) {
    const favorite = selectedFavorite.value
    if (!favorite) return
    
    event.preventDefault()
    
    if (onRename && typeof onRename === 'function') {
      onRename(favorite)
    }
  }

  function handleRemoveSelected(event) {
    const favorite = selectedFavorite.value
    if (!favorite) return
    
    event.preventDefault()
    
    if (onRemove && typeof onRemove === 'function') {
      onRemove(favorite, false) // false = not permanent
      announce(ACCESSIBILITY_ANNOUNCEMENTS.FAVORITE_REMOVED(favorite.name))
      
      // Adjust selection after removal
      if (selectedIndex.value >= filteredFavorites.value.length - 1) {
        selectedIndex.value = Math.max(0, filteredFavorites.value.length - 2)
      }
    }
  }

  function handleRemoveSelectedPermanent(event) {
    const favorite = selectedFavorite.value
    if (!favorite) return
    
    event.preventDefault()
    
    if (onRemove && typeof onRemove === 'function') {
      onRemove(favorite, true) // true = permanent
      announce(ACCESSIBILITY_ANNOUNCEMENTS.FAVORITE_REMOVED(favorite.name))
    }
  }

  // Management handlers
  function handleSelectAll(event) {
    event.preventDefault()
    // For favorites, this could select all for batch operations
    announce(`Tous les favoris sélectionnés (${filteredFavorites.value.length})`)
  }

  function handleRefresh(event) {
    event.preventDefault()
    
    if (onValidate && typeof onValidate === 'function') {
      onValidate()
      announce('Actualisation des favoris en cours')
    }
  }

  function handleValidateAll(event) {
    event.preventDefault()
    
    if (onValidate && typeof onValidate === 'function') {
      onValidate()
      announce('Validation de tous les favoris en cours')
    }
  }

  function handleStartSearch(event) {
    event.preventDefault()
    isSearchMode.value = true
    searchQuery.value = ''
    
    // Focus search input if available
    nextTick(() => {
      const searchInput = document.querySelector('.favorites-search-input')
      if (searchInput) {
        searchInput.focus()
      }
    })
    
    announce('Mode recherche activé dans les favoris')
  }

  function handleAddCurrent(event) {
    event.preventDefault()
    
    if (onAdd && typeof onAdd === 'function') {
      onAdd()
      announce('Dossier actuel ajouté aux favoris')
    }
  }

  // Search and escape handlers
  function handleEscapeOrClear(event) {
    event.preventDefault()
    
    if (isSearchMode.value) {
      // Exit search mode
      isSearchMode.value = false
      searchQuery.value = ''
      selectedIndex.value = -1
      announce('Mode recherche désactivé')
    } else {
      // Clear selection
      selectedIndex.value = -1
      announce('Sélection effacée')
    }
  }

  function handleClearSearch(event) {
    if (!isSearchMode.value) return
    
    event.preventDefault()
    searchQuery.value = ''
    announce('Recherche effacée')
  }

  // Quick navigation handlers
  function handleQuickNavigate(index) {
    if (index >= filteredFavorites.value.length) return
    
    const favorite = filteredFavorites.value[index]
    if (favorite && onNavigate && typeof onNavigate === 'function') {
      onNavigate(favorite)
      announce(ACCESSIBILITY_ANNOUNCEMENTS.FAVORITE_OPENED(favorite.name))
    }
  }

  // Help handler
  function handleShowHelp(event) {
    event.preventDefault()
    
    // Show keyboard shortcuts help
    const shortcuts = Object.entries(FAVORITES_SHORTCUTS)
      .map(([key, desc]) => `${key}: ${desc}`)
      .join('\n')
    
    announce('Aide des raccourcis clavier affichée')
    
    // Could emit event to show help modal
    if (typeof window !== 'undefined') {
      console.log('Raccourcis clavier des favoris:\n', shortcuts)
    }
  }

  // Utility functions
  function scrollToSelected() {
    if (!favoritesRef?.value || selectedIndex.value < 0) return
    
    nextTick(() => {
      const container = favoritesRef.value
      const items = container.querySelectorAll('.favorite-item')
      const selectedItem = items[selectedIndex.value]
      
      if (selectedItem && typeof selectedItem.scrollIntoView === 'function') {
        selectedItem.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        })
        
        // Add visual focus
        items.forEach(item => item.classList.remove('keyboard-focused'))
        selectedItem.classList.add('keyboard-focused')
        
        // Set ARIA attributes
        selectedItem.setAttribute('aria-selected', 'true')
        items.forEach((item, index) => {
          if (index !== selectedIndex.value) {
            item.setAttribute('aria-selected', 'false')
          }
        })
      }
    })
  }

  function announceSelection() {
    const favorite = selectedFavorite.value
    if (favorite) {
      announce(ACCESSIBILITY_ANNOUNCEMENTS.FAVORITE_SELECTED(favorite.name))
    }
  }

  function announce(message) {
    if (announceToScreenReader && typeof announceToScreenReader === 'function') {
      try {
        announceToScreenReader(message)
      } catch (error) {
        console.warn('Error in announceToScreenReader:', error)
        fallbackAnnounce(message)
      }
    } else {
      fallbackAnnounce(message)
    }
  }

  function fallbackAnnounce(message) {
    // Fallback: use aria-live region
    const liveRegion = document.querySelector('[aria-live="polite"]')
    if (liveRegion) {
      liveRegion.textContent = message
    } else {
      // Console fallback for testing
      console.log('Accessibility announcement:', message)
    }
  }

  // Public API
  function setFavorites(newFavorites) {
    favorites.value = newFavorites
    
    // Reset selection if it's out of bounds
    if (selectedIndex.value >= newFavorites.length) {
      selectedIndex.value = Math.max(0, newFavorites.length - 1)
    }
    
    announce(ACCESSIBILITY_ANNOUNCEMENTS.FAVORITES_LOADED(newFavorites.length))
  }

  function selectFavorite(index) {
    if (index >= 0 && index < filteredFavorites.value.length) {
      selectedIndex.value = index
      scrollToSelected()
      announceSelection()
    }
  }

  function selectFavoriteByPath(path) {
    const index = filteredFavorites.value.findIndex(fav => fav.path === path)
    if (index >= 0) {
      selectFavorite(index)
    }
  }

  function clearSelection() {
    selectedIndex.value = -1
    
    // Remove visual focus from all items
    if (favoritesRef?.value) {
      const items = favoritesRef.value.querySelectorAll('.favorite-item')
      items.forEach(item => {
        item.classList.remove('keyboard-focused')
        item.setAttribute('aria-selected', 'false')
      })
    }
  }

  function setActive(active) {
    isActive.value = active
    setShortcutsActive(active)
    
    if (!active) {
      clearSelection()
    }
  }

  function focusFavorites() {
    if (favoritesRef?.value) {
      const container = favoritesRef.value
      container.focus()
      setCurrentFocus(container)
      
      // Select first favorite if none selected
      if (selectedIndex.value < 0 && filteredFavorites.value.length > 0) {
        selectedIndex.value = 0
        scrollToSelected()
        announceSelection()
      }
    }
  }

  // Search functionality
  function updateSearchQuery(query) {
    searchQuery.value = query
    selectedIndex.value = 0 // Reset to first result
    
    if (filteredFavorites.value.length > 0) {
      scrollToSelected()
      announceSelection()
    }
  }

  function getShortcutHelp() {
    return FAVORITES_SHORTCUTS
  }

  // Lifecycle
  onMounted(() => {
    // Add CSS for keyboard focus styling
    if (typeof document !== 'undefined') {
      const style = document.createElement('style')
      style.textContent = `
        .favorite-item.keyboard-focused {
          outline: 2px solid var(--primary);
          outline-offset: 2px;
          background-color: var(--primary-focus);
          color: var(--primary-content);
        }
        
        .favorites-panel:focus-within .favorite-item.keyboard-focused {
          animation: focus-pulse 0.3s ease-out;
        }
        
        @keyframes focus-pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
      `
      document.head.appendChild(style)
    }
  })

  onUnmounted(() => {
    clearSelection()
  })

  return {
    // State
    isActive,
    selectedIndex,
    selectedFavorite,
    isSearchMode,
    searchQuery,
    filteredFavorites,
    
    // Navigation state
    canNavigateUp,
    canNavigateDown,
    
    // Methods
    setFavorites,
    selectFavorite,
    selectFavoriteByPath,
    clearSelection,
    setActive,
    focusFavorites,
    updateSearchQuery,
    getShortcutHelp,
    
    // Shortcut management
    addShortcut,
    removeShortcut,
    
    // Utility
    announce
  }
}

export default useFavoritesKeyboardShortcuts