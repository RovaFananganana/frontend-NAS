/**
 * @fileoverview Tests d'intégration pour les raccourcis clavier du FileExplorer
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
    props: ['currentPath', 'files', 'loading', 'error', 'focusedIndex'],
    emits: ['path-selected', 'file-selected', 'file-double-click']
  }
}))

vi.mock('../DetailedListView.vue', () => ({
  default: {
    name: 'DetailedListView',
    template: '<div data-testid="detailed-list-view">DetailedListView</div>',
    props: ['currentPath', 'files', 'loading', 'error', 'focusedIndex'],
    emits: ['path-selected', 'file-selected', 'file-double-click', 'sort-changed']
  }
}))

vi.mock('../KeyboardShortcutsHelp.vue', () => ({
  default: {
    name: 'KeyboardShortcutsHelp',
    template: '<div data-testid="keyboard-shortcuts-help" v-if="show">Help</div>',
    props: ['show'],
    emits: ['close']
  }
}))

describe('FileExplorer - Raccourcis Clavier', () => {
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
    },
    {
      name: 'image.jpg',
      path: '/image.jpg',
      is_directory: false,
      size: 2048,
      modified_time: '2024-01-01T12:00:00Z'
    }
  ]

  beforeEach(async () => {
    vi.clearAllMocks()
    
    nasAPI.browse.mockResolvedValue({
      success: true,
      items: mockFiles
    })

    wrapper = mount(FileExplorer, {
      props: {
        initialPath: '/',
        autoLoad: true
      }
    })

    // Attendre le chargement initial
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('Raccourcis de navigation', () => {
    it('devrait avoir un index de focus initial', async () => {
      // Vérifier que l'index de focus est initialisé
      expect(wrapper.vm.focusedIndex).toBeDefined()
    })

    it('devrait remonter d\'un niveau avec Backspace', async () => {
      // Simuler qu'on est dans un sous-dossier
      await wrapper.vm.handlePathSelected('/Documents')
      nasAPI.getParentPath.mockReturnValue('/')

      const backspaceEvent = new KeyboardEvent('keydown', {
        key: 'Backspace',
        bubbles: true
      })

      document.dispatchEvent(backspaceEvent)
      await nextTick()

      expect(nasAPI.browse).toHaveBeenCalledWith('/')
    })
  })

  describe('Raccourcis de sélection', () => {
    it('devrait avoir une méthode selectAll disponible', async () => {
      expect(typeof wrapper.vm.selectAll).toBe('function')
      
      // Tester la méthode directement
      wrapper.vm.selectAll()
      await nextTick()

      expect(wrapper.vm.selectedFiles).toHaveLength(3)
      expect(wrapper.vm.selectedFiles).toContain('/Documents')
      expect(wrapper.vm.selectedFiles).toContain('/test.txt')
      expect(wrapper.vm.selectedFiles).toContain('/image.jpg')
    })

    it('devrait tout désélectionner avec Escape', async () => {
      // D'abord sélectionner quelque chose via la méthode appropriée
      const file = mockFiles[0]
      wrapper.vm.handleKeyboardClick(file, { ctrlKey: false, metaKey: false, shiftKey: false })
      await nextTick()

      expect(wrapper.vm.selectedFiles).toHaveLength(1)

      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true
      })

      document.dispatchEvent(escapeEvent)
      await nextTick()

      expect(wrapper.vm.selectedFiles).toHaveLength(0)
    })
  })

  describe('Raccourcis d\'actions', () => {
    it('devrait avoir une méthode refresh disponible', async () => {
      expect(typeof wrapper.vm.refresh).toBe('function')
      
      const initialCallCount = nasAPI.browse.mock.calls.length

      await wrapper.vm.refresh()
      await nextTick()

      expect(nasAPI.browse).toHaveBeenCalledTimes(initialCallCount + 1)
      expect(nasAPI.browse).toHaveBeenLastCalledWith('/')
    })

    it('devrait afficher l\'aide avec F1', async () => {
      expect(wrapper.vm.showShortcutsHelp).toBe(false)

      const f1Event = new KeyboardEvent('keydown', {
        key: 'F1',
        bubbles: true
      })

      document.dispatchEvent(f1Event)
      await nextTick()

      expect(wrapper.vm.showShortcutsHelp).toBe(true)
    })

    it('devrait afficher l\'aide avec ?', async () => {
      expect(wrapper.vm.showShortcutsHelp).toBe(false)

      const questionEvent = new KeyboardEvent('keydown', {
        key: '?',
        bubbles: true
      })

      document.dispatchEvent(questionEvent)
      await nextTick()

      expect(wrapper.vm.showShortcutsHelp).toBe(true)
    })

    it('devrait pouvoir contrôler l\'affichage de l\'aide', async () => {
      // Vérifier que showShortcutsHelp est accessible
      expect(wrapper.vm.showShortcutsHelp).toBeDefined()
      
      // L'aide devrait être fermée par défaut
      expect(wrapper.vm.showShortcutsHelp).toBe(false)
    })
  })

  describe('Intégration avec les composants enfants', () => {
    it('devrait passer l\'index de focus aux composants enfants', async () => {
      const detailedListView = wrapper.findComponent({ name: 'DetailedListView' })
      expect(detailedListView.exists()).toBe(true)
      expect(detailedListView.props('focusedIndex')).toBeDefined()
    })

    it('devrait émettre les événements de sélection', async () => {
      const file = mockFiles[0]
      
      // Simuler une sélection via la navigation clavier
      wrapper.vm.handleKeyboardClick(file, { ctrlKey: false, metaKey: false, shiftKey: false })
      await nextTick()

      const selectionEvents = wrapper.emitted('selection-changed')
      expect(selectionEvents).toBeTruthy()
      expect(selectionEvents[0][0]).toMatchObject({
        action: 'select'
      })
    })
  })

  describe('Gestion du focus', () => {
    it('devrait avoir un index de focus accessible', async () => {
      expect(wrapper.vm.focusedIndex).toBeDefined()
      expect(typeof wrapper.vm.focusedIndex).toBe('number')
    })

    it('devrait pouvoir changer de dossier', async () => {
      // Simuler la navigation vers un nouveau dossier
      await wrapper.vm.handlePathSelected('/Documents')
      await nextTick()

      expect(nasAPI.browse).toHaveBeenCalledWith('/Documents')
    })
  })

  describe('Accessibilité', () => {
    it('devrait avoir les méthodes de navigation nécessaires', async () => {
      // Vérifier que les méthodes essentielles sont disponibles
      expect(typeof wrapper.vm.handleKeyboardClick).toBe('function')
      expect(typeof wrapper.vm.handleKeyboardDoubleClick).toBe('function')
      expect(typeof wrapper.vm.clearSelection).toBe('function')
      expect(typeof wrapper.vm.selectAll).toBe('function')
    })

    it('devrait permettre la sélection et l\'ouverture de fichiers', async () => {
      const file = mockFiles[0]
      
      // Sélectionner un fichier
      wrapper.vm.handleKeyboardClick(file, { ctrlKey: false, metaKey: false, shiftKey: false })
      await nextTick()
      
      expect(wrapper.vm.selectedFiles).toContain('/Documents')

      // Double-cliquer pour ouvrir
      wrapper.vm.handleKeyboardDoubleClick(file, {})
      await nextTick()

      // Vérifier qu'un événement d'ouverture a été émis ou qu'une navigation a eu lieu
      const pathChangedEvents = wrapper.emitted('path-changed')
      expect(pathChangedEvents).toBeTruthy()
    })
  })
})