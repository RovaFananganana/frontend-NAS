/**
 * @fileoverview Tests pour le composable useMultipleSelection
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { useMultipleSelection } from '../useMultipleSelection.js'

describe('useMultipleSelection', () => {
  let files
  let onSelectionChange
  let multipleSelection

  const testFiles = [
    { name: 'file1.txt', path: '/test/file1.txt', is_directory: false },
    { name: 'file2.txt', path: '/test/file2.txt', is_directory: false },
    { name: 'folder1', path: '/test/folder1', is_directory: true },
    { name: 'file3.txt', path: '/test/file3.txt', is_directory: false },
    { name: 'file4.txt', path: '/test/file4.txt', is_directory: false }
  ]

  beforeEach(() => {
    files = ref([...testFiles])
    onSelectionChange = vi.fn()
    
    multipleSelection = useMultipleSelection({
      files,
      onSelectionChange,
      getFileId: (file) => file.path
    })
  })

  describe('initialization', () => {
    it('should initialize with empty selection', () => {
      expect(multipleSelection.selectedItems.value).toEqual([])
      expect(multipleSelection.selectedCount.value).toBe(0)
      expect(multipleSelection.hasSelection.value).toBe(false)
      expect(multipleSelection.isAllSelected.value).toBe(false)
      expect(multipleSelection.isPartiallySelected.value).toBe(false)
    })

    it('should initialize with correct selection anchor', () => {
      expect(multipleSelection.selectionAnchor.value).toBe(-1)
      expect(multipleSelection.lastSelectedIndex.value).toBe(-1)
      expect(multipleSelection.selectionMode.value).toBe('single')
    })
  })

  describe('single selection', () => {
    it('should select a single item', () => {
      const fileId = testFiles[0].path
      
      multipleSelection.selectItem(fileId)
      
      expect(multipleSelection.selectedItems.value).toEqual([fileId])
      expect(multipleSelection.selectedCount.value).toBe(1)
      expect(multipleSelection.hasSelection.value).toBe(true)
      expect(multipleSelection.isSelected(fileId)).toBe(true)
      expect(multipleSelection.selectionMode.value).toBe('single')
      
      expect(onSelectionChange).toHaveBeenCalledWith({
        selectedItems: [fileId],
        selectedFiles: [testFiles[0]],
        action: 'singleSelect',
        targetFile: testFiles[0],
        targetIndex: 0,
        anchorIndex: 0,
        selectionMode: 'single'
      })
    })

    it('should replace selection when selecting another item', () => {
      const firstFileId = testFiles[0].path
      const secondFileId = testFiles[1].path
      
      multipleSelection.selectItem(firstFileId)
      multipleSelection.selectItem(secondFileId)
      
      expect(multipleSelection.selectedItems.value).toEqual([secondFileId])
      expect(multipleSelection.selectedCount.value).toBe(1)
      expect(multipleSelection.isSelected(firstFileId)).toBe(false)
      expect(multipleSelection.isSelected(secondFileId)).toBe(true)
    })
  })

  describe('multiple selection', () => {
    it('should add items with Ctrl+Click', () => {
      const firstFileId = testFiles[0].path
      const secondFileId = testFiles[1].path
      
      multipleSelection.selectItem(firstFileId, { ctrlKey: true })
      multipleSelection.selectItem(secondFileId, { ctrlKey: true })
      
      expect(multipleSelection.selectedItems.value).toEqual([firstFileId, secondFileId])
      expect(multipleSelection.selectedCount.value).toBe(2)
      expect(multipleSelection.selectionMode.value).toBe('multiple')
      expect(multipleSelection.isPartiallySelected.value).toBe(true)
    })

    it('should toggle items with Ctrl+Click', () => {
      const fileId = testFiles[0].path
      
      // Select
      multipleSelection.selectItem(fileId, { ctrlKey: true })
      expect(multipleSelection.isSelected(fileId)).toBe(true)
      
      // Deselect
      multipleSelection.selectItem(fileId, { ctrlKey: true })
      expect(multipleSelection.isSelected(fileId)).toBe(false)
      expect(multipleSelection.selectedCount.value).toBe(0)
    })

    it('should handle toggle method', () => {
      const fileId = testFiles[0].path
      
      // Toggle on
      multipleSelection.toggleItem(fileId)
      expect(multipleSelection.isSelected(fileId)).toBe(true)
      
      // Toggle off
      multipleSelection.toggleItem(fileId)
      expect(multipleSelection.isSelected(fileId)).toBe(false)
    })
  })

  describe('range selection', () => {
    it('should select range with Shift+Click', () => {
      const startFileId = testFiles[1].path
      const endFileId = testFiles[3].path
      
      // First select an anchor
      multipleSelection.selectItem(startFileId)
      
      // Then select range
      multipleSelection.selectItem(endFileId, { shiftKey: true })
      
      const expectedSelection = [
        testFiles[1].path,
        testFiles[2].path,
        testFiles[3].path
      ]
      
      expect(multipleSelection.selectedItems.value).toEqual(expectedSelection)
      expect(multipleSelection.selectedCount.value).toBe(3)
      expect(multipleSelection.selectionMode.value).toBe('range')
    })

    it('should select range using selectRange method', () => {
      multipleSelection.selectRange(1, 3)
      
      const expectedSelection = [
        testFiles[1].path,
        testFiles[2].path,
        testFiles[3].path
      ]
      
      expect(multipleSelection.selectedItems.value).toEqual(expectedSelection)
      expect(multipleSelection.selectedCount.value).toBe(3)
      expect(multipleSelection.selectionMode.value).toBe('range')
    })

    it('should extend selection to target index', () => {
      // Set initial selection
      multipleSelection.selectItem(testFiles[1].path)
      
      // Extend to index 3
      multipleSelection.extendSelectionTo(3)
      
      const expectedSelection = [
        testFiles[1].path,
        testFiles[2].path,
        testFiles[3].path
      ]
      
      expect(multipleSelection.selectedItems.value).toEqual(expectedSelection)
    })
  })

  describe('select all and clear', () => {
    it('should select all items', () => {
      multipleSelection.selectAll()
      
      const allPaths = testFiles.map(f => f.path)
      expect(multipleSelection.selectedItems.value).toEqual(allPaths)
      expect(multipleSelection.selectedCount.value).toBe(testFiles.length)
      expect(multipleSelection.isAllSelected.value).toBe(true)
      expect(multipleSelection.selectionMode.value).toBe('multiple')
      
      expect(onSelectionChange).toHaveBeenCalledWith({
        selectedItems: allPaths,
        selectedFiles: testFiles,
        action: 'selectAll',
        selectionMode: 'multiple'
      })
    })

    it('should clear all selection', () => {
      // First select some items
      multipleSelection.selectAll()
      expect(multipleSelection.selectedCount.value).toBe(testFiles.length)
      
      // Then clear
      multipleSelection.clearSelection()
      
      expect(multipleSelection.selectedItems.value).toEqual([])
      expect(multipleSelection.selectedCount.value).toBe(0)
      expect(multipleSelection.hasSelection.value).toBe(false)
      expect(multipleSelection.selectionAnchor.value).toBe(-1)
      expect(multipleSelection.selectionMode.value).toBe('single')
    })

    it('should invert selection', () => {
      // Select first two items
      multipleSelection.selectItem(testFiles[0].path, { ctrlKey: true })
      multipleSelection.selectItem(testFiles[1].path, { ctrlKey: true })
      
      // Invert selection
      multipleSelection.invertSelection()
      
      const expectedSelection = [
        testFiles[2].path,
        testFiles[3].path,
        testFiles[4].path
      ]
      
      expect(multipleSelection.selectedItems.value).toEqual(expectedSelection)
      expect(multipleSelection.selectedCount.value).toBe(3)
    })
  })

  describe('navigation with selection', () => {
    beforeEach(() => {
      // Start with first item selected
      multipleSelection.selectItem(testFiles[1].path)
    })

    it('should select next item', () => {
      multipleSelection.selectNext()
      
      expect(multipleSelection.selectedItems.value).toEqual([testFiles[2].path])
      expect(multipleSelection.lastSelectedIndex.value).toBe(2)
    })

    it('should select previous item', () => {
      multipleSelection.selectPrevious()
      
      expect(multipleSelection.selectedItems.value).toEqual([testFiles[0].path])
      expect(multipleSelection.lastSelectedIndex.value).toBe(0)
    })

    it('should extend selection with navigation', () => {
      multipleSelection.selectNext(true) // extend = true
      
      const expectedSelection = [
        testFiles[1].path,
        testFiles[2].path
      ]
      
      expect(multipleSelection.selectedItems.value).toEqual(expectedSelection)
    })

    it('should select first item', () => {
      multipleSelection.selectFirst()
      
      expect(multipleSelection.selectedItems.value).toEqual([testFiles[0].path])
      expect(multipleSelection.lastSelectedIndex.value).toBe(0)
    })

    it('should select last item', () => {
      multipleSelection.selectLast()
      
      expect(multipleSelection.selectedItems.value).toEqual([testFiles[4].path])
      expect(multipleSelection.lastSelectedIndex.value).toBe(4)
    })
  })

  describe('utility functions', () => {
    it('should get file index correctly', () => {
      const fileId = testFiles[2].path
      const index = multipleSelection.getFileIndex(fileId)
      
      expect(index).toBe(2)
    })

    it('should get file by ID correctly', () => {
      const fileId = testFiles[2].path
      const file = multipleSelection.getFileById(fileId)
      
      expect(file).toEqual(testFiles[2])
    })

    it('should handle non-existent files', () => {
      const nonExistentId = '/non/existent/file.txt'
      
      expect(multipleSelection.getFileIndex(nonExistentId)).toBe(-1)
      expect(multipleSelection.getFileById(nonExistentId)).toBeUndefined()
      expect(multipleSelection.isSelected(nonExistentId)).toBe(false)
    })
  })

  describe('file list changes', () => {
    it('should clean up selection when files change', async () => {
      // Select some files
      multipleSelection.selectItem(testFiles[0].path, { ctrlKey: true })
      multipleSelection.selectItem(testFiles[1].path, { ctrlKey: true })
      multipleSelection.selectItem(testFiles[2].path, { ctrlKey: true })
      
      expect(multipleSelection.selectedCount.value).toBe(3)
      
      // Remove some files
      files.value = [testFiles[0], testFiles[2]] // Remove testFiles[1]
      
      // Wait for watcher to trigger
      await new Promise(resolve => setTimeout(resolve, 0))
      
      // Selection should be cleaned up
      expect(multipleSelection.selectedCount.value).toBe(2)
      expect(multipleSelection.selectedItems.value).toEqual([
        testFiles[0].path,
        testFiles[2].path
      ])
    })
  })

  describe('options and configuration', () => {
    it('should respect allowMultipleSelection option', () => {
      const restrictedSelection = useMultipleSelection({
        files,
        onSelectionChange,
        allowMultipleSelection: false
      })
      
      const firstFileId = testFiles[0].path
      const secondFileId = testFiles[1].path
      
      restrictedSelection.selectItem(firstFileId, { ctrlKey: true })
      restrictedSelection.selectItem(secondFileId, { ctrlKey: true })
      
      // Should only have the last selected item
      expect(restrictedSelection.selectedItems.value).toEqual([secondFileId])
      expect(restrictedSelection.selectedCount.value).toBe(1)
    })

    it('should respect allowRangeSelection option', () => {
      const restrictedSelection = useMultipleSelection({
        files,
        onSelectionChange,
        allowRangeSelection: false
      })
      
      restrictedSelection.selectItem(testFiles[1].path)
      restrictedSelection.selectItem(testFiles[3].path, { shiftKey: true })
      
      // Should only have the last selected item (no range)
      expect(restrictedSelection.selectedItems.value).toEqual([testFiles[3].path])
      expect(restrictedSelection.selectedCount.value).toBe(1)
    })

    it('should use custom getFileId function', () => {
      const customSelection = useMultipleSelection({
        files,
        onSelectionChange,
        getFileId: (file) => file.name // Use name instead of path
      })
      
      customSelection.selectItem(testFiles[0].name)
      
      expect(customSelection.selectedItems.value).toEqual([testFiles[0].name])
      expect(customSelection.isSelected(testFiles[0].name)).toBe(true)
    })
  })

  describe('silent operations', () => {
    it('should not trigger callback when silent is true', () => {
      multipleSelection.selectItem(testFiles[0].path, { silent: true })
      
      expect(multipleSelection.selectedCount.value).toBe(1)
      expect(onSelectionChange).not.toHaveBeenCalled()
    })

    it('should not trigger callback for silent selectAll', () => {
      multipleSelection.selectAll(true)
      
      expect(multipleSelection.selectedCount.value).toBe(testFiles.length)
      expect(onSelectionChange).not.toHaveBeenCalled()
    })

    it('should not trigger callback for silent clearSelection', () => {
      multipleSelection.selectAll()
      onSelectionChange.mockClear()
      
      multipleSelection.clearSelection(true)
      
      expect(multipleSelection.selectedCount.value).toBe(0)
      expect(onSelectionChange).not.toHaveBeenCalled()
    })
  })
})