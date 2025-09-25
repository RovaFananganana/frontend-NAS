/**
 * @fileoverview Tests unitaires pour le composable useViewMode
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useViewMode } from '../useViewMode.js'
import { VIEW_MODES, SORT_DIRECTIONS, SORT_COLUMNS } from '../../types/viewMode.js'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
global.localStorage = localStorageMock

describe('useViewMode', () => {
  beforeEach(() => {
    // Reset localStorage mock
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    
    // Reset localStorage to return null (no stored preferences)
    localStorageMock.getItem.mockReturnValue(null)
  })

  it('should initialize with default values', () => {
    const { currentMode, sortColumn, sortDirection, selectedFiles } = useViewMode()
    
    expect(currentMode.value).toBe(VIEW_MODES.TREE)
    expect(sortColumn.value).toBe(SORT_COLUMNS.NAME)
    expect(sortDirection.value).toBe(SORT_DIRECTIONS.ASC)
    expect(selectedFiles.value).toEqual([])
  })

  it('should load preferences from localStorage', () => {
    // Reset global state first
    const { useViewMode } = require('../useViewMode.js')
    
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
    
    // Force reload by clearing module cache
    vi.resetModules()
    const { useViewMode: freshUseViewMode } = await import('../useViewMode.js')
    
    const { currentMode, sortColumn, sortDirection, columnVisibility } = freshUseViewMode()
    
    expect(currentMode.value).toBe(VIEW_MODES.DETAILED_LIST)
    expect(sortColumn.value).toBe(SORT_COLUMNS.SIZE)
    expect(sortDirection.value).toBe(SORT_DIRECTIONS.DESC)
    expect(columnVisibility.value.size).toBe(false)
  })

  it('should change current mode', () => {
    const { currentMode, setCurrentMode } = useViewMode()
    
    expect(currentMode.value).toBe(VIEW_MODES.TREE)
    
    setCurrentMode(VIEW_MODES.DETAILED_LIST)
    expect(currentMode.value).toBe(VIEW_MODES.DETAILED_LIST)
  })

  it('should handle sort column changes', () => {
    const { sortColumn, sortDirection, setSortColumn } = useViewMode()
    
    // Initial state
    expect(sortColumn.value).toBe(SORT_COLUMNS.NAME)
    expect(sortDirection.value).toBe(SORT_DIRECTIONS.ASC)
    
    // Change to different column
    setSortColumn(SORT_COLUMNS.SIZE)
    expect(sortColumn.value).toBe(SORT_COLUMNS.SIZE)
    expect(sortDirection.value).toBe(SORT_DIRECTIONS.ASC)
    
    // Click same column again - should reverse direction
    setSortColumn(SORT_COLUMNS.SIZE)
    expect(sortColumn.value).toBe(SORT_COLUMNS.SIZE)
    expect(sortDirection.value).toBe(SORT_DIRECTIONS.DESC)
  })

  it('should manage file selection', () => {
    const { selectedFiles, addSelectedFile, removeSelectedFile, toggleSelectedFile, clearSelection } = useViewMode()
    
    // Initially empty
    expect(selectedFiles.value).toEqual([])
    
    // Add files
    addSelectedFile('/path/to/file1.txt')
    addSelectedFile('/path/to/file2.txt')
    expect(selectedFiles.value).toEqual(['/path/to/file1.txt', '/path/to/file2.txt'])
    
    // Remove file
    removeSelectedFile('/path/to/file1.txt')
    expect(selectedFiles.value).toEqual(['/path/to/file2.txt'])
    
    // Toggle file (add)
    toggleSelectedFile('/path/to/file3.txt')
    expect(selectedFiles.value).toEqual(['/path/to/file2.txt', '/path/to/file3.txt'])
    
    // Toggle file (remove)
    toggleSelectedFile('/path/to/file2.txt')
    expect(selectedFiles.value).toEqual(['/path/to/file3.txt'])
    
    // Clear all
    clearSelection()
    expect(selectedFiles.value).toEqual([])
  })

  it('should sort files correctly', () => {
    const { sortFiles, setSortColumn } = useViewMode()
    
    const testFiles = [
      { name: 'zebra.txt', size: 100, is_directory: false, modified_time: '2023-01-01' },
      { name: 'alpha.txt', size: 200, is_directory: false, modified_time: '2023-01-02' },
      { name: 'beta', size: 0, is_directory: true, modified_time: '2023-01-03' }
    ]
    
    // Sort by name (default)
    let sorted = sortFiles(testFiles)
    expect(sorted[0].name).toBe('beta') // Directories first
    expect(sorted[1].name).toBe('alpha.txt')
    expect(sorted[2].name).toBe('zebra.txt')
    
    // Sort by size
    setSortColumn(SORT_COLUMNS.SIZE)
    sorted = sortFiles(testFiles)
    expect(sorted[0].name).toBe('beta') // Directories still first
    expect(sorted[1].name).toBe('zebra.txt') // Smaller size
    expect(sorted[2].name).toBe('alpha.txt') // Larger size
  })

  it('should provide utility functions', () => {
    // Reset to ensure clean state
    localStorageMock.getItem.mockReturnValue(null)
    vi.resetModules()
    
    const { useViewMode } = require('../useViewMode.js')
    const { isSelected, getSelectedCount, addSelectedFile, isTreeMode, isDetailedListMode, setCurrentMode } = useViewMode()
    
    // Selection utilities
    expect(isSelected('/path/to/file.txt')).toBe(false)
    expect(getSelectedCount()).toBe(0)
    
    addSelectedFile('/path/to/file.txt')
    expect(isSelected('/path/to/file.txt')).toBe(true)
    expect(getSelectedCount()).toBe(1)
    
    // Mode utilities - should start with tree mode
    expect(isTreeMode.value).toBe(true)
    expect(isDetailedListMode.value).toBe(false)
    
    setCurrentMode(VIEW_MODES.DETAILED_LIST)
    expect(isTreeMode.value).toBe(false)
    expect(isDetailedListMode.value).toBe(true)
  })

  it('should handle column visibility', () => {
    const { columnVisibility, setColumnVisibility, toggleColumnVisibility, visibleColumns } = useViewMode()
    
    // All columns visible by default
    expect(columnVisibility.value.name).toBe(true)
    expect(columnVisibility.value.size).toBe(true)
    expect(visibleColumns.value).toHaveLength(4)
    
    // Hide a column
    setColumnVisibility('size', false)
    expect(columnVisibility.value.size).toBe(false)
    expect(visibleColumns.value).toHaveLength(3)
    
    // Toggle column
    toggleColumnVisibility('size')
    expect(columnVisibility.value.size).toBe(true)
    expect(visibleColumns.value).toHaveLength(4)
  })

  it('should save preferences to localStorage', async () => {
    const { setCurrentMode, setSortColumn } = useViewMode()
    
    // Make changes
    setCurrentMode(VIEW_MODES.DETAILED_LIST)
    setSortColumn(SORT_COLUMNS.SIZE)
    
    // Wait for watcher to trigger (in real Vue app)
    await new Promise(resolve => setTimeout(resolve, 0))
    
    // Should have called localStorage.setItem
    expect(localStorageMock.setItem).toHaveBeenCalled()
    
    const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1])
    expect(savedData.currentMode).toBe(VIEW_MODES.DETAILED_LIST)
    expect(savedData.sortColumn).toBe(SORT_COLUMNS.SIZE)
  })
})