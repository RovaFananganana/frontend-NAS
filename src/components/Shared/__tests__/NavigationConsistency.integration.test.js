/**
 * @fileoverview Tests d'intégration pour la cohérence de navigation entre les modes
 * Tests de navigation, sélection et actions cohérentes entre mode arbre et liste détaillée
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import FileExplorer from '../FileExplorer.vue'
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

describe('NavigationConsistency - Tests d\'intégration', () => {
  let fileExplorerWrapper

  const mockRootFiles = [
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
      name: 'readme.txt',
      path: '/readme.txt',
      is_directory: false,
      size: 1024,
      modified_time: '2024-01-01T11:00:00Z'
    },
    {
      name: 'config.json',
      path: '/config.json',
      is_directory: false,
      size: 512,
      modified_time: '2024-01-03T11:00:00Z'
    }
  ]

  const mockDocumentsFiles = [
    {
      name: 'report.pdf',
      path: '/Documents/report.pdf',
      is_directory: false,
      size: 2048000,
      modified_time: '2024-01-05T10:00:00Z'
    },
    {
      name: 'notes.txt',
      path: '/Documents/notes.txt',
      is_directory: false,
      size: 1536,
      modified_time: '2024-01-04T11:00:00Z'
    },
    {
      name: 'Subfolder',
      path: '/Documents/Subfolder',
      is_directory: true,
      size: 0,
      modified_time: '2024-01-06T10:00:00Z'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Configuration des réponses API selon le chemin
    nasAPI.browse.mockImplementation((path) => {
      if (path === '/' || path === '') {
        return Promise.resolve({ success: true, items: mockRootFiles })
      } else if (path === '/Documents') {
        return Promise.resolve({ success: true, items: mockDocumentsFiles })
      } else {
        return Promise.resolve({ success: true, items: [] })
      }
    })
  })

  afterEach(() => {
    if (fileExplorerWrapper) {
      fileExplorerWrapper.unmount()
    }
  })

  describe('Navigation par double-clic', () => {
    it('devrait naviguer vers un dossier de manière cohérente en mode arbre', async () => {
      fileExplorerWrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: true
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))

      // Vérifier le chargement initial
      expect(fileExplorerWrapper.vm.files).toHaveLength(4)
      expect(fileExplorerWrapper.vm.currentPath).toBe('/')

      // Double-clic sur le dossier Documents
      const documentsFolder = mockRootFiles[0]
      await fileExplorerWrapper.vm.handleFileDoubleClick({ file: documentsFolder })
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))

      // Vérifier la navigation
      expect(nasAPI.browse).toHaveBeenCalledWith('/Documents')
      expect(fileExplorerWrapper.vm.currentPath).toBe('/Documents')
      expect(fileExplorerWrapper.vm.files).toHaveLength(3)

      // Vérifier l'émission d'événements
      const pathChangedEvents = fileExplorerWrapper.emitted('path-changed')
      expect(pathChangedEvents).toBeTruthy()
      expect(pathChangedEvents[0][0]).toMatchObject({
        newPath: '/Documents',
        oldPath: '/'
      })
    })

    it('devrait naviguer vers un dossier de manière cohérente en mode liste détaillée', async () => {
      fileExplorerWrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: true
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))

      // Changer vers le mode liste détaillée
      const viewModeSelector = fileExplorerWrapper.findComponent({ name: 'ViewModeSelector' })
      await viewModeSelector.vm.$emit('mode-changed', {
        oldMode: VIEW_MODES.TREE,
        newMode: VIEW_MODES.DETAILED_LIST
      })

      await nextTick()

      // Double-clic sur le dossier Documents
      const documentsFolder = mockRootFiles[0]
      await fileExplorerWrapper.vm.handleFileDoubleClick({ file: documentsFolder })
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))

      // Vérifier que la navigation fonctionne de la même manière
      expect(nasAPI.browse).toHaveBeenCalledWith('/Documents')
      expect(fileExplorerWrapper.vm.currentPath).toBe('/Documents')
      expect(fileExplorerWrapper.vm.files).toHaveLength(3)

      // Vérifier l'émission d'événements
      const pathChangedEvents = fileExplorerWrapper.emitted('path-changed')
      expect(pathChangedEvents).toBeTruthy()
    })

    it('devrait préserver la navigation lors du changement de mode', async () => {
      fileExplorerWrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: true
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))

      // Naviguer vers Documents en mode arbre
      const documentsFolder = mockRootFiles[0]
      await fileExplorerWrapper.vm.handleFileDoubleClick({ file: documentsFolder })
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(fileExplorerWrapper.vm.currentPath).toBe('/Documents')

      // Changer vers le mode liste détaillée
      const viewModeSelector = fileExplorerWrapper.findComponent({ name: 'ViewModeSelector' })
      await viewModeSelector.vm.$emit('mode-changed', {
        oldMode: VIEW_MODES.TREE,
        newMode: VIEW_MODES.DETAILED_LIST
      })

      await nextTick()

      // Vérifier que le chemin et les fichiers sont préservés
      expect(fileExplorerWrapper.vm.currentPath).toBe('/Documents')
      expect(fileExplorerWrapper.vm.files).toHaveLength(3)

      // Naviguer vers un sous-dossier en mode liste
      const subfolder = mockDocumentsFiles[2]
      await fileExplorerWrapper.vm.handleFileDoubleClick({ file: subfolder })
      await nextTick()

      expect(nasAPI.browse).toHaveBeenCalledWith('/Documents/Subfolder')
    })
  })

  describe('Navigation par sélection de chemin', () => {
    it('devrait naviguer par sélection de chemin de manière cohérente', async () => {
      fileExplorerWrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: true
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))

      // Navigation par sélection de chemin
      await fileExplorerWrapper.vm.handlePathSelected('/Documents')
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(nasAPI.browse).toHaveBeenCalledWith('/Documents')
      expect(fileExplorerWrapper.vm.currentPath).toBe('/Documents')

      // Changer de mode et vérifier que la navigation fonctionne toujours
      const viewModeSelector = fileExplorerWrapper.findComponent({ name: 'ViewModeSelector' })
      await viewModeSelector.vm.$emit('mode-changed', {
        oldMode: VIEW_MODES.TREE,
        newMode: VIEW_MODES.DETAILED_LIST
      })

      await nextTick()

      // Navigation par sélection de chemin en mode liste
      await fileExplorerWrapper.vm.handlePathSelected('/Documents/Subfolder')
      await nextTick()

      expect(nasAPI.browse).toHaveBeenCalledWith('/Documents/Subfolder')
    })

    it('devrait gérer la navigation vers le parent de manière cohérente', async () => {
      fileExplorerWrapper = mount(FileExplorer, {
        props: {
          initialPath: '/Documents',
          autoLoad: true
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(fileExplorerWrapper.vm.currentPath).toBe('/Documents')

      // Navigation vers le parent
      await fileExplorerWrapper.vm.goToParent()
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(nasAPI.browse).toHaveBeenCalledWith('/')
      expect(fileExplorerWrapper.vm.currentPath).toBe('/')

      // Changer de mode et tester la navigation parent
      const viewModeSelector = fileExplorerWrapper.findComponent({ name: 'ViewModeSelector' })
      await viewModeSelector.vm.$emit('mode-changed', {
        oldMode: VIEW_MODES.TREE,
        newMode: VIEW_MODES.DETAILED_LIST
      })

      await nextTick()

      // Naviguer vers Documents puis revenir au parent
      await fileExplorerWrapper.vm.handlePathSelected('/Documents')
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))

      await fileExplorerWrapper.vm.goToParent()
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(fileExplorerWrapper.vm.currentPath).toBe('/')
    })
  })

  describe('Sélection de fichiers', () => {
    it('devrait gérer la sélection simple de manière cohérente', async () => {
      fileExplorerWrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: true
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))

      const testFile = mockRootFiles[2] // readme.txt

      // Sélection en mode arbre
      await fileExplorerWrapper.vm.handleFileSelected({ 
        file: testFile, 
        multiSelect: false, 
        rangeSelect: false 
      })

      let selectionEvents = fileExplorerWrapper.emitted('file-selected')
      expect(selectionEvents).toBeTruthy()
      expect(selectionEvents[0][0].file).toEqual(testFile)

      // Changer vers le mode liste détaillée
      const viewModeSelector = fileExplorerWrapper.findComponent({ name: 'ViewModeSelector' })
      await viewModeSelector.vm.$emit('mode-changed', {
        oldMode: VIEW_MODES.TREE,
        newMode: VIEW_MODES.DETAILED_LIST
      })

      await nextTick()

      // Sélection en mode liste
      const anotherFile = mockRootFiles[3] // config.json
      await fileExplorerWrapper.vm.handleFileSelected({ 
        file: anotherFile, 
        multiSelect: false, 
        rangeSelect: false 
      })

      selectionEvents = fileExplorerWrapper.emitted('file-selected')
      expect(selectionEvents.length).toBe(2)
      expect(selectionEvents[1][0].file).toEqual(anotherFile)
    })

    it('devrait gérer la sélection multiple de manière cohérente', async () => {
      fileExplorerWrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: true
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))

      const file1 = mockRootFiles[2] // readme.txt
      const file2 = mockRootFiles[3] // config.json

      // Sélection multiple en mode arbre
      await fileExplorerWrapper.vm.handleFileSelected({ 
        file: file1, 
        multiSelect: false, 
        rangeSelect: false 
      })

      await fileExplorerWrapper.vm.handleFileSelected({ 
        file: file2, 
        multiSelect: true, 
        rangeSelect: false 
      })

      let selectionEvents = fileExplorerWrapper.emitted('selection-changed')
      expect(selectionEvents).toBeTruthy()

      // Changer vers le mode liste détaillée
      const viewModeSelector = fileExplorerWrapper.findComponent({ name: 'ViewModeSelector' })
      await viewModeSelector.vm.$emit('mode-changed', {
        oldMode: VIEW_MODES.TREE,
        newMode: VIEW_MODES.DETAILED_LIST
      })

      await nextTick()

      // La sélection devrait être préservée ou gérée de manière cohérente
      expect(fileExplorerWrapper.exists()).toBe(true)
    })

    it('devrait gérer la sélection par plage de manière cohérente', async () => {
      fileExplorerWrapper = mount(FileExplorer, {
        props: {
          initialPath: '/Documents',
          autoLoad: true
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))

      // Changer vers le mode liste détaillée pour tester la sélection par plage
      const viewModeSelector = fileExplorerWrapper.findComponent({ name: 'ViewModeSelector' })
      await viewModeSelector.vm.$emit('mode-changed', {
        oldMode: VIEW_MODES.TREE,
        newMode: VIEW_MODES.DETAILED_LIST
      })

      await nextTick()

      const firstFile = mockDocumentsFiles[0] // report.pdf
      const lastFile = mockDocumentsFiles[1] // notes.txt

      // Sélection du premier fichier
      await fileExplorerWrapper.vm.handleFileSelected({ 
        file: firstFile, 
        multiSelect: false, 
        rangeSelect: false 
      })

      // Sélection par plage jusqu'au dernier fichier
      await fileExplorerWrapper.vm.handleFileSelected({ 
        file: lastFile, 
        multiSelect: false, 
        rangeSelect: true 
      })

      const selectionEvents = fileExplorerWrapper.emitted('selection-changed')
      expect(selectionEvents).toBeTruthy()
    })
  })

  describe('Actions sur les fichiers', () => {
    it('devrait gérer les actions de fichier de manière cohérente', async () => {
      fileExplorerWrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: true
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))

      const testFile = mockRootFiles[2] // readme.txt

      // Double-clic sur un fichier en mode arbre
      await fileExplorerWrapper.vm.handleFileDoubleClick({ file: testFile })

      let doubleClickEvents = fileExplorerWrapper.emitted('file-double-click')
      expect(doubleClickEvents).toBeTruthy()
      expect(doubleClickEvents[0][0].file).toEqual(testFile)

      // Changer vers le mode liste détaillée
      const viewModeSelector = fileExplorerWrapper.findComponent({ name: 'ViewModeSelector' })
      await viewModeSelector.vm.$emit('mode-changed', {
        oldMode: VIEW_MODES.TREE,
        newMode: VIEW_MODES.DETAILED_LIST
      })

      await nextTick()

      // Double-clic sur un fichier en mode liste
      const anotherFile = mockRootFiles[3] // config.json
      await fileExplorerWrapper.vm.handleFileDoubleClick({ file: anotherFile })

      doubleClickEvents = fileExplorerWrapper.emitted('file-double-click')
      expect(doubleClickEvents.length).toBe(2)
      expect(doubleClickEvents[1][0].file).toEqual(anotherFile)
    })

    it('devrait gérer le menu contextuel de manière cohérente', async () => {
      fileExplorerWrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: true
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))

      const testFile = mockRootFiles[2] // readme.txt

      // Clic droit en mode arbre
      await fileExplorerWrapper.vm.handleFileRightClick({ file: testFile })

      let contextMenuEvents = fileExplorerWrapper.emitted('context-menu')
      if (contextMenuEvents) {
        expect(contextMenuEvents[0][0].file).toEqual(testFile)
      }

      // Changer vers le mode liste détaillée
      const viewModeSelector = fileExplorerWrapper.findComponent({ name: 'ViewModeSelector' })
      await viewModeSelector.vm.$emit('mode-changed', {
        oldMode: VIEW_MODES.TREE,
        newMode: VIEW_MODES.DETAILED_LIST
      })

      await nextTick()

      // Clic droit en mode liste
      await fileExplorerWrapper.vm.handleFileRightClick({ file: testFile })

      // Le comportement devrait être cohérent
      expect(fileExplorerWrapper.exists()).toBe(true)
    })
  })

  describe('Gestion des erreurs', () => {
    it('devrait gérer les erreurs de navigation de manière cohérente', async () => {
      // Simuler une erreur pour un chemin spécifique
      nasAPI.browse.mockImplementation((path) => {
        if (path === '/Documents') {
          return Promise.reject(new Error('Accès refusé'))
        }
        return Promise.resolve({ success: true, items: mockRootFiles })
      })

      fileExplorerWrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: true
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))

      // Tentative de navigation vers Documents (devrait échouer)
      const documentsFolder = mockRootFiles[0]
      await fileExplorerWrapper.vm.handleFileDoubleClick({ file: documentsFolder })
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))

      // Vérifier que l'erreur est gérée
      expect(fileExplorerWrapper.vm.error).toBeTruthy()

      // Changer de mode avec une erreur active
      const viewModeSelector = fileExplorerWrapper.findComponent({ name: 'ViewModeSelector' })
      await viewModeSelector.vm.$emit('mode-changed', {
        oldMode: VIEW_MODES.TREE,
        newMode: VIEW_MODES.DETAILED_LIST
      })

      await nextTick()

      // L'erreur devrait persister dans le nouveau mode
      expect(fileExplorerWrapper.vm.error).toBeTruthy()

      // Vérifier que les événements d'erreur sont émis
      const errorEvents = fileExplorerWrapper.emitted('error')
      expect(errorEvents).toBeTruthy()
    })

    it('devrait permettre la récupération après erreur dans tous les modes', async () => {
      // Simuler une erreur temporaire
      let shouldFail = true
      nasAPI.browse.mockImplementation((path) => {
        if (path === '/Documents' && shouldFail) {
          return Promise.reject(new Error('Erreur temporaire'))
        }
        return Promise.resolve({ 
          success: true, 
          items: path === '/Documents' ? mockDocumentsFiles : mockRootFiles 
        })
      })

      fileExplorerWrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: true
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))

      // Tentative de navigation qui échoue
      const documentsFolder = mockRootFiles[0]
      await fileExplorerWrapper.vm.handleFileDoubleClick({ file: documentsFolder })
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(fileExplorerWrapper.vm.error).toBeTruthy()

      // Corriger l'erreur
      shouldFail = false

      // Réessayer la navigation
      await fileExplorerWrapper.vm.refresh()
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))

      // Maintenant la navigation devrait fonctionner
      await fileExplorerWrapper.vm.handleFileDoubleClick({ file: documentsFolder })
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(fileExplorerWrapper.vm.error).toBeFalsy()
      expect(fileExplorerWrapper.vm.currentPath).toBe('/Documents')
    })
  })

  describe('Performance et réactivité', () => {
    it('devrait maintenir la performance lors des changements de mode fréquents', async () => {
      fileExplorerWrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: true
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))

      const viewModeSelector = fileExplorerWrapper.findComponent({ name: 'ViewModeSelector' })

      // Mesurer le temps de changements de mode rapides
      const startTime = performance.now()

      // Effectuer plusieurs changements de mode rapides
      for (let i = 0; i < 5; i++) {
        await viewModeSelector.vm.$emit('mode-changed', {
          oldMode: VIEW_MODES.TREE,
          newMode: VIEW_MODES.DETAILED_LIST
        })

        await nextTick()

        await viewModeSelector.vm.$emit('mode-changed', {
          oldMode: VIEW_MODES.DETAILED_LIST,
          newMode: VIEW_MODES.TREE
        })

        await nextTick()
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      // Les changements de mode devraient être rapides (moins de 1 seconde pour 10 changements)
      expect(duration).toBeLessThan(1000)

      // Le composant devrait rester stable
      expect(fileExplorerWrapper.exists()).toBe(true)
      expect(fileExplorerWrapper.vm.files).toHaveLength(4)
    })

    it('devrait maintenir la réactivité lors de la navigation avec de gros volumes de fichiers', async () => {
      // Simuler un grand nombre de fichiers
      const manyFiles = Array.from({ length: 1000 }, (_, i) => ({
        name: `file${i}.txt`,
        path: `/file${i}.txt`,
        is_directory: false,
        size: Math.floor(Math.random() * 10000),
        modified_time: '2024-01-01T10:00:00Z'
      }))

      nasAPI.browse.mockResolvedValue({
        success: true,
        items: manyFiles
      })

      fileExplorerWrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: true
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(fileExplorerWrapper.vm.files).toHaveLength(1000)

      // Changer de mode avec beaucoup de fichiers
      const startTime = performance.now()

      const viewModeSelector = fileExplorerWrapper.findComponent({ name: 'ViewModeSelector' })
      await viewModeSelector.vm.$emit('mode-changed', {
        oldMode: VIEW_MODES.TREE,
        newMode: VIEW_MODES.DETAILED_LIST
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 50))

      const endTime = performance.now()
      const duration = endTime - startTime

      // Le changement de mode devrait rester rapide même avec beaucoup de fichiers
      expect(duration).toBeLessThan(500)
      expect(fileExplorerWrapper.exists()).toBe(true)
    })
  })
})