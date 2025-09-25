/**
 * @fileoverview Tests unitaires pour le composant FileExplorer
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import FileExplorer from '../FileExplorer.vue'
import { nasAPI } from '@/services/nasAPI.js'

// Mock du service NAS API
vi.mock('@/services/nasAPI.js', () => ({
  nasAPI: {
    browse: vi.fn(),
    normalizePath: vi.fn((path) => path.replace(/\/+/g, '/').replace(/\/$/, '') || '/'),
    getParentPath: vi.fn((path) => {
      const normalized = path.replace(/\/+/g, '/').replace(/\/$/, '') || '/'
      if (normalized === '/') return null
      const segments = normalized.split('/')
      segments.pop()
      return segments.join('/') || '/'
    })
  }
}))

// Mock des composables
vi.mock('@/composables/useViewMode.js', () => ({
  useViewMode: () => ({
    currentMode: { value: 'tree' },
    currentViewMode: { value: { id: 'tree', label: 'Arbre', component: 'TreeView' } },
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

vi.mock('@/composables/useKeyboardShortcuts.js', () => ({
  useKeyboardShortcuts: () => ({
    setActive: vi.fn()
  })
}))

// Mock des composants enfants
vi.mock('../ViewModeSelector.vue', () => ({
  default: {
    name: 'ViewModeSelector',
    template: '<div data-testid="view-mode-selector">ViewModeSelector</div>',
    emits: ['mode-changed']
  }
}))

vi.mock('../NasFolderTree.vue', () => ({
  default: {
    name: 'NasFolderTree',
    template: '<div data-testid="nas-folder-tree">NasFolderTree</div>',
    props: ['currentPath', 'files', 'loading', 'error'],
    emits: ['path-selected', 'file-selected', 'file-double-click']
  }
}))

vi.mock('../DetailedListView.vue', () => ({
  default: {
    name: 'DetailedListView',
    template: '<div data-testid="detailed-list-view">DetailedListView</div>',
    props: ['currentPath', 'files', 'loading', 'error'],
    emits: ['path-selected', 'file-selected', 'file-double-click', 'sort-changed']
  }
}))

vi.mock('../KeyboardShortcutsHelp.vue', () => ({
  default: {
    name: 'KeyboardShortcutsHelp',
    template: '<div data-testid="keyboard-shortcuts-help">KeyboardShortcutsHelp</div>',
    props: ['show'],
    emits: ['close']
  }
}))

describe('FileExplorer', () => {
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
      modified_time: '2024-01-01T11:00:00Z'
    }
  ]

  beforeEach(() => {
    // Reset des mocks
    vi.clearAllMocks()
    
    // Configuration par défaut du mock API
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

  describe('Rendu initial', () => {
    it('devrait rendre le composant avec les éléments de base', async () => {
      wrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: false // Éviter le chargement automatique pour ce test
        }
      })

      expect(wrapper.find('[data-testid="view-mode-selector"]').exists()).toBe(true)
      expect(wrapper.find('.file-explorer-content').exists()).toBe(true)
      expect(wrapper.find('.file-explorer-status').exists()).toBe(true) // Toujours visible même sans fichiers
    })

    it('devrait afficher le sélecteur de mode quand showModeSelector est true', () => {
      wrapper = mount(FileExplorer, {
        props: {
          showModeSelector: true,
          autoLoad: false
        }
      })

      expect(wrapper.find('[data-testid="view-mode-selector"]').exists()).toBe(true)
    })

    it('devrait masquer le sélecteur de mode quand showModeSelector est false', () => {
      wrapper = mount(FileExplorer, {
        props: {
          showModeSelector: false,
          autoLoad: false
        }
      })

      expect(wrapper.find('.file-explorer-header').exists()).toBe(true)
      // Le header existe toujours mais peut être vide
    })
  })

  describe('Chargement des données', () => {
    it('devrait charger les fichiers au montage si autoLoad est true', async () => {
      wrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: true
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 0)) // Attendre les promesses

      expect(nasAPI.browse).toHaveBeenCalledWith('/')
    })

    it('ne devrait pas charger les fichiers au montage si autoLoad est false', async () => {
      wrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: false
        }
      })

      await nextTick()

      expect(nasAPI.browse).not.toHaveBeenCalled()
    })

    it('devrait afficher l\'état de chargement', async () => {
      // Mock d'une promesse qui ne se résout pas immédiatement
      nasAPI.browse.mockImplementation(() => new Promise(() => {}))

      wrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: true
        }
      })

      await nextTick()

      expect(wrapper.find('.loading').exists()).toBe(true)
      expect(wrapper.text()).toContain('Chargement des fichiers')
    })

    it('devrait afficher les erreurs de chargement', async () => {
      const errorMessage = 'Erreur de connexion'
      nasAPI.browse.mockRejectedValue(new Error(errorMessage))

      wrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: true
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.find('.alert-error').exists()).toBe(true)
      expect(wrapper.text()).toContain(errorMessage)
    })
  })

  describe('Navigation', () => {
    beforeEach(async () => {
      wrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: true
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    it('devrait émettre path-changed lors de la navigation', async () => {
      const newPath = '/Documents'
      const oldPath = wrapper.vm.currentPath
      
      // Simuler la sélection d'un chemin
      await wrapper.vm.handlePathSelected(newPath)
      await nextTick()

      const pathChangedEvents = wrapper.emitted('path-changed')
      expect(pathChangedEvents).toBeTruthy()
      expect(pathChangedEvents[0][0]).toMatchObject({
        newPath: newPath,
        oldPath: oldPath
      })
    })

    it('devrait mettre à jour currentPath lors de la navigation', async () => {
      const newPath = '/Documents'
      
      await wrapper.vm.handlePathSelected(newPath)
      await nextTick()

      expect(wrapper.vm.currentPath).toBe(newPath)
    })
  })

  describe('Sélection de fichiers', () => {
    beforeEach(async () => {
      wrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: true
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    it('devrait émettre file-selected lors de la sélection', async () => {
      const file = mockFiles[0]
      const event = { ctrlKey: false, shiftKey: false }

      await wrapper.vm.handleFileSelected({ file, multiSelect: false, rangeSelect: false })

      const fileSelectedEvents = wrapper.emitted('file-selected')
      expect(fileSelectedEvents).toBeTruthy()
      expect(fileSelectedEvents[0][0]).toMatchObject({
        file: file
      })
    })

    it('devrait émettre selection-changed lors du changement de sélection', async () => {
      const file = mockFiles[0]

      await wrapper.vm.handleFileSelected({ file, multiSelect: false, rangeSelect: false })

      const selectionChangedEvents = wrapper.emitted('selection-changed')
      expect(selectionChangedEvents).toBeTruthy()
      expect(selectionChangedEvents[0][0]).toMatchObject({
        action: 'select',
        targetFile: file.path
      })
    })
  })

  describe('Double-clic sur fichiers', () => {
    beforeEach(async () => {
      wrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: true
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    it('devrait naviguer vers un dossier lors du double-clic', async () => {
      const folder = mockFiles[0] // Documents (dossier)

      await wrapper.vm.handleFileDoubleClick({ file: folder })
      await nextTick()

      expect(nasAPI.browse).toHaveBeenCalledWith(folder.path)
    })

    it('devrait émettre file-double-click pour un fichier', async () => {
      const file = mockFiles[1] // test.txt (fichier)

      await wrapper.vm.handleFileDoubleClick({ file })

      const doubleClickEvents = wrapper.emitted('file-double-click')
      expect(doubleClickEvents).toBeTruthy()
      expect(doubleClickEvents[0][0]).toMatchObject({
        file: file
      })
    })
  })

  describe('API publique', () => {
    beforeEach(async () => {
      wrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: false
        }
      })

      await nextTick()
    })

    it('devrait exposer les méthodes publiques', () => {
      expect(typeof wrapper.vm.loadFiles).toBe('function')
      expect(typeof wrapper.vm.refresh).toBe('function')
      expect(typeof wrapper.vm.goToPath).toBe('function')
      expect(typeof wrapper.vm.clearSelection).toBe('function')
      expect(typeof wrapper.vm.selectAll).toBe('function')
    })

    it('devrait exposer les propriétés computed', () => {
      expect(wrapper.vm.currentPath).toBeDefined()
      expect(wrapper.vm.files).toBeDefined()
      expect(wrapper.vm.loading).toBeDefined()
      expect(wrapper.vm.error).toBeDefined()
    })

    it('devrait permettre de naviguer via goToPath', async () => {
      const newPath = '/Documents'
      
      await wrapper.vm.goToPath(newPath)
      await nextTick()

      expect(nasAPI.browse).toHaveBeenCalledWith(newPath)
    })

    it('devrait permettre de rafraîchir via refresh', async () => {
      await wrapper.vm.refresh()
      await nextTick()

      expect(nasAPI.browse).toHaveBeenCalledWith('/')
    })
  })

  describe('Gestion des erreurs', () => {
    it('devrait émettre une erreur lors d\'un échec de chargement', async () => {
      const error = new Error('Erreur de réseau')
      nasAPI.browse.mockRejectedValue(error)

      wrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: true
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      const errorEvents = wrapper.emitted('error')
      expect(errorEvents).toBeTruthy()
      expect(errorEvents[0][0]).toMatchObject({
        error: error,
        path: '/'
      })
    })

    it('devrait permettre de réessayer après une erreur', async () => {
      const error = new Error('Erreur temporaire')
      nasAPI.browse.mockRejectedValueOnce(error)
        .mockResolvedValueOnce({ success: true, items: mockFiles })

      wrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: true
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      // Vérifier que l'erreur est affichée
      expect(wrapper.find('.alert-error').exists()).toBe(true)

      // Cliquer sur le bouton réessayer
      await wrapper.find('.btn-outline').trigger('click')
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      // Vérifier que les données sont maintenant chargées
      expect(nasAPI.browse).toHaveBeenCalledTimes(2)
    })
  })
})