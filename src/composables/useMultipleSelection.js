/**
 * @fileoverview Composable pour la gestion avancée de la sélection multiple
 */

import { ref, computed, watch } from 'vue'

/**
 * Composable pour la gestion de la sélection multiple
 * @param {Object} options - Options de configuration
 * @returns {Object} API du composable
 */
export function useMultipleSelection(options = {}) {
  const {
    files = ref([]),
    onSelectionChange = () => {},
    getFileId = (file) => file.path || file.name,
    allowMultipleSelection = true,
    allowRangeSelection = true
  } = options

  // État de sélection
  const selectedItems = ref([])
  const selectionAnchor = ref(-1)
  const lastSelectedIndex = ref(-1)
  const selectionMode = ref('single') // 'single', 'multiple', 'range'

  // Computed
  const selectedCount = computed(() => selectedItems.value.length)
  const hasSelection = computed(() => selectedItems.value.length > 0)
  const isAllSelected = computed(() => {
    return files.value.length > 0 && selectedItems.value.length === files.value.length
  })
  const isPartiallySelected = computed(() => {
    return selectedItems.value.length > 0 && selectedItems.value.length < files.value.length
  })

  // Utilitaires
  const getFileIndex = (fileId) => {
    return files.value.findIndex(file => getFileId(file) === fileId)
  }

  const getFileById = (fileId) => {
    return files.value.find(file => getFileId(file) === fileId)
  }

  const isSelected = (fileId) => {
    return selectedItems.value.includes(fileId)
  }

  // Actions de sélection
  const selectItem = (fileId, options = {}) => {
    const { 
      ctrlKey = false, 
      shiftKey = false, 
      replaceSelection = false,
      silent = false 
    } = options

    const fileIndex = getFileIndex(fileId)
    if (fileIndex === -1) return

    let newSelection = [...selectedItems.value]
    let action = 'select'

    if (shiftKey && allowRangeSelection && selectionAnchor.value >= 0) {
      // Sélection par plage
      action = 'rangeSelect'
      selectionMode.value = 'range'
      
      const startIndex = Math.min(selectionAnchor.value, fileIndex)
      const endIndex = Math.max(selectionAnchor.value, fileIndex)
      
      const rangeItems = []
      for (let i = startIndex; i <= endIndex; i++) {
        if (i < files.value.length) {
          rangeItems.push(getFileId(files.value[i]))
        }
      }
      
      if (replaceSelection) {
        newSelection = rangeItems
      } else {
        // Ajouter à la sélection existante
        newSelection = [...new Set([...selectedItems.value, ...rangeItems])]
      }
      
    } else if (ctrlKey && allowMultipleSelection) {
      // Sélection multiple (toggle)
      action = 'multiSelect'
      selectionMode.value = 'multiple'
      
      if (isSelected(fileId)) {
        newSelection = selectedItems.value.filter(id => id !== fileId)
        action = 'deselect'
      } else {
        newSelection = [...selectedItems.value, fileId]
        selectionAnchor.value = fileIndex
      }
      
    } else {
      // Sélection simple
      action = 'singleSelect'
      selectionMode.value = 'single'
      newSelection = [fileId]
      selectionAnchor.value = fileIndex
    }

    selectedItems.value = newSelection
    lastSelectedIndex.value = fileIndex

    if (!silent) {
      onSelectionChange({
        selectedItems: newSelection,
        selectedFiles: newSelection.map(id => getFileById(id)).filter(Boolean),
        action,
        targetFile: getFileById(fileId),
        targetIndex: fileIndex,
        anchorIndex: selectionAnchor.value,
        selectionMode: selectionMode.value
      })
    }
  }

  const selectAll = (silent = false) => {
    const allIds = files.value.map(file => getFileId(file))
    selectedItems.value = allIds
    selectionMode.value = 'multiple'
    
    if (!silent) {
      onSelectionChange({
        selectedItems: allIds,
        selectedFiles: files.value,
        action: 'selectAll',
        selectionMode: selectionMode.value
      })
    }
  }

  const clearSelection = (silent = false) => {
    selectedItems.value = []
    selectionAnchor.value = -1
    lastSelectedIndex.value = -1
    selectionMode.value = 'single'
    
    if (!silent) {
      onSelectionChange({
        selectedItems: [],
        selectedFiles: [],
        action: 'clearSelection',
        selectionMode: selectionMode.value
      })
    }
  }

  const invertSelection = (silent = false) => {
    const allIds = files.value.map(file => getFileId(file))
    const newSelection = allIds.filter(id => !isSelected(id))
    
    selectedItems.value = newSelection
    selectionMode.value = newSelection.length > 1 ? 'multiple' : 'single'
    
    if (!silent) {
      onSelectionChange({
        selectedItems: newSelection,
        selectedFiles: newSelection.map(id => getFileById(id)).filter(Boolean),
        action: 'invertSelection',
        selectionMode: selectionMode.value
      })
    }
  }

  const selectRange = (startIndex, endIndex, replaceSelection = true, silent = false) => {
    if (startIndex < 0 || endIndex < 0 || startIndex >= files.value.length || endIndex >= files.value.length) {
      return
    }

    const minIndex = Math.min(startIndex, endIndex)
    const maxIndex = Math.max(startIndex, endIndex)
    
    const rangeItems = []
    for (let i = minIndex; i <= maxIndex; i++) {
      rangeItems.push(getFileId(files.value[i]))
    }

    if (replaceSelection) {
      selectedItems.value = rangeItems
    } else {
      selectedItems.value = [...new Set([...selectedItems.value, ...rangeItems])]
    }

    selectionAnchor.value = startIndex
    lastSelectedIndex.value = endIndex
    selectionMode.value = 'range'

    if (!silent) {
      onSelectionChange({
        selectedItems: selectedItems.value,
        selectedFiles: selectedItems.value.map(id => getFileById(id)).filter(Boolean),
        action: 'rangeSelect',
        startIndex: minIndex,
        endIndex: maxIndex,
        selectionMode: selectionMode.value
      })
    }
  }

  const extendSelectionTo = (targetIndex, silent = false) => {
    if (targetIndex < 0 || targetIndex >= files.value.length) return

    // Établir l'ancre si elle n'existe pas
    if (selectionAnchor.value === -1) {
      if (lastSelectedIndex.value >= 0) {
        selectionAnchor.value = lastSelectedIndex.value
      } else {
        selectionAnchor.value = 0
      }
    }

    selectRange(selectionAnchor.value, targetIndex, true, silent)
  }

  const toggleItem = (fileId, silent = false) => {
    if (isSelected(fileId)) {
      const newSelection = selectedItems.value.filter(id => id !== fileId)
      selectedItems.value = newSelection
      
      if (!silent) {
        onSelectionChange({
          selectedItems: newSelection,
          selectedFiles: newSelection.map(id => getFileById(id)).filter(Boolean),
          action: 'deselect',
          targetFile: getFileById(fileId),
          selectionMode: selectionMode.value
        })
      }
    } else {
      selectItem(fileId, { ctrlKey: true, silent })
    }
  }

  // Méthodes de navigation avec sélection
  const selectNext = (extend = false) => {
    const currentIndex = lastSelectedIndex.value
    const nextIndex = currentIndex < files.value.length - 1 ? currentIndex + 1 : 0
    
    if (extend && allowRangeSelection) {
      extendSelectionTo(nextIndex)
    } else {
      const nextFileId = getFileId(files.value[nextIndex])
      selectItem(nextFileId)
    }
  }

  const selectPrevious = (extend = false) => {
    const currentIndex = lastSelectedIndex.value
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : files.value.length - 1
    
    if (extend && allowRangeSelection) {
      extendSelectionTo(prevIndex)
    } else {
      const prevFileId = getFileId(files.value[prevIndex])
      selectItem(prevFileId)
    }
  }

  const selectFirst = (extend = false) => {
    if (files.value.length === 0) return
    
    if (extend && allowRangeSelection) {
      extendSelectionTo(0)
    } else {
      const firstFileId = getFileId(files.value[0])
      selectItem(firstFileId)
    }
  }

  const selectLast = (extend = false) => {
    if (files.value.length === 0) return
    
    const lastIndex = files.value.length - 1
    if (extend && allowRangeSelection) {
      extendSelectionTo(lastIndex)
    } else {
      const lastFileId = getFileId(files.value[lastIndex])
      selectItem(lastFileId)
    }
  }

  // Watchers
  watch(files, (newFiles) => {
    // Nettoyer la sélection des éléments qui n'existent plus
    const validIds = newFiles.map(file => getFileId(file))
    const filteredSelection = selectedItems.value.filter(id => validIds.includes(id))
    
    if (filteredSelection.length !== selectedItems.value.length) {
      selectedItems.value = filteredSelection
      
      // Réajuster les indices
      if (selectionAnchor.value >= 0) {
        const anchorId = selectedItems.value[0]
        if (anchorId) {
          selectionAnchor.value = getFileIndex(anchorId)
        } else {
          selectionAnchor.value = -1
        }
      }
      
      if (lastSelectedIndex.value >= newFiles.length) {
        lastSelectedIndex.value = Math.max(0, newFiles.length - 1)
      }
    }
  }, { deep: true })

  return {
    // État
    selectedItems,
    selectedCount,
    hasSelection,
    isAllSelected,
    isPartiallySelected,
    selectionAnchor,
    lastSelectedIndex,
    selectionMode,

    // Méthodes de sélection
    selectItem,
    selectAll,
    clearSelection,
    invertSelection,
    selectRange,
    extendSelectionTo,
    toggleItem,

    // Navigation avec sélection
    selectNext,
    selectPrevious,
    selectFirst,
    selectLast,

    // Utilitaires
    isSelected,
    getFileIndex,
    getFileById
  }
}

export default useMultipleSelection