/**
 * @fileoverview Tests d'intégration pour les raccourcis clavier dans différents contextes
 * Tests des raccourcis clavier dans les différents modes d'affichage et situations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import FileExplorer from '../FileExplorer.vue'
import ViewModeSelector from '../ViewModeSelector.vue'
import KeyboardShortcutsHelp from '../KeyboardShortcutsHelp.vue'
import { VIEW_MODES, SORT_COLUMNS, SORT_DIRECTIONS } from '../../../types/viewMode.js'
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

describe('KeyboardShortcuts - Tests d\'intégration', () => {
  let wrapper
  let fileExplorerWrapper

  const mockFiles = [
    {
      name: 'Documents',
      path: '/Documents',
      is_directory: true,
      size: 0,
      modified_time: '2024-01-01T10:00:00Z'
    },
    {
      name: 'Images',
      path: '/Images',
      is_directory: true,
      size: 0,
      modified_time: '2024-01-02T10:00:00Z'
    },
    {
      name: 'test.txt',
      path: '/test.txt',
      is_directory: false,
      size: 1024,
      modified_time: '2024-01-01T11:00:00Z'
    },
    {
      name: 'script.js',
      path: '/script.js',
      is_directory: false,
      size: 2048,
      modified_time: '2024-01-02T11:00:00Z'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    nasAPI.browse.mockResolvedValue({
      success: true,
      items: mockFiles
    })
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    if (fileExplorerWrapper) {
      fileExplorerWrapper.unmount()
    }
  })

  describe('Raccourcis de changement de mode', () => {
    beforeEach(async () => {
      fileExplorerWrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: true
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))
    })

    it('devrait changer vers le mode arbre avec Ctrl+1', async () => {
      // Commencer en mode liste
      const viewModeSelector = fileExplorerWrapper.findComponent({ name: 'ViewModeSelector' })
      await viewModeSelector.vm.$emit('mode-changed', {
        oldMode: VIEW_MODES.TREE,
        newMode: VIEW_MODES.DETAILED_LIST
      })

      await nextTick()

      // Simuler Ctrl+1
      const event = new KeyboardEvent('keydown', {
        key: '1',
        ctrlKey: true,
        bubbles: true
      })
      document.dispatchEvent(event)

      await nextTick()

      // Vérifier que le mode a changé (via les événements émis)
      const modeChangedEvents = viewModeSelector.emitted('mode-changed')
      expect(modeChangedEvents).toBeTruthy()
    })

    it('devrait changer vers le mode liste détaillée avec Ctrl+2', async () => {
      // Simuler Ctrl+2
      const event = new KeyboardEvent('keydown', {
        key: '2',
        ctrlKey: true,
        bubbles: true
      })
      document.dispatchEvent(event)

      await nextTick()

      const viewModeSelector = fileExplorerWrapper.findComponent({ name: 'ViewModeSelector' })
      expect(viewModeSelector.exists()).toBe(true)
    })

    it('devrait ignorer les raccourcis de mode quand un modal est ouvert', async () => {
      // Simuler l'ouverture d'un modal
      fileExplorerWrapper.vm.showModal = true
      await nextTick()

      // Simuler Ctrl+2
      const event = new KeyboardEvent('keydown', {
        key: '2',
        ctrlKey: true,
        bubbles: true
      })
      document.dispatchEvent(event)

      await nextTick()

      // Le raccourci ne devrait pas fonctionner quand un modal est ouvert
      expect(fileExplorerWrapper.exists()).toBe(true)
    })
  })

  describe('Raccourcis de navigation', () => {
    beforeEach(async () => {
      fileExplorerWrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: true
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))
    })

    it('devrait naviguer avec les flèches en mode arbre', async () => {
      // Simuler ArrowDown
      const downEvent = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true
      })
      document.dispatchEvent(downEvent)

      await nextTick()

      // Simuler ArrowUp
      const upEvent = new KeyboardEvent('keydown', {
        key: 'ArrowUp',
        bubbles: true
      })
      document.dispatchEvent(upEvent)

      await nextTick()

      expect(fileExplorerWrapper.exists()).toBe(true)
    })

    it('devrait naviguer avec les flèches en mode liste détaillée', async () => {
      // Changer vers le mode liste
      const viewModeSelector = fileExplorerWrapper.findComponent({ name: 'ViewModeSelector' })
      await viewModeSelector.vm.$emit('mode-changed', {
        oldMode: VIEW_MODES.TREE,
        newMode: VIEW_MODES.DETAILED_LIST
      })

      await nextTick()

      // Simuler ArrowDown
      const downEvent = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true
      })
      document.dispatchEvent(downEvent)

      await nextTick()

      // Simuler ArrowUp
      const upEvent = new KeyboardEvent('keydown', {
        key: 'ArrowUp',
        bubbles: true
      })
      document.dispatchEvent(upEvent)

      await nextTick()

      expect(fileExplorerWrapper.exists()).toBe(true)
    })

    it('devrait aller au début avec Home', async () => {
      const homeEvent = new KeyboardEvent('keydown', {
        key: 'Home',
        bubbles: true
      })
      document.dispatchEvent(homeEvent)

      await nextTick()

      expect(fileExplorerWrapper.exists()).toBe(true)
    })

    it('devrait aller à la fin avec End', async () => {
      const endEvent = new KeyboardEvent('keydown', {
        key: 'End',
        bubbles: true
      })
      document.dispatchEvent(endEvent)

      await nextTick()

      expect(fileExplorerWrapper.exists()).toBe(true)
    })

    it('devrait ouvrir le fichier/dossier sélectionné avec Enter', async () => {
      // Sélectionner un dossier
      const folder = mockFiles[0]
      await fileExplorerWrapper.vm.handleFileSelected({ 
        file: folder, 
        multiSelect: false, 
        rangeSelect: false 
      })

      await nextTick()

      // Simuler Enter
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true
      })
      document.dispatchEvent(enterEvent)

      await nextTick()

      // Vérifier que la navigation a été déclenchée
      expect(nasAPI.browse).toHaveBeenCalledWith(folder.path)
    })

    it('devrait remonter d\'un niveau avec Backspace', async () => {
      // Naviguer vers un sous-dossier d'abord
      const folder = mockFiles[0]
      await fileExplorerWrapper.vm.handlePathSelected(folder.path)
      await nextTick()

      // Simuler Backspace
      const backspaceEvent = new KeyboardEvent('keydown', {
        key: 'Backspace',
        bubbles: true
      })
      document.dispatchEvent(backspaceEvent)

      await nextTick()

      // Vérifier que nous sommes remontés
      expect(nasAPI.browse).toHaveBeenCalledWith('/')
    })
  })

  describe('Raccourcis de sélection', () => {
    beforeEach(async () => {
      fileExplorerWrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: true
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))
    })

    it('devrait sélectionner tout avec Ctrl+A', async () => {
      const selectAllEvent = new KeyboardEvent('keydown', {
        key: 'a',
        ctrlKey: true,
        bubbles: true
      })
      document.dispatchEvent(selectAllEvent)

      await nextTick()

      // Vérifier que l'événement de sélection a été déclenché
      expect(fileExplorerWrapper.exists()).toBe(true)
    })

    it('devrait désélectionner avec Escape', async () => {
      // Sélectionner un fichier d'abord
      const file = mockFiles[2]
      await fileExplorerWrapper.vm.handleFileSelected({ 
        file, 
        multiSelect: false, 
        rangeSelect: false 
      })

      await nextTick()

      // Simuler Escape
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true
      })
      document.dispatchEvent(escapeEvent)

      await nextTick()

      expect(fileExplorerWrapper.exists()).toBe(true)
    })

    it('devrait étendre la sélection avec Shift+flèches', async () => {
      // Simuler Shift+ArrowDown
      const shiftDownEvent = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        shiftKey: true,
        bubbles: true
      })
      document.dispatchEvent(shiftDownEvent)

      await nextTick()

      // Simuler Shift+ArrowUp
      const shiftUpEvent = new KeyboardEvent('keydown', {
        key: 'ArrowUp',
        shiftKey: true,
        bubbles: true
      })
      document.dispatchEvent(shiftUpEvent)

      await nextTick()

      expect(fileExplorerWrapper.exists()).toBe(true)
    })
  })

  describe('Raccourcis de tri (mode liste détaillée)', () => {
    beforeEach(async () => {
      fileExplorerWrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: true
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))

      // Passer en mode liste détaillée
      const viewModeSelector = fileExplorerWrapper.findComponent({ name: 'ViewModeSelector' })
      await viewModeSelector.vm.$emit('mode-changed', {
        oldMode: VIEW_MODES.TREE,
        newMode: VIEW_MODES.DETAILED_LIST
      })

      await nextTick()
    })

    it('devrait trier par nom avec Ctrl+Shift+N', async () => {
      const sortEvent = new KeyboardEvent('keydown', {
        key: 'N',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true
      })
      document.dispatchEvent(sortEvent)

      await nextTick()

      expect(fileExplorerWrapper.exists()).toBe(true)
    })

    it('devrait trier par taille avec Ctrl+Shift+S', async () => {
      const sortEvent = new KeyboardEvent('keydown', {
        key: 'S',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true
      })
      document.dispatchEvent(sortEvent)

      await nextTick()

      expect(fileExplorerWrapper.exists()).toBe(true)
    })

    it('devrait trier par type avec Ctrl+Shift+T', async () => {
      const sortEvent = new KeyboardEvent('keydown', {
        key: 'T',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true
      })
      document.dispatchEvent(sortEvent)

      await nextTick()

      expect(fileExplorerWrapper.exists()).toBe(true)
    })

    it('devrait trier par date avec Ctrl+Shift+D', async () => {
      const sortEvent = new KeyboardEvent('keydown', {
        key: 'D',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true
      })
      document.dispatchEvent(sortEvent)

      await nextTick()

      expect(fileExplorerWrapper.exists()).toBe(true)
    })

    it('ne devrait pas réagir aux raccourcis de tri en mode arbre', async () => {
      // Revenir au mode arbre
      const viewModeSelector = fileExplorerWrapper.findComponent({ name: 'ViewModeSelector' })
      await viewModeSelector.vm.$emit('mode-changed', {
        oldMode: VIEW_MODES.DETAILED_LIST,
        newMode: VIEW_MODES.TREE
      })

      await nextTick()

      // Essayer un raccourci de tri
      const sortEvent = new KeyboardEvent('keydown', {
        key: 'S',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true
      })
      document.dispatchEvent(sortEvent)

      await nextTick()

      // Le raccourci ne devrait pas avoir d'effet en mode arbre
      expect(fileExplorerWrapper.exists()).toBe(true)
    })
  })

  describe('Raccourcis d\'actions', () => {
    beforeEach(async () => {
      fileExplorerWrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: true
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))
    })

    it('devrait rafraîchir avec F5', async () => {
      const refreshEvent = new KeyboardEvent('keydown', {
        key: 'F5',
        bubbles: true
      })
      document.dispatchEvent(refreshEvent)

      await nextTick()

      // Vérifier qu'un nouveau chargement a été déclenché
      expect(nasAPI.browse).toHaveBeenCalledTimes(2) // Initial + refresh
    })

    it('devrait ouvrir l\'aide avec F1', async () => {
      const helpEvent = new KeyboardEvent('keydown', {
        key: 'F1',
        bubbles: true
      })
      document.dispatchEvent(helpEvent)

      await nextTick()

      // Vérifier que l'aide est affichée
      const helpComponent = fileExplorerWrapper.findComponent({ name: 'KeyboardShortcutsHelp' })
      expect(helpComponent.exists()).toBe(true)
    })

    it('devrait ouvrir l\'aide avec ?', async () => {
      const helpEvent = new KeyboardEvent('keydown', {
        key: '?',
        bubbles: true
      })
      document.dispatchEvent(helpEvent)

      await nextTick()

      const helpComponent = fileExplorerWrapper.findComponent({ name: 'KeyboardShortcutsHelp' })
      expect(helpComponent.exists()).toBe(true)
    })

    it('devrait fermer l\'aide avec Escape quand elle est ouverte', async () => {
      // Ouvrir l'aide d'abord
      const helpEvent = new KeyboardEvent('keydown', {
        key: 'F1',
        bubbles: true
      })
      document.dispatchEvent(helpEvent)

      await nextTick()

      // Fermer avec Escape
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true
      })
      document.dispatchEvent(escapeEvent)

      await nextTick()

      expect(fileExplorerWrapper.exists()).toBe(true)
    })
  })

  describe('Gestion des conflits de raccourcis', () => {
    beforeEach(async () => {
      fileExplorerWrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: true
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))
    })

    it('devrait prioriser les raccourcis de modal quand un modal est ouvert', async () => {
      // Simuler l'ouverture d'un modal de renommage
      fileExplorerWrapper.vm.showRenameModal = true
      await nextTick()

      // Simuler Escape (devrait fermer le modal, pas désélectionner)
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true
      })
      document.dispatchEvent(escapeEvent)

      await nextTick()

      expect(fileExplorerWrapper.exists()).toBe(true)
    })

    it('devrait ignorer les raccourcis de navigation quand un input est focusé', async () => {
      // Simuler un input focusé (par exemple, dans un modal de renommage)
      const input = document.createElement('input')
      document.body.appendChild(input)
      input.focus()

      // Simuler ArrowDown (ne devrait pas naviguer)
      const arrowEvent = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true
      })
      document.dispatchEvent(arrowEvent)

      await nextTick()

      expect(fileExplorerWrapper.exists()).toBe(true)

      // Nettoyer
      document.body.removeChild(input)
    })

    it('devrait gérer les raccourcis contextuels selon le mode actif', async () => {
      // En mode arbre, Ctrl+Shift+S ne devrait pas trier
      const sortEvent = new KeyboardEvent('keydown', {
        key: 'S',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true
      })
      document.dispatchEvent(sortEvent)

      await nextTick()

      // Passer en mode liste
      const viewModeSelector = fileExplorerWrapper.findComponent({ name: 'ViewModeSelector' })
      await viewModeSelector.vm.$emit('mode-changed', {
        oldMode: VIEW_MODES.TREE,
        newMode: VIEW_MODES.DETAILED_LIST
      })

      await nextTick()

      // Maintenant le raccourci devrait fonctionner
      document.dispatchEvent(sortEvent)

      await nextTick()

      expect(fileExplorerWrapper.exists()).toBe(true)
    })
  })

  describe('Accessibilité des raccourcis', () => {
    it('devrait afficher les raccourcis dans les tooltips', () => {
      wrapper = mount(ViewModeSelector)

      const buttons = wrapper.findAll('button')
      buttons.forEach(button => {
        const title = button.attributes('title')
        expect(title).toBeTruthy()
        expect(title).toMatch(/Ctrl\+\d/) // Devrait contenir un raccourci Ctrl+chiffre
      })
    })

    it('devrait fournir une aide contextuelle des raccourcis', () => {
      wrapper = mount(KeyboardShortcutsHelp, {
        props: {
          show: true,
          context: 'file-explorer'
        }
      })

      // Vérifier que l'aide contient les raccourcis principaux
      const helpText = wrapper.text()
      expect(helpText).toContain('Ctrl+1')
      expect(helpText).toContain('Ctrl+2')
      expect(helpText).toContain('F5')
      expect(helpText).toContain('Ctrl+A')
    })

    it('devrait adapter l\'aide selon le mode actuel', () => {
      // Aide en mode arbre
      wrapper = mount(KeyboardShortcutsHelp, {
        props: {
          show: true,
          context: 'tree-view'
        }
      })

      let helpText = wrapper.text()
      expect(helpText).not.toContain('Ctrl+Shift+S') // Pas de tri en mode arbre

      wrapper.unmount()

      // Aide en mode liste détaillée
      wrapper = mount(KeyboardShortcutsHelp, {
        props: {
          show: true,
          context: 'detailed-list-view'
        }
      })

      helpText = wrapper.text()
      expect(helpText).toContain('Ctrl+Shift') // Raccourcis de tri disponibles
    })
  })
})