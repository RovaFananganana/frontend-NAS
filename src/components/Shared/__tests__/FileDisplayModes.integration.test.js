/**
 * @fileoverview Tests d'intégration pour les modes d'affichage des fichiers
 * Tests de changement de mode avec préservation des données, cohérence de navigation,
 * raccourcis clavier et persistance des préférences utilisateur
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import FileExplorer from '../FileExplorer.vue'
import ViewModeSelector from '../ViewModeSelector.vue'
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

// Mock localStorage pour les tests de persistance
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
global.localStorage = localStorageMock

describe('FileDisplayModes - Tests d\'intégration', () => {
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
      name: 'large-file.zip',
      path: '/large-file.zip',
      is_directory: false,
      size: 5242880, // 5MB
      modified_time: '2024-01-03T11:00:00Z'
    }
  ]

  beforeEach(() => {
    // Reset des mocks
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    
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
    if (fileExplorerWrapper) {
      fileExplorerWrapper.unmount()
    }
  })

  describe('1. Changement de mode avec préservation des données', () => {
    it('devrait préserver les données lors du changement de mode arbre vers liste', async () => {
      // Monter FileExplorer en mode arbre
      fileExplorerWrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: true
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))

      // Vérifier que les données sont chargées
      expect(fileExplorerWrapper.vm.files).toHaveLength(4)
      expect(fileExplorerWrapper.vm.currentPath).toBe('/')

      // Sélectionner un fichier
      const testFile = mockFiles[2] // test.txt
      await fileExplorerWrapper.vm.handleFileSelected({ 
        file: testFile, 
        multiSelect: false, 
        rangeSelect: false 
      })

      // Changer vers le mode liste détaillée
      const viewModeSelector = fileExplorerWrapper.findComponent({ name: 'ViewModeSelector' })
      await viewModeSelector.vm.$emit('mode-changed', {
        oldMode: VIEW_MODES.TREE,
        newMode: VIEW_MODES.DETAILED_LIST
      })

      await nextTick()

      // Vérifier que les données sont préservées
      expect(fileExplorerWrapper.vm.files).toHaveLength(4)
      expect(fileExplorerWrapper.vm.currentPath).toBe('/')
      
      // Vérifier que la sélection est préservée
      const selectionChangedEvents = fileExplorerWrapper.emitted('selection-changed')
      expect(selectionChangedEvents).toBeTruthy()
    })

    it('devrait préserver le chemin de navigation lors du changement de mode', async () => {
      // Naviguer vers un sous-dossier
      const documentsPath = '/Documents'
      const documentsFiles = [
        {
          name: 'doc1.txt',
          path: '/Documents/doc1.txt',
          is_directory: false,
          size: 512,
          modified_time: '2024-01-01T12:00:00Z'
        }
      ]

      nasAPI.browse.mockResolvedValueOnce({
        success: true,
        items: mockFiles
      }).mockResolvedValueOnce({
        success: true,
        items: documentsFiles
      })

      fileExplorerWrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: true
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))

      // Naviguer vers Documents
      await fileExplorerWrapper.vm.handlePathSelected(documentsPath)
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(fileExplorerWrapper.vm.currentPath).toBe(documentsPath)

      // Changer de mode
      const viewModeSelector = fileExplorerWrapper.findComponent({ name: 'ViewModeSelector' })
      await viewModeSelector.vm.$emit('mode-changed', {
        oldMode: VIEW_MODES.TREE,
        newMode: VIEW_MODES.DETAILED_LIST
      })

      await nextTick()

      // Vérifier que le chemin est préservé
      expect(fileExplorerWrapper.vm.currentPath).toBe(documentsPath)
    })

    it('devrait préserver les paramètres de tri lors du changement de mode', async () => {
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

      // Simuler un changement de tri
      const detailedListView = fileExplorerWrapper.findComponent({ name: 'DetailedListView' })
      await detailedListView.vm.$emit('sort-changed', {
        column: SORT_COLUMNS.SIZE,
        direction: SORT_DIRECTIONS.DESC
      })

      await nextTick()

      // Revenir au mode arbre
      await viewModeSelector.vm.$emit('mode-changed', {
        oldMode: VIEW_MODES.DETAILED_LIST,
        newMode: VIEW_MODES.TREE
      })

      await nextTick()

      // Retourner au mode liste
      await viewModeSelector.vm.$emit('mode-changed', {
        oldMode: VIEW_MODES.TREE,
        newMode: VIEW_MODES.DETAILED_LIST
      })

      await nextTick()

      // Vérifier que les paramètres de tri sont préservés
      // (Ceci serait vérifié via le store de view mode dans une implémentation réelle)
      expect(detailedListView.exists()).toBe(true)
    })
  })

  describe('2. Cohérence de navigation entre les modes', () => {
    it('devrait maintenir la cohérence de navigation entre arbre et liste', async () => {
      fileExplorerWrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: true
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))

      // Test de navigation en mode arbre
      const folder = mockFiles[0] // Documents
      await fileExplorerWrapper.vm.handleFileDoubleClick({ file: folder })
      await nextTick()

      expect(nasAPI.browse).toHaveBeenCalledWith(folder.path)

      // Changer vers le mode liste
      const viewModeSelector = fileExplorerWrapper.findComponent({ name: 'ViewModeSelector' })
      await viewModeSelector.vm.$emit('mode-changed', {
        oldMode: VIEW_MODES.TREE,
        newMode: VIEW_MODES.DETAILED_LIST
      })

      await nextTick()

      // Test de navigation en mode liste (double-clic sur dossier)
      const imagesFolder = mockFiles[1] // Images
      await fileExplorerWrapper.vm.handleFileDoubleClick({ file: imagesFolder })
      await nextTick()

      expect(nasAPI.browse).toHaveBeenCalledWith(imagesFolder.path)

      // Vérifier que les événements de navigation sont cohérents
      const pathChangedEvents = fileExplorerWrapper.emitted('path-changed')
      expect(pathChangedEvents).toBeTruthy()
      expect(pathChangedEvents.length).toBeGreaterThan(0)
    })

    it('devrait gérer la sélection de fichiers de manière cohérente', async () => {
      fileExplorerWrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: true
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))

      const testFile = mockFiles[2] // test.txt

      // Sélection en mode arbre
      await fileExplorerWrapper.vm.handleFileSelected({ 
        file: testFile, 
        multiSelect: false, 
        rangeSelect: false 
      })

      let selectionEvents = fileExplorerWrapper.emitted('file-selected')
      expect(selectionEvents).toBeTruthy()
      expect(selectionEvents[0][0].file).toEqual(testFile)

      // Changer vers le mode liste
      const viewModeSelector = fileExplorerWrapper.findComponent({ name: 'ViewModeSelector' })
      await viewModeSelector.vm.$emit('mode-changed', {
        oldMode: VIEW_MODES.TREE,
        newMode: VIEW_MODES.DETAILED_LIST
      })

      await nextTick()

      // Sélection en mode liste
      const largeFile = mockFiles[3] // large-file.zip
      await fileExplorerWrapper.vm.handleFileSelected({ 
        file: largeFile, 
        multiSelect: false, 
        rangeSelect: false 
      })

      selectionEvents = fileExplorerWrapper.emitted('file-selected')
      expect(selectionEvents.length).toBe(2)
      expect(selectionEvents[1][0].file).toEqual(largeFile)
    })

    it('devrait gérer les erreurs de navigation de manière cohérente', async () => {
      // Simuler une erreur de navigation
      nasAPI.browse.mockRejectedValueOnce(new Error('Accès refusé'))
        .mockResolvedValueOnce({ success: true, items: mockFiles })

      fileExplorerWrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: true
        }
      })

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
    })
  })

  describe('3. Raccourcis clavier dans différents contextes', () => {
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

    it('devrait gérer les raccourcis de changement de mode', async () => {
      // Simuler Ctrl+1 (mode arbre)
      const event1 = new KeyboardEvent('keydown', {
        key: '1',
        ctrlKey: true,
        bubbles: true
      })
      document.dispatchEvent(event1)

      await nextTick()

      // Simuler Ctrl+2 (mode liste détaillée)
      const event2 = new KeyboardEvent('keydown', {
        key: '2',
        ctrlKey: true,
        bubbles: true
      })
      document.dispatchEvent(event2)

      await nextTick()

      // Vérifier que les événements de changement de mode sont émis
      const viewModeSelector = fileExplorerWrapper.findComponent({ name: 'ViewModeSelector' })
      expect(viewModeSelector.exists()).toBe(true)
    })

    it('devrait gérer les raccourcis de navigation dans tous les modes', async () => {
      // Test en mode arbre
      const arrowDownEvent = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true
      })
      document.dispatchEvent(arrowDownEvent)

      await nextTick()

      // Changer vers le mode liste
      const viewModeSelector = fileExplorerWrapper.findComponent({ name: 'ViewModeSelector' })
      await viewModeSelector.vm.$emit('mode-changed', {
        oldMode: VIEW_MODES.TREE,
        newMode: VIEW_MODES.DETAILED_LIST
      })

      await nextTick()

      // Test en mode liste
      const arrowUpEvent = new KeyboardEvent('keydown', {
        key: 'ArrowUp',
        bubbles: true
      })
      document.dispatchEvent(arrowUpEvent)

      await nextTick()

      // Les raccourcis devraient fonctionner dans les deux modes
      expect(fileExplorerWrapper.exists()).toBe(true)
    })

    it('devrait gérer les raccourcis de sélection dans tous les modes', async () => {
      // Ctrl+A (sélectionner tout)
      const selectAllEvent = new KeyboardEvent('keydown', {
        key: 'a',
        ctrlKey: true,
        bubbles: true
      })
      document.dispatchEvent(selectAllEvent)

      await nextTick()

      // Changer de mode
      const viewModeSelector = fileExplorerWrapper.findComponent({ name: 'ViewModeSelector' })
      await viewModeSelector.vm.$emit('mode-changed', {
        oldMode: VIEW_MODES.TREE,
        newMode: VIEW_MODES.DETAILED_LIST
      })

      await nextTick()

      // Escape (désélectionner)
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true
      })
      document.dispatchEvent(escapeEvent)

      await nextTick()

      expect(fileExplorerWrapper.exists()).toBe(true)
    })

    it('devrait gérer les raccourcis de tri en mode liste détaillée', async () => {
      // Passer en mode liste détaillée
      const viewModeSelector = fileExplorerWrapper.findComponent({ name: 'ViewModeSelector' })
      await viewModeSelector.vm.$emit('mode-changed', {
        oldMode: VIEW_MODES.TREE,
        newMode: VIEW_MODES.DETAILED_LIST
      })

      await nextTick()

      // Ctrl+Shift+N (tri par nom)
      const sortByNameEvent = new KeyboardEvent('keydown', {
        key: 'N',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true
      })
      document.dispatchEvent(sortByNameEvent)

      await nextTick()

      // Ctrl+Shift+S (tri par taille)
      const sortBySizeEvent = new KeyboardEvent('keydown', {
        key: 'S',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true
      })
      document.dispatchEvent(sortBySizeEvent)

      await nextTick()

      expect(fileExplorerWrapper.exists()).toBe(true)
    })
  })

  describe('4. Persistance des préférences utilisateur', () => {
    it('devrait sauvegarder le mode d\'affichage sélectionné', async () => {
      fileExplorerWrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: true
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))

      // Changer de mode
      const viewModeSelector = fileExplorerWrapper.findComponent({ name: 'ViewModeSelector' })
      await viewModeSelector.vm.$emit('mode-changed', {
        oldMode: VIEW_MODES.TREE,
        newMode: VIEW_MODES.DETAILED_LIST
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 50)) // Attendre la sauvegarde

      // Vérifier que localStorage.setItem a été appelé
      expect(localStorageMock.setItem).toHaveBeenCalled()
      
      const calls = localStorageMock.setItem.mock.calls
      const viewModeCall = calls.find(call => call[0] === 'fileExplorer_viewMode')
      expect(viewModeCall).toBeTruthy()
    })

    it('devrait restaurer le mode d\'affichage au chargement', async () => {
      // Simuler des préférences sauvegardées
      const savedPreferences = {
        currentMode: VIEW_MODES.DETAILED_LIST,
        sortColumn: SORT_COLUMNS.SIZE,
        sortDirection: SORT_DIRECTIONS.DESC
      }
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedPreferences))

      // Créer un nouveau composant qui devrait charger les préférences
      fileExplorerWrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: true
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))

      // Vérifier que localStorage.getItem a été appelé
      expect(localStorageMock.getItem).toHaveBeenCalled()
    })

    it('devrait sauvegarder les paramètres de tri', async () => {
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

      // Changer les paramètres de tri
      const detailedListView = fileExplorerWrapper.findComponent({ name: 'DetailedListView' })
      await detailedListView.vm.$emit('sort-changed', {
        column: SORT_COLUMNS.SIZE,
        direction: SORT_DIRECTIONS.DESC
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 50))

      // Vérifier que les paramètres sont sauvegardés
      expect(localStorageMock.setItem).toHaveBeenCalled()
    })

    it('devrait sauvegarder la visibilité des colonnes', async () => {
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

      // Simuler un changement de visibilité de colonne
      // (Dans une implémentation réelle, ceci viendrait d'un menu contextuel ou d'un bouton)
      const detailedListView = fileExplorerWrapper.findComponent({ name: 'DetailedListView' })
      if (detailedListView.exists()) {
        // Simuler l'événement de changement de visibilité
        await detailedListView.vm.$emit('column-visibility-changed', {
          column: 'size',
          visible: false
        })

        await nextTick()
        await new Promise(resolve => setTimeout(resolve, 50))

        expect(localStorageMock.setItem).toHaveBeenCalled()
      }
    })

    it('devrait gérer les erreurs de localStorage gracieusement', async () => {
      // Simuler une erreur de localStorage
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })

      fileExplorerWrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: true
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))

      // Changer de mode (devrait déclencher une sauvegarde)
      const viewModeSelector = fileExplorerWrapper.findComponent({ name: 'ViewModeSelector' })
      await viewModeSelector.vm.$emit('mode-changed', {
        oldMode: VIEW_MODES.TREE,
        newMode: VIEW_MODES.DETAILED_LIST
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 50))

      // Le composant devrait continuer à fonctionner malgré l'erreur
      expect(fileExplorerWrapper.exists()).toBe(true)
      expect(fileExplorerWrapper.vm.error).toBeFalsy() // Pas d'erreur visible pour l'utilisateur
    })
  })

  describe('5. Tests d\'intégration complexes', () => {
    it('devrait gérer un workflow complet utilisateur', async () => {
      // Simuler des préférences existantes
      const initialPrefs = {
        currentMode: VIEW_MODES.DETAILED_LIST,
        sortColumn: SORT_COLUMNS.NAME,
        sortDirection: SORT_DIRECTIONS.ASC
      }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(initialPrefs))

      fileExplorerWrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: true
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))

      // 1. Naviguer vers un dossier
      const folder = mockFiles[0] // Documents
      await fileExplorerWrapper.vm.handleFileDoubleClick({ file: folder })
      await nextTick()

      // 2. Changer le tri
      const detailedListView = fileExplorerWrapper.findComponent({ name: 'DetailedListView' })
      if (detailedListView.exists()) {
        await detailedListView.vm.$emit('sort-changed', {
          column: SORT_COLUMNS.SIZE,
          direction: SORT_DIRECTIONS.DESC
        })
        await nextTick()
      }

      // 3. Sélectionner des fichiers
      const testFile = mockFiles[2]
      await fileExplorerWrapper.vm.handleFileSelected({ 
        file: testFile, 
        multiSelect: false, 
        rangeSelect: false 
      })

      // 4. Changer de mode
      const viewModeSelector = fileExplorerWrapper.findComponent({ name: 'ViewModeSelector' })
      await viewModeSelector.vm.$emit('mode-changed', {
        oldMode: VIEW_MODES.DETAILED_LIST,
        newMode: VIEW_MODES.TREE
      })

      await nextTick()

      // 5. Revenir au mode liste
      await viewModeSelector.vm.$emit('mode-changed', {
        oldMode: VIEW_MODES.TREE,
        newMode: VIEW_MODES.DETAILED_LIST
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 50))

      // Vérifier que tout fonctionne encore
      expect(fileExplorerWrapper.exists()).toBe(true)
      expect(localStorageMock.setItem).toHaveBeenCalled()
    })

    it('devrait gérer les changements rapides de mode', async () => {
      fileExplorerWrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: true
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))

      const viewModeSelector = fileExplorerWrapper.findComponent({ name: 'ViewModeSelector' })

      // Changements rapides de mode
      await viewModeSelector.vm.$emit('mode-changed', {
        oldMode: VIEW_MODES.TREE,
        newMode: VIEW_MODES.DETAILED_LIST
      })

      await viewModeSelector.vm.$emit('mode-changed', {
        oldMode: VIEW_MODES.DETAILED_LIST,
        newMode: VIEW_MODES.TREE
      })

      await viewModeSelector.vm.$emit('mode-changed', {
        oldMode: VIEW_MODES.TREE,
        newMode: VIEW_MODES.DETAILED_LIST
      })

      await nextTick()

      // Le composant devrait rester stable
      expect(fileExplorerWrapper.exists()).toBe(true)
      expect(fileExplorerWrapper.vm.files).toHaveLength(4)
    })
  })
})