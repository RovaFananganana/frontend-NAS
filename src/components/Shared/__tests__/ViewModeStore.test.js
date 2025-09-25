/**
 * @fileoverview Tests unitaires pour le store de modes d'affichage (useViewMode)
 * Tests complets pour la persistance, mutations et gestion d'état
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { VIEW_MODES, SORT_DIRECTIONS, SORT_COLUMNS } from '../../../types/viewMode.js'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
global.localStorage = localStorageMock

// Mock console pour éviter les warnings dans les tests
const consoleMock = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}
global.console = { ...console, ...consoleMock }

describe('ViewModeStore (useViewMode)', () => {
  let useViewMode

  beforeEach(async () => {
    // Reset localStorage mock
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    localStorageMock.removeItem.mockClear()
    localStorageMock.clear.mockClear()
    
    // Reset console mocks
    consoleMock.log.mockClear()
    consoleMock.warn.mockClear()
    consoleMock.error.mockClear()
    
    // Reset localStorage to return null (no stored preferences)
    localStorageMock.getItem.mockReturnValue(null)
    
    // Reset modules to get fresh instance
    vi.resetModules()
    
    // Import fresh module
    const module = await import('../../../composables/useViewMode.js')
    useViewMode = module.useViewMode
  })

  describe('Initialisation', () => {
    it('should initialize with default values when no localStorage data', () => {
      const { currentMode, sortColumn, sortDirection, selectedFiles, columnVisibility } = useViewMode()
      
      expect(currentMode.value).toBe(VIEW_MODES.TREE)
      expect(sortColumn.value).toBe(SORT_COLUMNS.NAME)
      expect(sortDirection.value).toBe(SORT_DIRECTIONS.ASC)
      expect(selectedFiles.value).toEqual([])
      expect(columnVisibility.value).toEqual({
        name: true,
        size: true,
        type: true,
        modified: true
      })
    })

    it('should load preferences from localStorage when available', async () => {
      const storedPrefs = {
        currentMode: VIEW_MODES.DETAILED_LIST,
        sortColumn: SORT_COLUMNS.SIZE,
        sortDirection: SORT_DIRECTIONS.DESC,
        columnVisibility: {
          name: true,
          size: false,
          type: true,
          modified: true
        }
      }
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedPrefs))
      
      // Reset modules to force reload with new localStorage data
      vi.resetModules()
      const module = await import('../../../composables/useViewMode.js')
      const { currentMode, sortColumn, sortDirection, columnVisibility } = module.useViewMode()
      
      expect(currentMode.value).toBe(VIEW_MODES.DETAILED_LIST)
      expect(sortColumn.value).toBe(SORT_COLUMNS.SIZE)
      expect(sortDirection.value).toBe(SORT_DIRECTIONS.DESC)
      expect(columnVisibility.value.size).toBe(false)
    })

    it('should handle corrupted localStorage data gracefully', async () => {
      localStorageMock.getItem.mockReturnValue('invalid json')
      
      vi.resetModules()
      const module = await import('../../../composables/useViewMode.js')
      const { currentMode, sortColumn, sortDirection } = module.useViewMode()
      
      // Should fall back to defaults
      expect(currentMode.value).toBe(VIEW_MODES.TREE)
      expect(sortColumn.value).toBe(SORT_COLUMNS.NAME)
      expect(sortDirection.value).toBe(SORT_DIRECTIONS.ASC)
      expect(consoleMock.warn).toHaveBeenCalledWith(
        'Erreur lors du chargement des préférences de vue:',
        expect.any(Error)
      )
    })
  })

  describe('Persistance', () => {
    it('should save preferences to localStorage when state changes', async () => {
      const { setCurrentMode, setSortColumn } = useViewMode()
      
      setCurrentMode(VIEW_MODES.DETAILED_LIST)
      setSortColumn(SORT_COLUMNS.SIZE)
      
      // Wait for watcher to trigger
      await nextTick()
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'nas-view-mode-preferences',
        expect.stringContaining(VIEW_MODES.DETAILED_LIST)
      )
      
      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1])
      expect(savedData.currentMode).toBe(VIEW_MODES.DETAILED_LIST)
      expect(savedData.sortColumn).toBe(SORT_COLUMNS.SIZE)
    })

    it('should not persist selectedFiles (temporary state)', async () => {
      const { addSelectedFile } = useViewMode()
      
      addSelectedFile('/test/file.txt')
      
      await nextTick()
      
      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1])
      expect(savedData.selectedFiles).toBeUndefined()
    })

    it('should handle localStorage save errors gracefully', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })
      
      const { setCurrentMode } = useViewMode()
      setCurrentMode(VIEW_MODES.DETAILED_LIST)
      
      await nextTick()
      
      expect(consoleMock.warn).toHaveBeenCalledWith(
        'Erreur lors de la sauvegarde des préférences de vue:',
        expect.any(Error)
      )
    })
  })

  describe('Mutations - Mode d\'affichage', () => {
    it('should change current mode', () => {
      const { currentMode, setCurrentMode } = useViewMode()
      
      expect(currentMode.value).toBe(VIEW_MODES.TREE)
      
      setCurrentMode(VIEW_MODES.DETAILED_LIST)
      expect(currentMode.value).toBe(VIEW_MODES.DETAILED_LIST)
    })

    it('should log mode changes', () => {
      const { setCurrentMode } = useViewMode()
      
      setCurrentMode(VIEW_MODES.DETAILED_LIST)
      
      expect(consoleMock.log).toHaveBeenCalledWith(
        'Mode d\'affichage changé vers: Liste détaillée'
      )
    })

    it('should warn for invalid mode', () => {
      const { currentMode, setCurrentMode } = useViewMode()
      
      const originalMode = currentMode.value
      setCurrentMode('invalid-mode')
      
      expect(currentMode.value).toBe(originalMode) // Should not change
      expect(consoleMock.warn).toHaveBeenCalledWith(
        'Mode d\'affichage inconnu: invalid-mode'
      )
    })

    it('should provide mode utility functions', () => {
      const { isTreeMode, isDetailedListMode, setCurrentMode } = useViewMode()
      
      expect(isTreeMode.value).toBe(true)
      expect(isDetailedListMode.value).toBe(false)
      
      setCurrentMode(VIEW_MODES.DETAILED_LIST)
      
      expect(isTreeMode.value).toBe(false)
      expect(isDetailedListMode.value).toBe(true)
    })
  })

  describe('Mutations - Tri', () => {
    it('should change sort column and reset direction to ASC', () => {
      const { sortColumn, sortDirection, setSortColumn } = useViewMode()
      
      setSortColumn(SORT_COLUMNS.SIZE)
      
      expect(sortColumn.value).toBe(SORT_COLUMNS.SIZE)
      expect(sortDirection.value).toBe(SORT_DIRECTIONS.ASC)
    })

    it('should toggle sort direction when clicking same column', () => {
      const { sortColumn, sortDirection, setSortColumn } = useViewMode()
      
      // First click - set column
      setSortColumn(SORT_COLUMNS.SIZE)
      expect(sortColumn.value).toBe(SORT_COLUMNS.SIZE)
      expect(sortDirection.value).toBe(SORT_DIRECTIONS.ASC)
      
      // Second click - toggle direction
      setSortColumn(SORT_COLUMNS.SIZE)
      expect(sortColumn.value).toBe(SORT_COLUMNS.SIZE)
      expect(sortDirection.value).toBe(SORT_DIRECTIONS.DESC)
      
      // Third click - toggle back
      setSortColumn(SORT_COLUMNS.SIZE)
      expect(sortDirection.value).toBe(SORT_DIRECTIONS.ASC)
    })

    it('should log sort changes', () => {
      const { setSortColumn } = useViewMode()
      
      setSortColumn(SORT_COLUMNS.SIZE)
      
      expect(consoleMock.log).toHaveBeenCalledWith(
        expect.stringContaining('Tri changé: size asc')
      )
    })

    it('should set sort direction directly', () => {
      const { sortDirection, setSortDirection } = useViewMode()
      
      setSortDirection(SORT_DIRECTIONS.DESC)
      expect(sortDirection.value).toBe(SORT_DIRECTIONS.DESC)
    })

    it('should ignore invalid sort directions', () => {
      const { sortDirection, setSortDirection } = useViewMode()
      
      const originalDirection = sortDirection.value
      setSortDirection('invalid')
      
      expect(sortDirection.value).toBe(originalDirection)
    })
  })

  describe('Mutations - Sélection de fichiers', () => {
    it('should manage single file selection', () => {
      const { selectedFiles, addSelectedFile, removeSelectedFile, isSelected } = useViewMode()
      
      expect(selectedFiles.value).toEqual([])
      expect(isSelected('/test/file.txt')).toBe(false)
      
      addSelectedFile('/test/file.txt')
      expect(selectedFiles.value).toEqual(['/test/file.txt'])
      expect(isSelected('/test/file.txt')).toBe(true)
      
      removeSelectedFile('/test/file.txt')
      expect(selectedFiles.value).toEqual([])
      expect(isSelected('/test/file.txt')).toBe(false)
    })

    it('should prevent duplicate selections', () => {
      const { selectedFiles, addSelectedFile } = useViewMode()
      
      addSelectedFile('/test/file.txt')
      addSelectedFile('/test/file.txt')
      
      expect(selectedFiles.value).toEqual(['/test/file.txt'])
    })

    it('should toggle file selection', () => {
      const { selectedFiles, toggleSelectedFile } = useViewMode()
      
      toggleSelectedFile('/test/file.txt')
      expect(selectedFiles.value).toEqual(['/test/file.txt'])
      
      toggleSelectedFile('/test/file.txt')
      expect(selectedFiles.value).toEqual([])
    })

    it('should clear all selections', () => {
      const { selectedFiles, addSelectedFile, clearSelection } = useViewMode()
      
      addSelectedFile('/test/file1.txt')
      addSelectedFile('/test/file2.txt')
      expect(selectedFiles.value).toHaveLength(2)
      
      clearSelection()
      expect(selectedFiles.value).toEqual([])
    })

    it('should select all files', () => {
      const { selectedFiles, selectAll } = useViewMode()
      
      const files = [
        { path: '/test/file1.txt', name: 'file1.txt' },
        { path: '/test/file2.txt', name: 'file2.txt' },
        { name: 'file3.txt' } // No path, should use name
      ]
      
      selectAll(files)
      expect(selectedFiles.value).toEqual([
        '/test/file1.txt',
        '/test/file2.txt',
        'file3.txt'
      ])
    })

    it('should get selected count', () => {
      const { addSelectedFile, getSelectedCount } = useViewMode()
      
      expect(getSelectedCount()).toBe(0)
      
      addSelectedFile('/test/file1.txt')
      addSelectedFile('/test/file2.txt')
      
      expect(getSelectedCount()).toBe(2)
    })
  })

  describe('Mutations - Sélection multiple avancée', () => {
    const mockFiles = [
      { path: '/test/file1.txt', name: 'file1.txt' },
      { path: '/test/file2.txt', name: 'file2.txt' },
      { path: '/test/file3.txt', name: 'file3.txt' },
      { path: '/test/file4.txt', name: 'file4.txt' }
    ]

    it('should select range of files', () => {
      const { selectedFiles, selectRange } = useViewMode()
      
      selectRange(mockFiles, 1, 3)
      
      expect(selectedFiles.value).toEqual([
        '/test/file2.txt',
        '/test/file3.txt',
        '/test/file4.txt'
      ])
    })

    it('should handle reverse range selection', () => {
      const { selectedFiles, selectRange } = useViewMode()
      
      selectRange(mockFiles, 3, 1)
      
      expect(selectedFiles.value).toEqual([
        '/test/file2.txt',
        '/test/file3.txt',
        '/test/file4.txt'
      ])
    })

    it('should merge range with existing selection', () => {
      const { selectedFiles, addSelectedFile, selectRange } = useViewMode()
      
      addSelectedFile('/test/file1.txt')
      selectRange(mockFiles, 2, 3)
      
      expect(selectedFiles.value).toEqual([
        '/test/file1.txt',
        '/test/file3.txt',
        '/test/file4.txt'
      ])
    })

    it('should replace selection with range', () => {
      const { selectedFiles, addSelectedFile, selectRangeReplace } = useViewMode()
      
      addSelectedFile('/test/file1.txt')
      selectRangeReplace(mockFiles, 2, 3)
      
      expect(selectedFiles.value).toEqual([
        '/test/file3.txt',
        '/test/file4.txt'
      ])
    })

    it('should handle multiple selection with modifiers', () => {
      const { selectedFiles, handleMultipleSelection } = useViewMode()
      
      // Single selection
      handleMultipleSelection('/test/file1.txt', mockFiles, {
        currentIndex: 0,
        lastSelectedIndex: -1
      })
      expect(selectedFiles.value).toEqual(['/test/file1.txt'])
      
      // Ctrl+Click - toggle
      handleMultipleSelection('/test/file2.txt', mockFiles, {
        ctrlKey: true,
        currentIndex: 1,
        lastSelectedIndex: 0
      })
      expect(selectedFiles.value).toEqual(['/test/file1.txt', '/test/file2.txt'])
      
      // Shift+Click - range
      handleMultipleSelection('/test/file4.txt', mockFiles, {
        shiftKey: true,
        currentIndex: 3,
        lastSelectedIndex: 1
      })
      expect(selectedFiles.value).toEqual([
        '/test/file2.txt',
        '/test/file3.txt',
        '/test/file4.txt'
      ])
    })
  })

  describe('Mutations - Visibilité des colonnes', () => {
    it('should set column visibility', () => {
      const { columnVisibility, setColumnVisibility } = useViewMode()
      
      setColumnVisibility('size', false)
      expect(columnVisibility.value.size).toBe(false)
      
      setColumnVisibility('size', true)
      expect(columnVisibility.value.size).toBe(true)
    })

    it('should toggle column visibility', () => {
      const { columnVisibility, toggleColumnVisibility } = useViewMode()
      
      const originalVisibility = columnVisibility.value.size
      
      toggleColumnVisibility('size')
      expect(columnVisibility.value.size).toBe(!originalVisibility)
      
      toggleColumnVisibility('size')
      expect(columnVisibility.value.size).toBe(originalVisibility)
    })

    it('should provide visible columns computed', () => {
      const { visibleColumns, setColumnVisibility } = useViewMode()
      
      expect(visibleColumns.value).toHaveLength(4) // All visible by default
      
      setColumnVisibility('size', false)
      expect(visibleColumns.value).toHaveLength(3)
      
      setColumnVisibility('type', false)
      expect(visibleColumns.value).toHaveLength(2)
    })
  })

  describe('Tri des fichiers', () => {
    const mockFiles = [
      { name: 'zebra.txt', size: 100, is_directory: false, modified_time: '2023-01-01T10:00:00Z' },
      { name: 'alpha.txt', size: 200, is_directory: false, modified_time: '2023-01-02T10:00:00Z' },
      { name: 'beta', size: 0, is_directory: true, modified_time: '2023-01-03T10:00:00Z' }
    ]

    it('should sort files by name (default)', () => {
      const { sortFiles } = useViewMode()
      
      const sorted = sortFiles(mockFiles)
      
      // Directories first, then alphabetical
      expect(sorted[0].name).toBe('beta')
      expect(sorted[1].name).toBe('alpha.txt')
      expect(sorted[2].name).toBe('zebra.txt')
    })

    it('should sort files by size', () => {
      const { sortFiles, setSortColumn } = useViewMode()
      
      setSortColumn(SORT_COLUMNS.SIZE)
      const sorted = sortFiles(mockFiles)
      
      // Directories first, then by size
      expect(sorted[0].name).toBe('beta') // Directory
      expect(sorted[1].name).toBe('zebra.txt') // 100
      expect(sorted[2].name).toBe('alpha.txt') // 200
    })

    it('should sort files by type', () => {
      const { sortFiles, setSortColumn } = useViewMode()
      
      setSortColumn(SORT_COLUMNS.TYPE)
      const sorted = sortFiles(mockFiles)
      
      expect(sorted[0].name).toBe('beta') // Directory first
    })

    it('should sort files by date', () => {
      const { sortFiles, setSortColumn } = useViewMode()
      
      setSortColumn(SORT_COLUMNS.MODIFIED)
      const sorted = sortFiles(mockFiles)
      
      // Directories first, then by date
      expect(sorted[0].name).toBe('beta') // Directory
      expect(sorted[1].name).toBe('zebra.txt') // 2023-01-01
      expect(sorted[2].name).toBe('alpha.txt') // 2023-01-02
    })

    it('should respect sort direction', () => {
      const { sortFiles, setSortColumn } = useViewMode()
      
      setSortColumn(SORT_COLUMNS.SIZE)
      setSortColumn(SORT_COLUMNS.SIZE) // Toggle to DESC
      
      const sorted = sortFiles(mockFiles)
      
      // Directories first, then by size DESC
      expect(sorted[0].name).toBe('beta') // Directory
      expect(sorted[1].name).toBe('alpha.txt') // 200
      expect(sorted[2].name).toBe('zebra.txt') // 100
    })

    it('should handle empty file array', () => {
      const { sortFiles } = useViewMode()
      
      expect(sortFiles([])).toEqual([])
      expect(sortFiles(null)).toEqual([])
      expect(sortFiles(undefined)).toEqual([])
    })
  })

  describe('Raccourcis clavier pour le tri', () => {
    it('should provide sort shortcut functions', () => {
      const { sortColumn, sortByName, sortBySize, sortByType, sortByDate } = useViewMode()
      
      sortByName()
      expect(sortColumn.value).toBe(SORT_COLUMNS.NAME)
      
      sortBySize()
      expect(sortColumn.value).toBe(SORT_COLUMNS.SIZE)
      
      sortByType()
      expect(sortColumn.value).toBe(SORT_COLUMNS.TYPE)
      
      sortByDate()
      expect(sortColumn.value).toBe(SORT_COLUMNS.MODIFIED)
    })
  })

  describe('État global partagé', () => {
    it('should share state between multiple instances', () => {
      const instance1 = useViewMode()
      const instance2 = useViewMode()
      
      instance1.setCurrentMode(VIEW_MODES.DETAILED_LIST)
      
      expect(instance2.currentMode.value).toBe(VIEW_MODES.DETAILED_LIST)
    })

    it('should maintain state consistency across instances', () => {
      const instance1 = useViewMode()
      const instance2 = useViewMode()
      
      instance1.addSelectedFile('/test/file1.txt')
      instance2.addSelectedFile('/test/file2.txt')
      
      expect(instance1.selectedFiles.value).toEqual(['/test/file1.txt', '/test/file2.txt'])
      expect(instance2.selectedFiles.value).toEqual(['/test/file1.txt', '/test/file2.txt'])
    })
  })
})