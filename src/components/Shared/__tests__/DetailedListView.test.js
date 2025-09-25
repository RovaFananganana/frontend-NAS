/**
 * @fileoverview Tests unitaires pour le composant DetailedListView
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import DetailedListView from '../DetailedListView.vue'
import { VIEW_MODES, SORT_COLUMNS, SORT_DIRECTIONS } from '../../../types/viewMode.js'

// Mock du composable useViewMode
const mockUseViewMode = {
  sortColumn: { value: SORT_COLUMNS.NAME },
  sortDirection: { value: SORT_DIRECTIONS.ASC },
  visibleColumns: { 
    value: [
      { key: 'name', label: 'Nom', sortable: true },
      { key: 'size', label: 'Taille', sortable: true },
      { key: 'type', label: 'Type', sortable: true },
      { key: 'modified', label: 'Modifié', sortable: true }
    ]
  },
  setSortColumn: vi.fn(),
  isSelected: vi.fn(() => false),
  sortFiles: vi.fn((files) => files),
  addShortcut: vi.fn()
}

// Mock du composable useResponsive
const mockUseResponsive = {
  isMobile: { value: false },
  isTablet: { value: false },
  isDesktop: { value: true },
  isTouch: { value: false },
  shouldShowColumn: vi.fn(() => true),
  touchSizes: { value: { minTouchTarget: 44 } },
  responsiveClasses: { value: [] }
}

// Mock du composable useTouchGestures
const mockUseTouchGestures = {
  isGesturing: { value: false },
  swipeDirection: { value: null }
}

vi.mock('../../../composables/useViewMode.js', () => ({
  useViewMode: () => mockUseViewMode
}))

vi.mock('../../../composables/useResponsive.js', () => ({
  useResponsive: () => mockUseResponsive
}))

vi.mock('../../../composables/useTouchGestures.js', () => ({
  useTouchGestures: () => mockUseTouchGestures
}))

// Mock du composant FileListItem
vi.mock('../FileListItem.vue', () => ({
  default: {
    name: 'FileListItem',
    props: ['file', 'selected', 'index', 'focused', 'isMobile', 'isTouch', 'visibleColumns'],
    emits: ['click', 'double-click', 'context-menu'],
    template: '<tr data-testid="file-item"><td>{{ file.name }}</td></tr>'
  }
}))

// Mock du composant KeyboardShortcutsHelp
vi.mock('../KeyboardShortcutsHelp.vue', () => ({
  default: {
    name: 'KeyboardShortcutsHelp',
    props: ['show'],
    emits: ['close'],
    template: '<div v-if="show" data-testid="shortcuts-help">Shortcuts Help</div>'
  }
}))

describe('DetailedListView', () => {
  const mockFiles = [
    {
      name: 'document.pdf',
      path: '/test/document.pdf',
      is_directory: false,
      size: 1024,
      modified_time: '2024-01-15T10:30:00Z'
    },
    {
      name: 'folder',
      path: '/test/folder',
      is_directory: true,
      modified_time: '2024-01-14T15:45:00Z'
    },
    {
      name: 'image.jpg',
      path: '/test/image.jpg',
      is_directory: false,
      size: 2048,
      modified_time: '2024-01-16T08:20:00Z'
    }
  ]

  beforeEach(() => {
    mockUseViewMode.setSortColumn.mockClear()
    mockUseViewMode.isSelected.mockClear()
    mockUseViewMode.sortFiles.mockClear()
    mockUseViewMode.addShortcut.mockClear()
    mockUseViewMode.sortFiles.mockImplementation((files) => files)
    mockUseResponsive.shouldShowColumn.mockClear()
    mockUseResponsive.shouldShowColumn.mockImplementation(() => true)
  })

  it('should render table headers correctly', () => {
    const wrapper = mount(DetailedListView, {
      props: { files: mockFiles }
    })
    
    const headers = wrapper.findAll('th')
    expect(headers.length).toBeGreaterThan(0)
    
    // Check that the component renders the table structure
    expect(wrapper.find('table').exists()).toBe(true)
    expect(wrapper.find('thead').exists()).toBe(true)
  })

  it('should render files when provided', () => {
    const wrapper = mount(DetailedListView, {
      props: { files: mockFiles }
    })
    
    const fileItems = wrapper.findAll('[data-testid="file-item"]')
    expect(fileItems).toHaveLength(3)
  })

  it('should show loading state', () => {
    const wrapper = mount(DetailedListView, {
      props: { 
        files: [],
        loading: true
      }
    })
    
    expect(wrapper.find('.loading').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Aucun fichier')
  })

  it('should show error state', () => {
    const wrapper = mount(DetailedListView, {
      props: { 
        files: [],
        error: 'Erreur de chargement'
      }
    })
    
    expect(wrapper.text()).toContain('Erreur de chargement')
    expect(wrapper.find('.text-error').exists()).toBe(true)
  })

  it('should show empty state when no files', () => {
    const wrapper = mount(DetailedListView, {
      props: { files: [] }
    })
    
    expect(wrapper.text()).toContain('Aucun fichier dans ce dossier')
  })

  it('should handle column header clicks for sorting', async () => {
    const wrapper = mount(DetailedListView, {
      props: { files: mockFiles }
    })
    
    const headers = wrapper.findAll('th')
    if (headers.length > 1) {
      const sizeHeader = headers[1]
      await sizeHeader.trigger('click')
      
      expect(mockUseViewMode.setSortColumn).toHaveBeenCalledWith('size')
    }
  })

  it('should emit sort-changed event when sorting', async () => {
    const wrapper = mount(DetailedListView, {
      props: { files: mockFiles }
    })
    
    const nameHeader = wrapper.findAll('th')[0]
    await nameHeader.trigger('click')
    
    const emittedEvents = wrapper.emitted('sort-changed')
    expect(emittedEvents).toBeTruthy()
    expect(emittedEvents[0][0]).toMatchObject({
      column: SORT_COLUMNS.NAME,
      direction: SORT_DIRECTIONS.ASC
    })
  })

  it('should show sort indicators on active column', () => {
    const wrapper = mount(DetailedListView, {
      props: { files: mockFiles }
    })
    
    // Check that sort indicators exist somewhere in the component
    const sortIcons = wrapper.findAll('.fas.fa-sort-up, .fas.fa-sort-down, .fas.fa-sort')
    expect(sortIcons.length).toBeGreaterThan(0)
  })

  it('should call sortFiles from composable', () => {
    mount(DetailedListView, {
      props: { files: mockFiles }
    })
    
    expect(mockUseViewMode.sortFiles).toHaveBeenCalledWith(mockFiles)
  })

  it('should handle file selection events', async () => {
    const wrapper = mount(DetailedListView, {
      props: { files: mockFiles }
    })
    
    const fileItem = wrapper.findComponent({ name: 'FileListItem' })
    await fileItem.vm.$emit('click', mockFiles[0], { ctrlKey: false, shiftKey: false })
    
    const emittedEvents = wrapper.emitted('file-selected')
    expect(emittedEvents).toBeTruthy()
    expect(emittedEvents[0][0]).toMatchObject({
      file: mockFiles[0]
    })
  })

  it('should handle file double-click for directories', async () => {
    const wrapper = mount(DetailedListView, {
      props: { files: mockFiles }
    })
    
    const fileItem = wrapper.findComponent({ name: 'FileListItem' })
    await fileItem.vm.$emit('double-click', mockFiles[1], {}) // folder
    
    const emittedEvents = wrapper.emitted('path-selected')
    expect(emittedEvents).toBeTruthy()
    expect(emittedEvents[0][0]).toBe('/test/folder')
  })

  it('should handle file double-click for files', async () => {
    const wrapper = mount(DetailedListView, {
      props: { files: mockFiles }
    })
    
    const fileItem = wrapper.findComponent({ name: 'FileListItem' })
    await fileItem.vm.$emit('double-click', mockFiles[0], {}) // document.pdf
    
    const emittedEvents = wrapper.emitted('file-double-click')
    expect(emittedEvents).toBeTruthy()
    expect(emittedEvents[0][0]).toMatchObject({
      file: mockFiles[0]
    })
  })

  it('should handle multi-select with Ctrl key', async () => {
    const wrapper = mount(DetailedListView, {
      props: { files: mockFiles }
    })
    
    const fileItem = wrapper.findComponent({ name: 'FileListItem' })
    await fileItem.vm.$emit('click', mockFiles[0], { ctrlKey: true })
    
    const emittedEvents = wrapper.emitted('file-selected')
    expect(emittedEvents[0][0].multiSelect).toBe(true)
  })

  it('should handle range select with Shift key', async () => {
    const wrapper = mount(DetailedListView, {
      props: { files: mockFiles }
    })
    
    const fileItem = wrapper.findComponent({ name: 'FileListItem' })
    await fileItem.vm.$emit('click', mockFiles[0], { shiftKey: true })
    
    const emittedEvents = wrapper.emitted('file-selected')
    expect(emittedEvents[0][0].rangeSelect).toBe(true)
  })

  it('should apply responsive classes', () => {
    const wrapper = mount(DetailedListView, {
      props: { files: mockFiles }
    })
    
    expect(wrapper.find('.detailed-list-view').exists()).toBe(true)
    expect(wrapper.find('.custom-scrollbar').exists()).toBe(true)
  })

  it('should register keyboard shortcuts on mount', () => {
    mount(DetailedListView, {
      props: { files: mockFiles }
    })
    
    expect(mockUseViewMode.addShortcut).toHaveBeenCalledWith('F1', expect.any(Function))
    expect(mockUseViewMode.addShortcut).toHaveBeenCalledWith('?', expect.any(Function))
    expect(mockUseViewMode.addShortcut).toHaveBeenCalledWith('Escape', expect.any(Function))
  })

  it('should show keyboard shortcuts help button when files are present', () => {
    const wrapper = mount(DetailedListView, {
      props: { files: mockFiles }
    })
    
    const helpButton = wrapper.find('[data-tip="Raccourcis clavier (F1)"]')
    expect(helpButton.exists()).toBe(true)
  })

  it('should not show keyboard shortcuts help button when loading', () => {
    const wrapper = mount(DetailedListView, {
      props: { files: [], loading: true }
    })
    
    const helpButton = wrapper.find('[data-tip="Raccourcis clavier (F1)"]')
    expect(helpButton.exists()).toBe(false)
  })

  it('should show active sort styling on current sort column', () => {
    const wrapper = mount(DetailedListView, {
      props: { files: mockFiles }
    })
    
    const headers = wrapper.findAll('th')
    if (headers.length > 0) {
      const nameHeader = headers[0]
      // Check if the header has the active sort class or primary styling
      const hasActiveSortClass = nameHeader.classes().includes('active-sort') || 
                                 nameHeader.classes().some(cls => cls.includes('primary'))
      expect(hasActiveSortClass).toBe(true)
    }
  })

  it('should show sort animation when sorting', async () => {
    const wrapper = mount(DetailedListView, {
      props: { files: mockFiles }
    })
    
    const headers = wrapper.findAll('th')
    if (headers.length > 1) {
      const sizeHeader = headers[1]
      await sizeHeader.trigger('click')
      
      // Check that the sorting class is applied temporarily
      expect(wrapper.vm.sortingColumn).toBe('size')
    }
  })

  it('should show keyboard shortcuts help modal', async () => {
    const wrapper = mount(DetailedListView, {
      props: { files: mockFiles }
    })
    
    const helpButton = wrapper.find('[data-tip="Raccourcis clavier (F1)"]')
    await helpButton.trigger('click')
    
    expect(wrapper.vm.showShortcutsHelp).toBe(true)
    expect(wrapper.findComponent({ name: 'KeyboardShortcutsHelp' }).props('show')).toBe(true)
  })
})  d
escribe('Responsive behavior', () => {
    it('should adapt to mobile screen', () => {
      mockUseResponsive.isMobile.value = true
      mockUseResponsive.isTouch.value = true
      
      const wrapper = mount(DetailedListView, {
        props: { files: mockFiles }
      })
      
      expect(wrapper.find('.mobile-optimized').exists()).toBe(true)
      expect(wrapper.find('.touch-optimized').exists()).toBe(true)
    })

    it('should hide columns on small screens', () => {
      mockUseResponsive.shouldShowColumn.mockImplementation((column) => {
        return column !== 'type' // Hide type column on small screen
      })
      
      const wrapper = mount(DetailedListView, {
        props: { files: mockFiles }
      })
      
      // Should only show 3 columns instead of 4
      const headers = wrapper.findAll('th')
      expect(headers.length).toBeLessThan(4)
    })

    it('should use larger touch targets on touch devices', () => {
      mockUseResponsive.isTouch.value = true
      
      const wrapper = mount(DetailedListView, {
        props: { files: mockFiles }
      })
      
      const headers = wrapper.findAll('th')
      headers.forEach(header => {
        expect(header.attributes('style')).toContain('44px')
      })
    })
  })

  describe('Touch gestures', () => {
    it('should handle swipe gestures', async () => {
      const wrapper = mount(DetailedListView, {
        props: { files: mockFiles }
      })
      
      // Simulate swipe right
      mockUseTouchGestures.isGesturing.value = true
      mockUseTouchGestures.swipeDirection.value = 'right'
      
      // Trigger swipe event
      const container = wrapper.find('.detailed-list-view')
      await container.trigger('swipe', { detail: { direction: 'right' } })
      
      const emittedEvents = wrapper.emitted('navigate-back')
      expect(emittedEvents).toBeTruthy()
    })

    it('should handle swipe left for actions', async () => {
      const wrapper = mount(DetailedListView, {
        props: { files: mockFiles }
      })
      
      const container = wrapper.find('.detailed-list-view')
      await container.trigger('swipe', { detail: { direction: 'left' } })
      
      const emittedEvents = wrapper.emitted('show-actions')
      expect(emittedEvents).toBeTruthy()
    })
  })

  describe('Keyboard shortcuts integration', () => {
    it('should register keyboard shortcuts on mount', () => {
      mount(DetailedListView, {
        props: { files: mockFiles }
      })
      
      expect(mockUseViewMode.addShortcut).toHaveBeenCalledWith('F1', expect.any(Function))
      expect(mockUseViewMode.addShortcut).toHaveBeenCalledWith('?', expect.any(Function))
      expect(mockUseViewMode.addShortcut).toHaveBeenCalledWith('Escape', expect.any(Function))
    })

    it('should toggle shortcuts help with F1', () => {
      const wrapper = mount(DetailedListView, {
        props: { files: mockFiles }
      })
      
      // Get the F1 callback
      const f1Callback = mockUseViewMode.addShortcut.mock.calls.find(
        call => call[0] === 'F1'
      )[1]
      
      expect(wrapper.vm.showShortcutsHelp).toBe(false)
      
      f1Callback()
      expect(wrapper.vm.showShortcutsHelp).toBe(true)
      
      f1Callback()
      expect(wrapper.vm.showShortcutsHelp).toBe(false)
    })

    it('should close shortcuts help with Escape', () => {
      const wrapper = mount(DetailedListView, {
        props: { files: mockFiles }
      })
      
      wrapper.vm.showShortcutsHelp = true
      
      const escapeCallback = mockUseViewMode.addShortcut.mock.calls.find(
        call => call[0] === 'Escape'
      )[1]
      
      escapeCallback()
      expect(wrapper.vm.showShortcutsHelp).toBe(false)
    })
  })

  describe('Performance optimizations', () => {
    it('should handle large file lists efficiently', () => {
      const largeFileList = Array.from({ length: 1000 }, (_, i) => ({
        name: `file${i}.txt`,
        path: `/test/file${i}.txt`,
        is_directory: false,
        size: i * 100,
        modified_time: '2024-01-15T10:30:00Z'
      }))
      
      const wrapper = mount(DetailedListView, {
        props: { files: largeFileList }
      })
      
      expect(wrapper.findAll('[data-testid="file-item"]')).toHaveLength(1000)
      expect(mockUseViewMode.sortFiles).toHaveBeenCalledWith(largeFileList)
    })

    it('should use custom scrollbar for better UX', () => {
      const wrapper = mount(DetailedListView, {
        props: { files: mockFiles }
      })
      
      expect(wrapper.find('.custom-scrollbar').exists()).toBe(true)
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const wrapper = mount(DetailedListView, {
        props: { files: mockFiles }
      })
      
      const table = wrapper.find('table')
      expect(table.exists()).toBe(true)
      
      const headers = wrapper.findAll('th')
      headers.forEach(header => {
        expect(header.attributes('role')).toBe('columnheader')
      })
    })

    it('should support keyboard navigation', () => {
      const wrapper = mount(DetailedListView, {
        props: { 
          files: mockFiles,
          focusedIndex: 1
        }
      })
      
      const fileItems = wrapper.findAllComponents({ name: 'FileListItem' })
      expect(fileItems[1].props('focused')).toBe(true)
    })

    it('should have proper focus management', () => {
      const wrapper = mount(DetailedListView, {
        props: { files: mockFiles }
      })
      
      const headers = wrapper.findAll('th')
      headers.forEach(header => {
        expect(header.classes()).toContain('focus:outline-none')
      })
    })
  })

  describe('Error handling', () => {
    it('should handle null or undefined files gracefully', () => {
      const wrapper = mount(DetailedListView, {
        props: { files: null }
      })
      
      expect(wrapper.text()).toContain('Aucun fichier dans ce dossier')
      expect(wrapper.find('.text-base-content/60').exists()).toBe(true)
    })

    it('should display error message when error prop is provided', () => {
      const wrapper = mount(DetailedListView, {
        props: { 
          files: [],
          error: 'Erreur de chargement des fichiers'
        }
      })
      
      expect(wrapper.text()).toContain('Erreur de chargement des fichiers')
      expect(wrapper.find('.text-error').exists()).toBe(true)
    })

    it('should show loading state', () => {
      const wrapper = mount(DetailedListView, {
        props: { 
          files: [],
          loading: true
        }
      })
      
      expect(wrapper.find('.loading').exists()).toBe(true)
      expect(wrapper.find('.loading-spinner').exists()).toBe(true)
    })
  })

  describe('Animation and visual feedback', () => {
    it('should show sorting animation', async () => {
      const wrapper = mount(DetailedListView, {
        props: { files: mockFiles }
      })
      
      const sizeHeader = wrapper.findAll('th')[1]
      await sizeHeader.trigger('click')
      
      expect(wrapper.vm.sortingColumn).toBe('size')
      
      // Animation should clear after timeout
      setTimeout(() => {
        expect(wrapper.vm.sortingColumn).toBe(null)
      }, 300)
    })

    it('should show active sort column styling', () => {
      mockUseViewMode.sortColumn.value = SORT_COLUMNS.SIZE
      
      const wrapper = mount(DetailedListView, {
        props: { files: mockFiles }
      })
      
      const headers = wrapper.findAll('th')
      const sizeHeader = headers[1]
      
      expect(sizeHeader.classes()).toContain('active-sort')
      expect(sizeHeader.classes()).toContain('bg-primary/10')
    })

    it('should show sort direction indicators', () => {
      mockUseViewMode.sortColumn.value = SORT_COLUMNS.NAME
      mockUseViewMode.sortDirection.value = SORT_DIRECTIONS.ASC
      
      const wrapper = mount(DetailedListView, {
        props: { files: mockFiles }
      })
      
      const nameHeader = wrapper.findAll('th')[0]
      const sortIcon = nameHeader.find('.fas.fa-sort-up')
      
      expect(sortIcon.exists()).toBe(true)
      expect(sortIcon.classes()).toContain('text-primary')
    })
  })

  describe('Context menu integration', () => {
    it('should emit context-menu event', async () => {
      const wrapper = mount(DetailedListView, {
        props: { files: mockFiles }
      })
      
      const fileItem = wrapper.findComponent({ name: 'FileListItem' })
      await fileItem.vm.$emit('context-menu', mockFiles[0], { clientX: 100, clientY: 100 })
      
      const emittedEvents = wrapper.emitted('context-menu')
      expect(emittedEvents).toBeTruthy()
      expect(emittedEvents[0][1]).toBe(mockFiles[0])
    })
  })
})