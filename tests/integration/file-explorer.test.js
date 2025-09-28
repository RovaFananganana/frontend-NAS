// tests/integration/file-explorer.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import FileExplorer from '@/components/Shared/FileExplorer.vue'

// Mock the NAS API
vi.mock('@/services/nasAPI.js', () => ({
  nasAPI: {
    browse: vi.fn(),
    downloadFile: vi.fn(),
    normalizePath: vi.fn((path) => path.replace(/\/+/g, '/').replace(/\/$/, '') || '/')
  }
}))

// Mock favorites service
vi.mock('@/services/favoritesService.js', () => ({
  favoritesService: {
    isFavorite: vi.fn(() => false),
    addFavorite: vi.fn(() => true),
    removeFavorite: vi.fn(() => true)
  }
}))

// Mock all child components to focus on integration behavior
vi.mock('@/components/Shared/ViewModeSelector.vue', () => ({
  default: {
    name: 'ViewModeSelector',
    template: '<div data-testid="view-mode-selector"><button @click="$emit(\'mode-changed\', { newMode: \'grid\', oldMode: \'tree\' })">Grid</button></div>',
    emits: ['mode-changed']
  }
}))

vi.mock('@/components/Shared/BreadcrumbNavigation.vue', () => ({
  default: {
    name: 'BreadcrumbNavigation',
    template: '<div data-testid="breadcrumb-nav"><button @click="$emit(\'navigate\', \'/test\')">Test</button></div>',
    props: ['currentPath'],
    emits: ['navigate']
  }
}))

vi.mock('@/components/Shared/TreeView.vue', () => ({
  default: {
    name: 'TreeView',
    template: '<div data-testid="tree-view">Tree View</div>',
    props: ['files', 'currentPath', 'loading', 'error', 'focusedIndex'],
    emits: ['folder-selected', 'path-selected', 'file-selected']
  }
}))

vi.mock('@/components/Shared/DetailedListView.vue', () => ({
  default: {
    name: 'DetailedListView',
    template: '<div data-testid="detailed-list-view">Detailed List View</div>',
    props: ['files', 'currentPath', 'loading', 'error', 'focusedIndex'],
    emits: ['file-selected', 'file-double-click', 'path-selected', 'sort-changed', 'context-menu']
  }
}))

vi.mock('@/components/Shared/GridView.vue', () => ({
  default: {
    name: 'GridView',
    template: '<div data-testid="grid-view">Grid View</div>',
    props: ['files', 'currentPath', 'loading', 'error', 'focusedIndex'],
    emits: ['file-selected', 'file-double-click', 'path-selected', 'context-menu']
  }
}))

// Mock other components
vi.mock('@/components/Shared/KeyboardShortcutsHelp.vue', () => ({
  default: {
    name: 'KeyboardShortcutsHelp',
    template: '<div></div>',
    props: ['show'],
    emits: ['close']
  }
}))

vi.mock('@/components/Shared/ContextMenu.vue', () => ({
  default: {
    name: 'ContextMenu',
    template: '<div></div>',
    props: ['show', 'x', 'y', 'item', 'permissions', 'clipboardInfo', 'showPermissionErrors', 'isFavorite'],
    emits: ['open', 'download', 'rename', 'copy', 'cut', 'paste', 'permissions', 'move', 'create-folder', 'delete', 'properties', 'toggle-favorite']
  }
}))

// Mock all modal components
const mockModal = {
  template: '<div></div>',
  emits: ['close', 'updated', 'renamed', 'moved', 'confirmed', 'created']
}

vi.mock('@/components/Shared/PermissionModal.vue', () => ({ default: mockModal }))
vi.mock('@/components/Shared/RenameModal.vue', () => ({ default: mockModal }))
vi.mock('@/components/Shared/MoveModal.vue', () => ({ default: mockModal }))
vi.mock('@/components/Shared/DeleteConfirmModal.vue', () => ({ default: mockModal }))
vi.mock('@/components/Shared/PropertiesModal.vue', () => ({ default: mockModal }))
vi.mock('@/components/Shared/CreateFolderModal.vue', () => ({ default: mockModal }))

// Mock composables
vi.mock('@/composables/useViewMode.js', () => ({
  useViewMode: () => ({
    currentMode: { value: 'grid' },
    currentViewMode: { value: 'grid' },
    selectedFiles: { value: [] },
    getSelectedCount: () => 0,
    clearSelection: vi.fn(),
    setSelectedFiles: vi.fn(),
    addSelectedFile: vi.fn(),
    removeSelectedFile: vi.fn(),
    toggleSelectedFile: vi.fn(),
    selectAll: vi.fn()
  })
}))

vi.mock('@/composables/useResponsive.js', () => ({
  useResponsive: () => ({
    isMobile: { value: false },
    isTouch: { value: false },
    shouldUseVirtualization: () => false
  })
}))

vi.mock('@/composables/useAccessibility.js', () => ({
  useAccessibility: () => ({
    announce: vi.fn(),
    focusElement: vi.fn(),
    enhanceElement: vi.fn(),
    isKeyboardNavigation: { value: false }
  })
}))

vi.mock('@/composables/useTouchGestures.js', () => ({
  useTouchGestures: () => ({
    isGesturing: { value: false },
    swipeDirection: { value: null }
  })
}))

vi.mock('@/composables/useFileExplorerNavigation.js', () => ({
  useFileExplorerNavigation: () => ({
    focusedIndex: { value: -1 },
    focusedFile: { value: null },
    hasSelection: { value: false },
    activate: vi.fn(),
    deactivate: vi.fn(),
    setFocusedIndex: vi.fn(),
    handleClick: vi.fn(),
    handleDoubleClick: vi.fn(),
    clearSelection: vi.fn(),
    selectAll: vi.fn()
  })
}))

vi.mock('@/composables/useFileOperations.js', () => ({
  useFileOperations: () => ({
    hasOperation: { value: false },
    isCopyOperation: { value: false },
    isCutOperation: { value: false },
    operationItems: { value: [] },
    operationCount: { value: 0 },
    sourceFolder: { value: '' },
    copy: vi.fn(),
    cut: vi.fn(),
    paste: vi.fn(),
    clear: vi.fn(),
    isItemInOperation: vi.fn(() => false),
    getItemIndicatorClass: vi.fn(() => ''),
    getOperationDescription: vi.fn(() => ''),
    canPasteToDestination: vi.fn(() => true)
  })
}))

vi.mock('@/composables/useKeyboardShortcuts.js', () => ({
  useKeyboardShortcuts: () => ({})
}))

vi.mock('@/composables/usePermissions.js', () => ({
  usePermissions: () => ({})
}))

vi.mock('@/composables/useNotifications.js', () => ({
  useNotifications: () => ({})
}))

describe('FileExplorer Integration Tests', () => {
  let wrapper

  const mockFiles = [
    {
      name: 'Documents',
      path: '/Documents',
      is_directory: true,
      size: 0,
      modified_time: '2024-01-01T10:00:00Z'
    },
    {
      name: 'test.txt',
      path: '/test.txt',
      is_directory: false,
      size: 1024,
      modified_time: '2024-01-01T10:00:00Z'
    },
    {
      name: 'image.jpg',
      path: '/image.jpg',
      is_directory: false,
      size: 2048,
      modified_time: '2024-01-01T10:00:00Z'
    }
  ]

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Get the mocked nasAPI
    const { nasAPI } = await import('@/services/nasAPI.js')
    
    // Setup default mock responses
    nasAPI.browse.mockResolvedValue({
      success: true,
      items: mockFiles
    })
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('Component Initialization', () => {
    it('should render with default props', async () => {
      wrapper = mount(FileExplorer)
      await nextTick()

      expect(wrapper.find('.file-explorer').exists()).toBe(true)
      expect(wrapper.find('[data-testid="view-mode-selector"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="breadcrumb-nav"]').exists()).toBe(true)
    })

    it('should load files on mount when autoLoad is true', async () => {
      wrapper = mount(FileExplorer, {
        props: {
          autoLoad: true,
          initialPath: '/'
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 0)) // Wait for async operations

      const { nasAPI } = await import('@/services/nasAPI.js')
      expect(nasAPI.browse).toHaveBeenCalledWith('/')
    })

    it('should not load files on mount when autoLoad is false', async () => {
      wrapper = mount(FileExplorer, {
        props: {
          autoLoad: false,
          initialPath: '/'
        }
      })

      await nextTick()

      const { nasAPI } = await import('@/services/nasAPI.js')
      expect(nasAPI.browse).not.toHaveBeenCalled()
    })

    it('should set initial path correctly', async () => {
      wrapper = mount(FileExplorer, {
        props: {
          initialPath: '/Documents',
          autoLoad: true
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      const { nasAPI } = await import('@/services/nasAPI.js')
      expect(nasAPI.browse).toHaveBeenCalledWith('/Documents')
    })
  })

  describe('View Mode Switching', () => {
    beforeEach(async () => {
      wrapper = mount(FileExplorer, {
        props: {
          autoLoad: true
        }
      })
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    it('should display grid view by default', () => {
      expect(wrapper.find('[data-testid="grid-view"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="tree-view"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="detailed-list-view"]').exists()).toBe(false)
    })

    it('should switch view modes when mode selector emits change', async () => {
      const viewModeSelector = wrapper.findComponent({ name: 'ViewModeSelector' })
      
      // Emit mode change to tree view
      await viewModeSelector.vm.$emit('mode-changed', {
        newMode: 'tree',
        oldMode: 'grid'
      })

      expect(wrapper.emitted('mode-changed')).toBeTruthy()
      expect(wrapper.emitted('mode-changed')[0][0]).toMatchObject({
        newMode: 'tree',
        oldMode: 'grid'
      })
    })

    it('should preserve file data when switching modes', async () => {
      const viewModeSelector = wrapper.findComponent({ name: 'ViewModeSelector' })
      
      // Switch to detailed list view
      await viewModeSelector.vm.$emit('mode-changed', {
        newMode: 'detailed-list',
        oldMode: 'grid'
      })

      // Files should still be available
      expect(wrapper.vm.files).toEqual(mockFiles)
    })

    it('should maintain current path when switching modes', async () => {
      const initialPath = wrapper.vm.currentPath
      const viewModeSelector = wrapper.findComponent({ name: 'ViewModeSelector' })
      
      await viewModeSelector.vm.$emit('mode-changed', {
        newMode: 'tree',
        oldMode: 'grid'
      })

      expect(wrapper.vm.currentPath).toBe(initialPath)
    })
  })

  describe('Navigation', () => {
    beforeEach(async () => {
      wrapper = mount(FileExplorer, {
        props: {
          autoLoad: true
        }
      })
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    it('should navigate when breadcrumb emits navigate event', async () => {
      const { nasAPI } = await import('@/services/nasAPI.js')
      const breadcrumb = wrapper.findComponent({ name: 'BreadcrumbNavigation' })
      
      nasAPI.browse.mockResolvedValue({
        success: true,
        items: [
          {
            name: 'subfolder',
            path: '/test/subfolder',
            is_directory: true
          }
        ]
      })

      await breadcrumb.vm.$emit('navigate', '/test')
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(nasAPI.browse).toHaveBeenCalledWith('/test')
      expect(wrapper.emitted('path-changed')).toBeTruthy()
    })

    it('should handle navigation history', async () => {
      // Navigate to a new path
      await wrapper.vm.handlePathSelected('/Documents')
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      // Check that navigation history is updated
      expect(wrapper.vm.navigationHistory).toContain('/Documents')
      expect(wrapper.vm.canNavigateBack).toBe(true)
    })

    it('should navigate back in history', async () => {
      // Navigate to a path first
      await wrapper.vm.handlePathSelected('/Documents')
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      // Navigate back
      await wrapper.vm.navigateHistoryBack()
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.vm.currentPath).toBe('/')
    })

    it('should handle external path changes', async () => {
      await wrapper.setProps({ externalPath: '/Documents' })
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(nasAPI.browse).toHaveBeenCalledWith('/Documents')
    })
  })

  describe('File Operations', () => {
    beforeEach(async () => {
      wrapper = mount(FileExplorer, {
        props: {
          autoLoad: true
        }
      })
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    it('should handle file selection from view components', async () => {
      const gridView = wrapper.findComponent({ name: 'GridView' })
      
      await gridView.vm.$emit('file-selected', {
        file: mockFiles[0],
        multiSelect: false,
        rangeSelect: false
      })

      expect(wrapper.emitted('file-selected')).toBeTruthy()
      expect(wrapper.emitted('selection-changed')).toBeTruthy()
    })

    it('should handle file double-click for directories', async () => {
      const { nasAPI } = await import('@/services/nasAPI.js')
      const gridView = wrapper.findComponent({ name: 'GridView' })
      
      nasAPI.browse.mockResolvedValue({
        success: true,
        items: []
      })

      await gridView.vm.$emit('file-double-click', {
        file: mockFiles[0] // Documents folder
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(nasAPI.browse).toHaveBeenCalledWith('/Documents')
    })

    it('should handle file double-click for files', async () => {
      const gridView = wrapper.findComponent({ name: 'GridView' })
      
      await gridView.vm.$emit('file-double-click', {
        file: mockFiles[1] // test.txt file
      })

      expect(wrapper.emitted('file-double-click')).toBeTruthy()
    })

    it('should handle sort changes from list view', async () => {
      const detailedListView = wrapper.findComponent({ name: 'DetailedListView' })
      
      await detailedListView.vm.$emit('sort-changed', {
        column: 'name',
        direction: 'asc'
      })

      expect(wrapper.emitted('sort-changed')).toBeTruthy()
    })
  })

  describe('Error Handling', () => {
    beforeEach(async () => {
      wrapper = mount(FileExplorer, {
        props: {
          autoLoad: false
        }
      })
      await nextTick()
    })

    it('should handle API errors gracefully', async () => {
      const { nasAPI } = await import('@/services/nasAPI.js')
      nasAPI.browse.mockRejectedValue(new Error('Network error'))

      await wrapper.vm.loadFiles('/test')
      await nextTick()

      expect(wrapper.vm.error).toBe('Network error')
      expect(wrapper.vm.files).toEqual([])
      expect(wrapper.emitted('error')).toBeTruthy()
    })

    it('should display error state in UI', async () => {
      const { nasAPI } = await import('@/services/nasAPI.js')
      nasAPI.browse.mockRejectedValue(new Error('Access denied'))

      await wrapper.vm.loadFiles('/test')
      await nextTick()

      expect(wrapper.find('.alert-error').exists()).toBe(true)
      expect(wrapper.find('.alert-error').text()).toContain('Access denied')
    })

    it('should allow retry after error', async () => {
      const { nasAPI } = await import('@/services/nasAPI.js')
      nasAPI.browse.mockRejectedValue(new Error('Network error'))

      await wrapper.vm.loadFiles('/test')
      await nextTick()

      // Reset mock to succeed
      nasAPI.browse.mockResolvedValue({
        success: true,
        items: mockFiles
      })

      // Click retry button
      const retryButton = wrapper.find('button[aria-label="Réessayer le chargement des fichiers"]')
      await retryButton.trigger('click')
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.vm.error).toBe('')
      expect(wrapper.vm.files).toEqual(mockFiles)
    })
  })

  describe('Loading States', () => {
    beforeEach(async () => {
      wrapper = mount(FileExplorer, {
        props: {
          autoLoad: false
        }
      })
      await nextTick()
    })

    it('should show loading state during file loading', async () => {
      const { nasAPI } = await import('@/services/nasAPI.js')
      let resolvePromise
      const loadingPromise = new Promise(resolve => {
        resolvePromise = resolve
      })
      
      nasAPI.browse.mockReturnValue(loadingPromise)

      // Start loading
      const loadPromise = wrapper.vm.loadFiles('/test')

      await nextTick()

      // Should be in loading state
      expect(wrapper.vm.loading).toBe(true)
      expect(wrapper.find('.loading-state-enhanced').exists()).toBe(true)

      // Resolve the promise
      resolvePromise({
        success: true,
        items: mockFiles
      })

      await loadPromise
      await nextTick()

      // Should no longer be loading
      expect(wrapper.vm.loading).toBe(false)
    })

    it('should prevent multiple simultaneous loads', async () => {
      const { nasAPI } = await import('@/services/nasAPI.js')
      let resolvePromise
      const loadingPromise = new Promise(resolve => {
        resolvePromise = resolve
      })
      
      nasAPI.browse.mockReturnValue(loadingPromise)

      // Start first load
      const loadPromise1 = wrapper.vm.loadFiles('/test1')
      
      // Try to start second load while first is still loading
      const loadPromise2 = wrapper.vm.loadFiles('/test2')

      await nextTick()

      // Only one API call should have been made
      expect(nasAPI.browse).toHaveBeenCalledTimes(1)
      expect(nasAPI.browse).toHaveBeenCalledWith('/test1')

      // Resolve the promise
      resolvePromise({
        success: true,
        items: mockFiles
      })

      await Promise.all([loadPromise1, loadPromise2])
    })
  })

  describe('Responsive Behavior', () => {
    it('should handle mobile-specific events', async () => {
      wrapper = mount(FileExplorer, {
        props: {
          autoLoad: true
        }
      })
      await nextTick()

      // Simulate mobile actions
      await wrapper.vm.handleShowActions()

      expect(wrapper.emitted('show-mobile-actions')).toBeTruthy()
    })

    it('should handle navigation back gesture', async () => {
      const { nasAPI } = await import('@/services/nasAPI.js')
      wrapper = mount(FileExplorer, {
        props: {
          autoLoad: true,
          initialPath: '/Documents'
        }
      })
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      nasAPI.browse.mockResolvedValue({
        success: true,
        items: mockFiles
      })

      await wrapper.vm.handleNavigateBack()
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      // Should navigate to parent directory
      expect(nasAPI.browse).toHaveBeenCalledWith('/')
    })
  })

  describe('Accessibility', () => {
    beforeEach(async () => {
      wrapper = mount(FileExplorer, {
        props: {
          autoLoad: true
        }
      })
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    it('should have proper ARIA attributes', () => {
      expect(wrapper.find('[role="application"]').exists()).toBe(true)
      expect(wrapper.find('[aria-label="Explorateur de fichiers"]').exists()).toBe(true)
      expect(wrapper.find('[role="toolbar"]').exists()).toBe(true)
    })

    it('should handle keyboard shortcuts', async () => {
      const { nasAPI } = await import('@/services/nasAPI.js')
      const container = wrapper.find('.file-explorer')
      
      // Test F5 for refresh
      await container.trigger('keydown', { key: 'F5' })
      
      // Should trigger refresh (additional API call)
      expect(nasAPI.browse).toHaveBeenCalledTimes(2) // Initial load + refresh
    })

    it('should manage focus properly', async () => {
      const container = wrapper.find('.file-explorer')
      
      await container.trigger('focus')
      
      // Focus management should be handled by accessibility composable
      // This test verifies the event is properly bound
      expect(container.element).toBe(document.activeElement)
    })
  })

  describe('Performance', () => {
    it('should handle large file lists efficiently', async () => {
      const { nasAPI } = await import('@/services/nasAPI.js')
      const largeFileList = Array.from({ length: 1000 }, (_, i) => ({
        name: `file${i}.txt`,
        path: `/file${i}.txt`,
        is_directory: false,
        size: 1024,
        modified_time: '2024-01-01T10:00:00Z'
      }))

      nasAPI.browse.mockResolvedValue({
        success: true,
        items: largeFileList
      })

      wrapper = mount(FileExplorer, {
        props: {
          autoLoad: true
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.vm.files).toHaveLength(1000)
      expect(wrapper.vm.fileCount).toBe(1000)
    })

    it('should debounce rapid navigation requests', async () => {
      const { nasAPI } = await import('@/services/nasAPI.js')
      wrapper = mount(FileExplorer, {
        props: {
          autoLoad: false
        }
      })

      // Simulate rapid navigation
      const promises = [
        wrapper.vm.handlePathSelected('/path1'),
        wrapper.vm.handlePathSelected('/path2'),
        wrapper.vm.handlePathSelected('/path3')
      ]

      await Promise.all(promises)
      await nextTick()

      // Should only make the final API call due to debouncing/loading prevention
      expect(nasAPI.browse).toHaveBeenCalledTimes(1)
    })
  })
})
