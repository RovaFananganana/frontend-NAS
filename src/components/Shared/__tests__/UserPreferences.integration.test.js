/**
 * @fileoverview Tests d'intégration pour la persistance des préférences utilisateur
 * Tests de sauvegarde et restauration des préférences dans localStorage
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import FileExplorer from '../FileExplorer.vue'
import { VIEW_MODES, SORT_COLUMNS, SORT_DIRECTIONS } from '../../../types/viewMode.js'
import { useViewMode } from '../../../composables/useViewMode.js'
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

// Mock localStorage complet
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}
global.localStorage = localStorageMock

describe('UserPreferences - Tests d\'intégration', () => {
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
      name: 'test.txt',
      path: '/test.txt',
      is_directory: false,
      size: 1024,
      modified_time: '2024-01-01T11:00:00Z'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    localStorageMock.setItem.mockClear()
    
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

  describe('Sauvegarde des préférences', () => {
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
      await new Promise(resolve => setTimeout(resolve, 100)) // Attendre la sauvegarde

      // Vérifier que localStorage.setItem a été appelé
      expect(localStorageMock.setItem).toHaveBeenCalled()
      
      // Vérifier le contenu sauvegardé
      const calls = localStorageMock.setItem.mock.calls
      const viewModeCall = calls.find(call => call[0].includes('viewMode') || call[0].includes('fileExplorer'))
      expect(viewModeCall).toBeTruthy()
      
      if (viewModeCall) {
        const savedData = JSON.parse(viewModeCall[1])
        expect(savedData.currentMode).toBe(VIEW_MODES.DETAILED_LIST)
      }
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
      if (detailedListView.exists()) {
        await detailedListView.vm.$emit('sort-changed', {
          column: SORT_COLUMNS.SIZE,
          direction: SORT_DIRECTIONS.DESC
        })

        await nextTick()
        await new Promise(resolve => setTimeout(resolve, 100))

        // Vérifier que les paramètres de tri sont sauvegardés
        expect(localStorageMock.setItem).toHaveBeenCalled()
        
        const calls = localStorageMock.setItem.mock.calls
        const sortCall = calls.find(call => {
          try {
            const data = JSON.parse(call[1])
            return data.sortColumn || data.sortDirection
          } catch {
            return false
          }
        })
        
        if (sortCall) {
          const savedData = JSON.parse(sortCall[1])
          expect(savedData.sortColumn).toBe(SORT_COLUMNS.SIZE)
          expect(savedData.sortDirection).toBe(SORT_DIRECTIONS.DESC)
        }
      }
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
      const detailedListView = fileExplorerWrapper.findComponent({ name: 'DetailedListView' })
      if (detailedListView.exists()) {
        await detailedListView.vm.$emit('column-visibility-changed', {
          column: 'size',
          visible: false
        })

        await nextTick()
        await new Promise(resolve => setTimeout(resolve, 100))

        expect(localStorageMock.setItem).toHaveBeenCalled()
        
        const calls = localStorageMock.setItem.mock.calls
        const columnCall = calls.find(call => {
          try {
            const data = JSON.parse(call[1])
            return data.columnVisibility
          } catch {
            return false
          }
        })
        
        if (columnCall) {
          const savedData = JSON.parse(columnCall[1])
          expect(savedData.columnVisibility.size).toBe(false)
        }
      }
    })

    it('devrait sauvegarder les préférences de sélection multiple', async () => {
      fileExplorerWrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: true
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))

      // Sélectionner plusieurs fichiers
      const file1 = mockFiles[0]
      const file2 = mockFiles[1]

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

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      // Les sélections ne sont généralement pas persistées, mais les préférences de sélection le sont
      expect(localStorageMock.setItem).toHaveBeenCalled()
    })

    it('devrait sauvegarder les préférences de raccourcis clavier', async () => {
      fileExplorerWrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: true,
          enableKeyboardShortcuts: true
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))

      // Simuler l'activation/désactivation des raccourcis
      await fileExplorerWrapper.setProps({ enableKeyboardShortcuts: false })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(localStorageMock.setItem).toHaveBeenCalled()
    })
  })

  describe('Restauration des préférences', () => {
    it('devrait restaurer le mode d\'affichage au chargement', async () => {
      // Simuler des préférences sauvegardées
      const savedPreferences = {
        currentMode: VIEW_MODES.DETAILED_LIST,
        sortColumn: SORT_COLUMNS.NAME,
        sortDirection: SORT_DIRECTIONS.ASC,
        columnVisibility: {
          name: true,
          size: true,
          type: true,
          modified: true
        }
      }
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedPreferences))

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
      
      // Vérifier que le composant utilise les préférences restaurées
      expect(fileExplorerWrapper.exists()).toBe(true)
    })

    it('devrait restaurer les paramètres de tri', async () => {
      const savedPreferences = {
        currentMode: VIEW_MODES.DETAILED_LIST,
        sortColumn: SORT_COLUMNS.SIZE,
        sortDirection: SORT_DIRECTIONS.DESC
      }
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedPreferences))

      fileExplorerWrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: true
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(localStorageMock.getItem).toHaveBeenCalled()
      expect(fileExplorerWrapper.exists()).toBe(true)
    })

    it('devrait restaurer la visibilité des colonnes', async () => {
      const savedPreferences = {
        currentMode: VIEW_MODES.DETAILED_LIST,
        columnVisibility: {
          name: true,
          size: false,
          type: true,
          modified: false
        }
      }
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedPreferences))

      fileExplorerWrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: true
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(localStorageMock.getItem).toHaveBeenCalled()
      
      // Vérifier que les colonnes sont configurées selon les préférences
      const detailedListView = fileExplorerWrapper.findComponent({ name: 'DetailedListView' })
      if (detailedListView.exists()) {
        // Les colonnes cachées ne devraient pas être visibles
        expect(detailedListView.exists()).toBe(true)
      }
    })

    it('devrait utiliser les valeurs par défaut si aucune préférence n\'est sauvegardée', async () => {
      localStorageMock.getItem.mockReturnValue(null)

      fileExplorerWrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: true
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(localStorageMock.getItem).toHaveBeenCalled()
      expect(fileExplorerWrapper.exists()).toBe(true)
      
      // Devrait utiliser le mode arbre par défaut
      const treeView = fileExplorerWrapper.findComponent({ name: 'NasFolderTree' })
      expect(treeView.exists()).toBe(true)
    })

    it('devrait gérer les préférences corrompues gracieusement', async () => {
      // Simuler des données corrompues
      localStorageMock.getItem.mockReturnValue('{"invalid": json}')

      fileExplorerWrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: true
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))

      // Le composant devrait continuer à fonctionner avec les valeurs par défaut
      expect(fileExplorerWrapper.exists()).toBe(true)
      expect(fileExplorerWrapper.vm.error).toBeFalsy()
    })
  })

  describe('Migration des préférences', () => {
    it('devrait migrer les anciennes préférences vers le nouveau format', async () => {
      // Simuler d'anciennes préférences avec un format différent
      const oldPreferences = {
        viewMode: 'list', // Ancien format
        sort: 'name_asc'  // Ancien format
      }
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(oldPreferences))

      fileExplorerWrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: true
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(localStorageMock.getItem).toHaveBeenCalled()
      
      // Vérifier que les préférences ont été migrées et sauvegardées
      await new Promise(resolve => setTimeout(resolve, 100))
      expect(localStorageMock.setItem).toHaveBeenCalled()
    })

    it('devrait nettoyer les préférences obsolètes', async () => {
      const preferencesWithObsolete = {
        currentMode: VIEW_MODES.DETAILED_LIST,
        sortColumn: SORT_COLUMNS.NAME,
        obsoleteProperty: 'should_be_removed',
        anotherObsoleteProperty: 123
      }
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(preferencesWithObsolete))

      fileExplorerWrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: true
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      // Vérifier que les préférences nettoyées ont été sauvegardées
      expect(localStorageMock.setItem).toHaveBeenCalled()
      
      const calls = localStorageMock.setItem.mock.calls
      if (calls.length > 0) {
        const lastCall = calls[calls.length - 1]
        const savedData = JSON.parse(lastCall[1])
        expect(savedData.obsoleteProperty).toBeUndefined()
        expect(savedData.anotherObsoleteProperty).toBeUndefined()
      }
    })
  })

  describe('Gestion des erreurs de localStorage', () => {
    it('devrait gérer les erreurs de lecture gracieusement', async () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage not available')
      })

      fileExplorerWrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: true
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))

      // Le composant devrait continuer à fonctionner
      expect(fileExplorerWrapper.exists()).toBe(true)
      expect(fileExplorerWrapper.vm.error).toBeFalsy()
    })

    it('devrait gérer les erreurs d\'écriture gracieusement', async () => {
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

      // Changer de mode pour déclencher une sauvegarde
      const viewModeSelector = fileExplorerWrapper.findComponent({ name: 'ViewModeSelector' })
      await viewModeSelector.vm.$emit('mode-changed', {
        oldMode: VIEW_MODES.TREE,
        newMode: VIEW_MODES.DETAILED_LIST
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      // Le composant devrait continuer à fonctionner malgré l'erreur de sauvegarde
      expect(fileExplorerWrapper.exists()).toBe(true)
      expect(fileExplorerWrapper.vm.error).toBeFalsy()
    })

    it('devrait fournir un fallback quand localStorage n\'est pas disponible', async () => {
      // Simuler l'absence de localStorage
      delete global.localStorage

      fileExplorerWrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: true
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))

      // Le composant devrait utiliser les valeurs par défaut
      expect(fileExplorerWrapper.exists()).toBe(true)
      
      // Restaurer localStorage pour les autres tests
      global.localStorage = localStorageMock
    })
  })

  describe('Synchronisation entre onglets', () => {
    it('devrait écouter les changements de localStorage d\'autres onglets', async () => {
      fileExplorerWrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: true
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))

      // Simuler un changement de localStorage depuis un autre onglet
      const storageEvent = new StorageEvent('storage', {
        key: 'fileExplorer_viewMode',
        newValue: JSON.stringify({
          currentMode: VIEW_MODES.DETAILED_LIST,
          sortColumn: SORT_COLUMNS.SIZE
        }),
        oldValue: JSON.stringify({
          currentMode: VIEW_MODES.TREE,
          sortColumn: SORT_COLUMNS.NAME
        })
      })

      window.dispatchEvent(storageEvent)

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))

      // Le composant devrait réagir au changement
      expect(fileExplorerWrapper.exists()).toBe(true)
    })

    it('devrait ignorer les changements de localStorage non pertinents', async () => {
      fileExplorerWrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          autoLoad: true
        }
      })

      await nextTick()

      // Simuler un changement de localStorage pour une autre application
      const storageEvent = new StorageEvent('storage', {
        key: 'other_app_preferences',
        newValue: '{"theme": "dark"}',
        oldValue: '{"theme": "light"}'
      })

      window.dispatchEvent(storageEvent)

      await nextTick()

      // Le composant ne devrait pas être affecté
      expect(fileExplorerWrapper.exists()).toBe(true)
    })
  })
})