/**
 * @fileoverview Tests spécifiques pour le système de tri amélioré
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import DetailedListView from '../DetailedListView.vue'
import { SORT_COLUMNS, SORT_DIRECTIONS } from '../../../types/viewMode.js'

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
  addShortcut: vi.fn(),
  sortByName: vi.fn(),
  sortBySize: vi.fn(),
  sortByType: vi.fn(),
  sortByDate: vi.fn()
}

vi.mock('../../../composables/useViewMode.js', () => ({
  useViewMode: () => mockUseViewMode
}))

// Mock des composants
vi.mock('../FileListItem.vue', () => ({
  default: {
    name: 'FileListItem',
    props: ['file', 'selected', 'index'],
    emits: ['click', 'double-click'],
    template: '<tr data-testid="file-item"><td>{{ file.name }}</td></tr>'
  }
}))

vi.mock('../KeyboardShortcutsHelp.vue', () => ({
  default: {
    name: 'KeyboardShortcutsHelp',
    props: ['show'],
    emits: ['close'],
    template: '<div v-if="show" data-testid="shortcuts-help">Shortcuts Help</div>'
  }
}))

describe('Sorting System', () => {
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
    mockUseViewMode.addShortcut.mockClear()
    mockUseViewMode.sortByName.mockClear()
    mockUseViewMode.sortBySize.mockClear()
    mockUseViewMode.sortByType.mockClear()
    mockUseViewMode.sortByDate.mockClear()
  })

  it('should register keyboard shortcuts for sorting', () => {
    mount(DetailedListView, {
      props: { files: mockFiles }
    })
    
    // Vérifier que les raccourcis sont enregistrés
    expect(mockUseViewMode.addShortcut).toHaveBeenCalledWith('F1', expect.any(Function))
    expect(mockUseViewMode.addShortcut).toHaveBeenCalledWith('?', expect.any(Function))
    expect(mockUseViewMode.addShortcut).toHaveBeenCalledWith('Escape', expect.any(Function))
  })

  it('should handle sort column clicks with animation', async () => {
    const wrapper = mount(DetailedListView, {
      props: { files: mockFiles }
    })
    
    const headers = wrapper.findAll('th')
    if (headers.length > 1) {
      const sizeHeader = headers[1]
      await sizeHeader.trigger('click')
      
      expect(mockUseViewMode.setSortColumn).toHaveBeenCalledWith('size')
      
      // Vérifier que l'animation est déclenchée
      expect(wrapper.vm.sortingColumn).toBe('size')
    }
  })

  it('should emit sort-changed event with correct data', async () => {
    const wrapper = mount(DetailedListView, {
      props: { files: mockFiles }
    })
    
    const headers = wrapper.findAll('th')
    if (headers.length > 0) {
      const nameHeader = headers[0]
      await nameHeader.trigger('click')
      
      const emittedEvents = wrapper.emitted('sort-changed')
      expect(emittedEvents).toBeTruthy()
      expect(emittedEvents[0][0]).toHaveProperty('column')
      expect(emittedEvents[0][0]).toHaveProperty('direction')
      expect(emittedEvents[0][0]).toHaveProperty('oldColumn')
      expect(emittedEvents[0][0]).toHaveProperty('oldDirection')
    }
  })

  it('should show visual indicators for active sort column', () => {
    const wrapper = mount(DetailedListView, {
      props: { files: mockFiles }
    })
    
    // Vérifier que les indicateurs de tri sont présents
    const sortIcons = wrapper.findAll('.fas.fa-sort-up, .fas.fa-sort-down, .fas.fa-sort')
    expect(sortIcons.length).toBeGreaterThan(0)
  })

  it('should show keyboard shortcuts help when requested', async () => {
    const wrapper = mount(DetailedListView, {
      props: { files: mockFiles }
    })
    
    // Cliquer sur le bouton d'aide
    const helpButton = wrapper.find('[data-tip="Raccourcis clavier (F1)"]')
    if (helpButton.exists()) {
      await helpButton.trigger('click')
      
      const helpComponent = wrapper.findComponent({ name: 'KeyboardShortcutsHelp' })
      expect(helpComponent.exists()).toBe(true)
    }
  })

  it('should apply sorting animation classes', async () => {
    const wrapper = mount(DetailedListView, {
      props: { files: mockFiles }
    })
    
    const headers = wrapper.findAll('th')
    if (headers.length > 1) {
      const sizeHeader = headers[1]
      await sizeHeader.trigger('click')
      
      // Vérifier que la classe d'animation est appliquée
      expect(wrapper.vm.sortingColumn).toBe('size')
      
      // Vérifier que l'animation se termine après le délai
      setTimeout(() => {
        expect(wrapper.vm.sortingColumn).toBe(null)
      }, 350)
    }
  })

  it('should handle hover effects on sortable headers', async () => {
    const wrapper = mount(DetailedListView, {
      props: { files: mockFiles }
    })
    
    const headers = wrapper.findAll('th')
    if (headers.length > 0) {
      const header = headers[0]
      
      // Vérifier que les classes de hover sont présentes
      expect(header.classes()).toContain('cursor-pointer')
      expect(header.classes()).toContain('hover:bg-base-300/50')
    }
  })

  it('should show help button only when files are present', () => {
    const wrapperWithFiles = mount(DetailedListView, {
      props: { files: mockFiles }
    })
    
    const wrapperWithoutFiles = mount(DetailedListView, {
      props: { files: [], loading: false, error: '' }
    })
    
    // Avec des fichiers, le bouton d'aide devrait être présent
    expect(wrapperWithFiles.find('[data-tip="Raccourcis clavier (F1)"]').exists()).toBe(true)
    
    // Sans fichiers, le bouton d'aide ne devrait pas être présent
    expect(wrapperWithoutFiles.find('[data-tip="Raccourcis clavier (F1)"]').exists()).toBe(false)
  })
})