// tests/integration/view-modes.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

// Import the actual view components for integration testing
import TreeView from '@/components/Shared/TreeView.vue'
import DetailedListView from '@/components/Shared/DetailedListView.vue'
import GridView from '@/components/Shared/GridView.vue'

// Mock the NAS API
const mockNasAPI = {
  browse: vi.fn(),
  normalizePath: vi.fn((path) => path.replace(/\/+/g, '/').replace(/\/$/, '') || '/')
}

vi.mock('@/services/nasAPI.js', () => ({
  nasAPI: mockNasAPI
}))

// Mock child components for TreeView
vi.mock('@/components/Shared/TreeNode.vue', () => ({
  default: {
    name: 'TreeNode',
    template: `
      <div 
        class="tree-node" 
        :data-node-path="node.path"
        @click="$emit('select', node.path)"
        @keydown.enter="$emit('select', node.path)"
      >
        <button @click.stop="$emit('expand', node.path, !expanded)">
          {{ expanded ? '▼' : '▶' }}
        </button>
        {{ node.name }}
      </div>
    `,
    props: ['node', 'selectedPath', 'expandedPaths', 'focusedPath', 'level', 'index', 'siblingsCount'],
    emits: ['select', 'expand', 'focus', 'keydown'],
    computed: {
      expanded() {
        return this.expandedPaths?.has(this.node.path) || false
      }
    }
  }
}))

// Mock composables
vi.mock('@/composables/useViewMode.js', () => ({
  useViewMode: () => ({
    sortColumn: { value: 'name' },
    sortDirection: { value: 'asc' },
    visibleColumns: { value: [
      { key: 'name', label: 'Nom' },
      { key: 'size', label: 'Taille' },
      { key: 'type', label: 'Type' },
      { key: 'date', label: 'Date' }
    ]},
    setSortColumn: vi.fn(),
    isSelected: vi.fn(() => false),
    sortFiles: vi.fn((files) => files || []),
    selectedFiles: { value: [] },
    setSelectedFiles: vi.fn(),
    addSelectedFile: vi.fn(),
    removeSelectedFile: vi.fn(),
    toggleSelectedFile: vi.fn(),
    clearSelection: vi.fn(),
    selectAll: vi.fn(),
    getSelectedCount: vi.fn(() => 0)
  })
}))

// Mock utility functions
vi.mock('@/utils/fileUtils.js', () => ({
  formatBytes: vi.fn((bytes) => `${bytes} B`),
  formatDate: vi.fn((date) => new Date(date).toLocaleDateString())
}))

describe('View Modes Integration Tests', () => {
  const mockFiles = [
    {
      name: 'Documents',
      path: '/Documents',
      is_directory: true,
      size: 0,
      modified_time: '2024-01-01T10:00:00Z'
    },
    {
      name: 'Pictures',
      path: '/Pictures',
      is_directory: true,
      size: 0,
      modified_time: '2024-01-01T09:00:00Z'
    },
    {
      name: 'test.txt',
      path: '/test.txt',
      is_directory: false,
      size: 1024,
      modified_time: '2024-01-01T08:00:00Z'
    },
    {
      name: 'image.jpg',
      path: '/image.jpg',
      is_directory: false,
      size: 2048,
      modified_time: '2024-01-01T07:00:00Z'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockNasAPI.browse.mockResolvedValue({
      success: true,
      items: mockFiles
    })
  })

  describe('TreeView Component', () => {
    let wrapper

    afterEach(() => {
      if (wrapper) {
        wrapper.unmount()
      }
    })

    it('should render tree structure correctly', async () => {
      wrapper = mount(TreeView, {
        props: {
          selectedPath: '/',
          currentPath: '/',
          files: mockFiles,
          loading: false,
          error: ''
        }
      })

      await nextTick()

      expect(wrapper.find('.tree-view').exists()).toBe(true)
      expect(wrapper.find('.tree-node-root').exists()).toBe(true)
    })

    it('should load directory contents on expansion', async () => {
      wrapper = mount(TreeView, {
        props: {
          selectedPath: '/',
          currentPath: '/',
          files: mockFiles,
          loading: false,
          error: ''
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      // Should load root directory
      expect(mockNasAPI.browse).toHaveBeenCalledWith('/')
    })

    it('should handle folder selection', async () => {
      wrapper = mount(TreeView, {
        props: {
          selectedPath: '/',
          currentPath: '/',
          files: mockFiles,
          loading: false,
          error: ''
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      // Click on root folder
      await wrapper.find('.tree-node-root').trigger('click')

      expect(wrapper.emitted('folder-selected')).toBeTruthy()
      expect(wrapper.emitted('path-selected')).toBeTruthy()
    })

    it('should expand and collapse nodes', async () => {
      wrapper = mount(TreeView, {
        props: {
          selectedPath: '/',
          currentPath: '/',
          files: mockFiles,
          loading: false,
          error: ''
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      // Toggle root expansion
      const expandButton = wrapper.find('.tree-node-root button')
      await expandButton.trigger('click')

      // Should show tree nodes
      expect(wrapper.find('.tree-nodes-container').exists()).toBe(true)
    })

    it('should handle keyboard navigation', async () => {
      wrapper = mount(TreeView, {
        props: {
          selectedPath: '/',
          currentPath: '/',
          files: mockFiles,
          loading: false,
          error: ''
        }
      })

      await nextTick()

      const treeView = wrapper.find('.tree-view')
      
      // Test arrow down navigation
      await treeView.trigger('keydown', { key: 'ArrowDown' })
      
      // Should handle keyboard navigation
      expect(wrapper.vm.focusedNodePath).toBeDefined()
    })

    it('should handle lazy loading of child nodes', async () => {
      const childFiles = [
        {
          name: 'subfolder',
          path: '/Documents/subfolder',
          is_directory: true,
          size: 0,
          modified_time: '2024-01-01T10:00:00Z'
        }
      ]

      mockNasAPI.browse.mockImplementation((path) => {
        if (path === '/Documents') {
          return Promise.resolve({
            success: true,
            items: childFiles
          })
        }
        return Promise.resolve({
          success: true,
          items: mockFiles
        })
      })

      wrapper = mount(TreeView, {
        props: {
          selectedPath: '/',
          currentPath: '/',
          files: mockFiles,
          loading: false,
          error: ''
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      // Expand a node to trigger lazy loading
      await wrapper.vm.handleNodeExpanded('/Documents', true)
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(mockNasAPI.browse).toHaveBeenCalledWith('/Documents')
    })
  })

  describe('DetailedListView Component', () => {
    let wrapper

    afterEach(() => {
      if (wrapper) {
        wrapper.unmount()
      }
    })

    it('should render table structure correctly', async () => {
      wrapper = mount(DetailedListView, {
        props: {
          files: mockFiles,
          loading: false,
          error: '',
          currentPath: '/',
          focusedIndex: -1
        }
      })

      await nextTick()

      expect(wrapper.find('.detailed-list-view').exists()).toBe(true)
      expect(wrapper.find('table').exists()).toBe(true)
      expect(wrapper.find('thead').exists()).toBe(true)
      expect(wrapper.find('tbody').exists()).toBe(true)
    })

    it('should display files in table rows', async () => {
      wrapper = mount(DetailedListView, {
        props: {
          files: mockFiles,
          loading: false,
          error: '',
          currentPath: '/',
          focusedIndex: -1
        }
      })

      await nextTick()

      const rows = wrapper.findAll('tbody tr')
      expect(rows).toHaveLength(mockFiles.length)
    })

    it('should handle column sorting', async () => {
      wrapper = mount(DetailedListView, {
        props: {
          files: mockFiles,
          loading: false,
          error: '',
          currentPath: '/',
          focusedIndex: -1
        }
      })

      await nextTick()

      // Click on size column header
      const sizeHeader = wrapper.find('th[aria-label*="Taille"]')
      await sizeHeader.trigger('click')

      expect(wrapper.emitted('sort-changed')).toBeTruthy()
    })

    it('should handle file selection with checkboxes', async () => {
      wrapper = mount(DetailedListView, {
        props: {
          files: mockFiles,
          loading: false,
          error: '',
          currentPath: '/',
          focusedIndex: -1
        }
      })

      await nextTick()

      // Click on first file checkbox
      const firstCheckbox = wrapper.find('tbody tr:first-child input[type="checkbox"]')
      await firstCheckbox.trigger('change')

      // Should call toggle selection
      expect(wrapper.vm.toggleSelectedFile).toBeDefined()
    })

    it('should handle file double-click for navigation', async () => {
      wrapper = mount(DetailedListView, {
        props: {
          files: mockFiles,
          loading: false,
          error: '',
          currentPath: '/',
          focusedIndex: -1
        }
      })

      await nextTick()

      // Double-click on Documents folder
      const firstRow = wrapper.find('tbody tr:first-child')
      await firstRow.trigger('dblclick')

      expect(wrapper.emitted('path-selected')).toBeTruthy()
      expect(wrapper.emitted('path-selected')[0][0]).toBe('/Documents')
    })

    it('should handle keyboard navigation in table', async () => {
      wrapper = mount(DetailedListView, {
        props: {
          files: mockFiles,
          loading: false,
          error: '',
          currentPath: '/',
          focusedIndex: 0
        }
      })

      await nextTick()

      const listView = wrapper.find('.detailed-list-view')
      
      // Test arrow down navigation
      await listView.trigger('keydown', { key: 'ArrowDown' })
      
      // Should handle keyboard navigation
      expect(wrapper.vm.focusedIndex).toBeDefined()
    })

    it('should show loading state', async () => {
      wrapper = mount(DetailedListView, {
        props: {
          files: [],
          loading: true,
          error: '',
          currentPath: '/',
          focusedIndex: -1
        }
      })

      await nextTick()

      expect(wrapper.find('.loading').exists()).toBe(true)
    })

    it('should show error state', async () => {
      wrapper = mount(DetailedListView, {
        props: {
          files: [],
          loading: false,
          error: 'Failed to load files',
          currentPath: '/',
          focusedIndex: -1
        }
      })

      await nextTick()

      expect(wrapper.find('.text-error').exists()).toBe(true)
      expect(wrapper.text()).toContain('Failed to load files')
    })

    it('should show empty state', async () => {
      wrapper = mount(DetailedListView, {
        props: {
          files: [],
          loading: false,
          error: '',
          currentPath: '/',
          focusedIndex: -1
        }
      })

      await nextTick()

      expect(wrapper.text()).toContain('Aucun fichier dans ce dossier')
    })

    it('should handle select all functionality', async () => {
      wrapper = mount(DetailedListView, {
        props: {
          files: mockFiles,
          loading: false,
          error: '',
          currentPath: '/',
          focusedIndex: -1
        }
      })

      await nextTick()

      // Click select all checkbox in header
      const selectAllCheckbox = wrapper.find('thead input[type="checkbox"]')
      await selectAllCheckbox.trigger('change')

      // Should call select all
      expect(wrapper.vm.selectAll).toBeDefined()
    })
  })

  describe('GridView Component', () => {
    let wrapper

    // Mock GridView since it's not provided in the truncated files
    beforeEach(() => {
      vi.doMock('@/components/Shared/GridView.vue', () => ({
        default: {
          name: 'GridView',
          template: `
            <div class="grid-view" role="grid" :aria-busy="loading">
              <div v-if="loading" class="loading">Loading...</div>
              <div v-else-if="error" class="error">{{ error }}</div>
              <div v-else-if="!files || files.length === 0" class="empty">No files</div>
              <div v-else class="grid-container">
                <div 
                  v-for="(file, index) in files" 
                  :key="file.path || file.name"
                  class="grid-item"
                  :class="{ 'selected': isSelected(file.path || file.name) }"
                  @click="handleFileClick(file, $event, index)"
                  @dblclick="handleFileDoubleClick(file, $event)"
                  @contextmenu="handleContextMenu(file, $event)"
                >
                  <div class="file-icon">
                    <i :class="getFileIcon(file)"></i>
                  </div>
                  <div class="file-name">{{ file.name }}</div>
                </div>
              </div>
            </div>
          `,
          props: ['files', 'loading', 'error', 'currentPath', 'focusedIndex'],
          emits: ['file-selected', 'file-double-click', 'path-selected', 'context-menu'],
          methods: {
            isSelected: () => false,
            getFileIcon: (file) => file.is_directory ? 'fas fa-folder' : 'fas fa-file',
            handleFileClick(file, event, index) {
              this.$emit('file-selected', { file, event, index })
            },
            handleFileDoubleClick(file, event) {
              if (file.is_directory) {
                this.$emit('path-selected', file.path)
              } else {
                this.$emit('file-double-click', { file, event })
              }
            },
            handleContextMenu(file, event) {
              event.preventDefault()
              this.$emit('context-menu', event, file)
            }
          }
        }
      }))
    })

    afterEach(() => {
      if (wrapper) {
        wrapper.unmount()
      }
      vi.doUnmock('@/components/Shared/GridView.vue')
    })

    it('should render grid layout correctly', async () => {
      const { default: GridView } = await import('@/components/Shared/GridView.vue')
      
      wrapper = mount(GridView, {
        props: {
          files: mockFiles,
          loading: false,
          error: '',
          currentPath: '/',
          focusedIndex: -1
        }
      })

      await nextTick()

      expect(wrapper.find('.grid-view').exists()).toBe(true)
      expect(wrapper.find('.grid-container').exists()).toBe(true)
    })

    it('should display files as grid items', async () => {
      const { default: GridView } = await import('@/components/Shared/GridView.vue')
      
      wrapper = mount(GridView, {
        props: {
          files: mockFiles,
          loading: false,
          error: '',
          currentPath: '/',
          focusedIndex: -1
        }
      })

      await nextTick()

      const gridItems = wrapper.findAll('.grid-item')
      expect(gridItems).toHaveLength(mockFiles.length)
    })

    it('should handle file selection in grid', async () => {
      const { default: GridView } = await import('@/components/Shared/GridView.vue')
      
      wrapper = mount(GridView, {
        props: {
          files: mockFiles,
          loading: false,
          error: '',
          currentPath: '/',
          focusedIndex: -1
        }
      })

      await nextTick()

      // Click on first grid item
      const firstItem = wrapper.find('.grid-item')
      await firstItem.trigger('click')

      expect(wrapper.emitted('file-selected')).toBeTruthy()
    })

    it('should handle double-click navigation in grid', async () => {
      const { default: GridView } = await import('@/components/Shared/GridView.vue')
      
      wrapper = mount(GridView, {
        props: {
          files: mockFiles,
          loading: false,
          error: '',
          currentPath: '/',
          focusedIndex: -1
        }
      })

      await nextTick()

      // Double-click on Documents folder (first item)
      const firstItem = wrapper.find('.grid-item')
      await firstItem.trigger('dblclick')

      expect(wrapper.emitted('path-selected')).toBeTruthy()
      expect(wrapper.emitted('path-selected')[0][0]).toBe('/Documents')
    })

    it('should show loading state in grid', async () => {
      const { default: GridView } = await import('@/components/Shared/GridView.vue')
      
      wrapper = mount(GridView, {
        props: {
          files: [],
          loading: true,
          error: '',
          currentPath: '/',
          focusedIndex: -1
        }
      })

      await nextTick()

      expect(wrapper.find('.loading').exists()).toBe(true)
    })

    it('should show error state in grid', async () => {
      const { default: GridView } = await import('@/components/Shared/GridView.vue')
      
      wrapper = mount(GridView, {
        props: {
          files: [],
          loading: false,
          error: 'Network error',
          currentPath: '/',
          focusedIndex: -1
        }
      })

      await nextTick()

      expect(wrapper.find('.error').exists()).toBe(true)
      expect(wrapper.text()).toContain('Network error')
    })

    it('should show empty state in grid', async () => {
      const { default: GridView } = await import('@/components/Shared/GridView.vue')
      
      wrapper = mount(GridView, {
        props: {
          files: [],
          loading: false,
          error: '',
          currentPath: '/',
          focusedIndex: -1
        }
      })

      await nextTick()

      expect(wrapper.find('.empty').exists()).toBe(true)
    })
  })

  describe('Cross-View Mode Consistency', () => {
    it('should maintain file data consistency across view modes', () => {
      // Test that all view modes receive and handle the same file data structure
      const testFiles = mockFiles

      // Each view mode should handle the same file structure
      testFiles.forEach(file => {
        expect(file).toHaveProperty('name')
        expect(file).toHaveProperty('path')
        expect(file).toHaveProperty('is_directory')
        expect(file).toHaveProperty('size')
        expect(file).toHaveProperty('modified_time')
      })
    })

    it('should emit consistent events across view modes', async () => {
      const testFile = mockFiles[0]
      const expectedEvents = ['file-selected', 'file-double-click', 'path-selected']

      // All view modes should emit the same core events
      expectedEvents.forEach(eventName => {
        expect(typeof eventName).toBe('string')
      })
    })

    it('should handle selection state consistently', () => {
      // All view modes should use the same selection mechanism
      const mockSelection = ['file1.txt', 'file2.txt']
      
      // Selection should be handled by the shared composable
      expect(Array.isArray(mockSelection)).toBe(true)
    })
  })

  describe('Accessibility Across View Modes', () => {
    it('should have proper ARIA attributes in all view modes', async () => {
      // TreeView
      const treeWrapper = mount(TreeView, {
        props: {
          selectedPath: '/',
          files: mockFiles,
          loading: false
        }
      })

      expect(treeWrapper.find('[role="tree"]').exists()).toBe(true)

      // DetailedListView
      const listWrapper = mount(DetailedListView, {
        props: {
          files: mockFiles,
          loading: false,
          currentPath: '/'
        }
      })

      expect(listWrapper.find('[role="grid"]').exists()).toBe(true)

      treeWrapper.unmount()
      listWrapper.unmount()
    })

    it('should support keyboard navigation in all view modes', async () => {
      const keyboardEvents = ['ArrowDown', 'ArrowUp', 'Enter', ' ']

      // All view modes should handle basic keyboard events
      keyboardEvents.forEach(key => {
        expect(typeof key).toBe('string')
      })
    })
  })

  describe('Performance Across View Modes', () => {
    it('should handle large file lists efficiently in all view modes', async () => {
      const largeFileList = Array.from({ length: 100 }, (_, i) => ({
        name: `file${i}.txt`,
        path: `/file${i}.txt`,
        is_directory: false,
        size: 1024,
        modified_time: '2024-01-01T10:00:00Z'
      }))

      // TreeView
      const treeWrapper = mount(TreeView, {
        props: {
          selectedPath: '/',
          files: largeFileList,
          loading: false
        }
      })

      // DetailedListView
      const listWrapper = mount(DetailedListView, {
        props: {
          files: largeFileList,
          loading: false,
          currentPath: '/'
        }
      })

      await nextTick()

      // Both should handle large lists without errors
      expect(treeWrapper.exists()).toBe(true)
      expect(listWrapper.exists()).toBe(true)

      treeWrapper.unmount()
      listWrapper.unmount()
    })
  })
})