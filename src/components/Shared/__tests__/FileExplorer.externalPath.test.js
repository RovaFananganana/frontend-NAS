/**
 * @fileoverview Tests unitaires pour le watcher externalPath du composant FileExplorer
 * Focus sur la navigation des favoris via externalPath
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
    normalizePath: vi.fn((path) => {
      if (!path) return '/'
      return path.replace(/\/+/g, '/').replace(/\/$/, '') || '/'
    }),
    getParentPath: vi.fn((path) => {
      const normalized = path.replace(/\/+/g, '/').replace(/\/$/, '') || '/'
      if (normalized === '/') return null
      const segments = normalized.split('/')
      segments.pop()
      return segments.join('/') || '/'
    })
  }
}))

// Mock du store Vuex
const mockStore = {
  dispatch: vi.fn()
}

vi.mock('vuex', () => ({
  useStore: () => mockStore
}))

// Mock des composables
vi.mock('@/composables/useViewMode.js', () => ({
  useViewMode: () => ({
    currentMode: { value: 'detailed_list' },
    currentViewMode: { value: { id: 'detailed_list', label: 'Liste détaillée' } },
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

vi.mock('@/composables/useFileExplorerNavigation.js', () => ({
  useFileExplorerNavigation: () => ({
    // Mock des méthodes si nécessaire
  })
}))

vi.mock('@/composables/useResponsive.js', () => ({
  useResponsive: () => ({
    isMobile: { value: false },
    isTouch: { value: false },
    shouldUseVirtualization: () => false
  })
}))

vi.mock('@/composables/useTouchGestures.js', () => ({
  useTouchGestures: () => ({
    isGesturing: { value: false },
    swipeDirection: { value: null }
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

vi.mock('@/composables/usePermissions.js', () => ({
  usePermissions: () => ({
    // Mock des permissions si nécessaire
  })
}))

vi.mock('@/composables/useFileOperations.js', () => ({
  useFileOperations: () => ({
    hasOperation: { value: false },
    isCopyOperation: { value: false },
    isCutOperation: { value: false },
    operationItems: { value: [] },
    operationCount: { value: 0 },
    sourceFolder: { value: null },
    copy: vi.fn(),
    cut: vi.fn(),
    paste: vi.fn(),
    clear: vi.fn(),
    isItemInOperation: vi.fn(),
    getItemIndicatorClass: vi.fn(),
    getOperationDescription: vi.fn(),
    canPasteToDestination: vi.fn()
  })
}))

// Mock des services
vi.mock('@/services/favoritesService.js', () => ({
  favoritesService: {
    // Mock du service favoris si nécessaire
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

vi.mock('../BreadcrumbNavigation.vue', () => ({
  default: {
    name: 'BreadcrumbNavigation',
    template: '<div data-testid="breadcrumb-navigation">BreadcrumbNavigation</div>',
    props: ['currentPath'],
    emits: ['navigate']
  }
}))

vi.mock('../DetailedListView.vue', () => ({
  default: {
    name: 'DetailedListView',
    template: '<div data-testid="detailed-list-view">DetailedListView</div>',
    props: ['currentPath', 'files', 'loading', 'error', 'focusedIndex', 'userRole', 'fileOperationsState'],
    emits: ['path-selected', 'file-selected', 'file-double-click', 'sort-changed', 'navigate-back', 'show-actions', 'context-menu']
  }
}))

vi.mock('../OptimizedDetailedListView.vue', () => ({
  default: {
    name: 'OptimizedDetailedListView',
    template: '<div data-testid="optimized-detailed-list-view">OptimizedDetailedListView</div>',
    props: ['currentPath', 'files', 'loading', 'error', 'focusedIndex', 'userRole', 'fileOperationsState'],
    emits: ['path-selected', 'file-selected', 'file-double-click', 'sort-changed', 'navigate-back', 'show-actions', 'context-menu']
  }
}))

describe('FileExplorer - Watcher externalPath', () => {
  let wrapper

  const mockFiles = [
    {
      name: 'Documents',
      path: '/home/user/Documents',
      is_directory: true,
      size: 0,
      modified_time: '2024-01-01T10:00:00Z'
    },
    {
      name: 'Photos',
      path: '/home/user/Photos',
      is_directory: true,
      size: 0,
      modified_time: '2024-01-01T11:00:00Z'
    },
    {
      name: 'test.txt',
      path: '/home/user/test.txt',
      is_directory: false,
      size: 1024,
      modified_time: '2024-01-01T12:00:00Z'
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

    // Mock console pour éviter les logs pendant les tests
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    console.log.mockRestore()
    console.error.mockRestore()
  })

  describe('Watcher externalPath - Déclenchement', () => {
    it('devrait se déclencher quand externalPath change', async () => {
      wrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          externalPath: null,
          autoLoad: false
        }
      })

      await nextTick()

      // Changer externalPath
      await wrapper.setProps({ externalPath: '/home/user/Documents' })
      await nextTick()

      // Vérifier que l'API a été appelée avec le nouveau chemin
      expect(nasAPI.browse).toHaveBeenCalledWith('/home/user/Documents')
    })

    it('ne devrait pas se déclencher si externalPath est null ou vide', async () => {
      wrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          externalPath: '/some/path',
          autoLoad: false
        }
      })

      await nextTick()
      vi.clearAllMocks()

      // Changer vers null
      await wrapper.setProps({ externalPath: null })
      await nextTick()

      expect(nasAPI.browse).not.toHaveBeenCalled()

      // Changer vers chaîne vide
      await wrapper.setProps({ externalPath: '' })
      await nextTick()

      expect(nasAPI.browse).not.toHaveBeenCalled()
    })

    it('devrait logger les détails du watcher lors du déclenchement', async () => {
      wrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          externalPath: null,
          autoLoad: false
        }
      })

      await nextTick()

      await wrapper.setProps({ externalPath: '/home/user/Documents' })
      await nextTick()

      expect(console.log).toHaveBeenCalledWith(
        'FileExplorer.externalPath.watcher - TRIGGERED',
        expect.objectContaining({
          watcherDetails: expect.objectContaining({
            newPath: '/home/user/Documents',
            oldPath: null,
            currentPath: expect.any(String)
          }),
          componentState: expect.objectContaining({
            loading: expect.any(Boolean),
            error: expect.any(String),
            filesCount: expect.any(Number)
          })
        })
      )
    })
  })

  describe('Watcher externalPath - Normalisation des chemins', () => {
    beforeEach(() => {
      wrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          externalPath: null,
          autoLoad: false
        }
      })
    })

    it('devrait normaliser les chemins avec des slashes multiples', async () => {
      await wrapper.setProps({ externalPath: '/home//user///Documents' })
      await nextTick()

      expect(nasAPI.normalizePath).toHaveBeenCalledWith('/home//user///Documents')
      expect(nasAPI.browse).toHaveBeenCalledWith('/home/user/Documents')
    })

    it('devrait gérer les chemins avec des slashes de fin', async () => {
      await wrapper.setProps({ externalPath: '/home/user/Documents/' })
      await nextTick()

      expect(nasAPI.normalizePath).toHaveBeenCalledWith('/home/user/Documents/')
      expect(nasAPI.browse).toHaveBeenCalledWith('/home/user/Documents')
    })

    it('devrait gérer le chemin racine', async () => {
      await wrapper.setProps({ externalPath: '/' })
      await nextTick()

      expect(nasAPI.normalizePath).toHaveBeenCalledWith('/')
      expect(nasAPI.browse).toHaveBeenCalledWith('/')
    })
  })

  describe('Watcher externalPath - Validation des chemins', () => {
    beforeEach(() => {
      wrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          externalPath: null,
          autoLoad: false
        }
      })
    })

    it('devrait rejeter les chemins avec des caractères dangereux', async () => {
      const dangerousPaths = [
        '/home/user/<script>',
        '/home/user/file|pipe',
        '/home/user/file"quote',
        '/home/user/file*wildcard',
        '/home/user/file?question'
      ]

      for (const path of dangerousPaths) {
        vi.clearAllMocks()
        
        await wrapper.setProps({ externalPath: path })
        await nextTick()

        expect(mockStore.dispatch).toHaveBeenCalledWith('showError', expect.stringContaining('Chemin invalide'))
        expect(nasAPI.browse).not.toHaveBeenCalled()
      }
    })

    it('devrait accepter les chemins valides', async () => {
      const validPaths = [
        '/home/user/Documents',
        '/var/www/html',
        '/tmp/test-folder',
        '/home/user/folder with spaces',
        '/home/user/folder_with_underscores',
        '/home/user/folder-with-dashes'
      ]

      for (const path of validPaths) {
        vi.clearAllMocks()
        
        await wrapper.setProps({ externalPath: path })
        await nextTick()

        expect(nasAPI.browse).toHaveBeenCalledWith(path)
        expect(mockStore.dispatch).not.toHaveBeenCalledWith('showError', expect.stringContaining('Chemin invalide'))
      }
    })
  })

  describe('Watcher externalPath - Force refresh', () => {
    beforeEach(() => {
      wrapper = mount(FileExplorer, {
        props: {
          initialPath: '/home/user/Documents',
          externalPath: null,
          autoLoad: true
        }
      })
    })

    it('devrait forcer le refresh même si le chemin est identique', async () => {
      await nextTick()
      vi.clearAllMocks()

      // Définir le même chemin que currentPath
      await wrapper.setProps({ externalPath: '/home/user/Documents' })
      await nextTick()

      // Devrait quand même déclencher un chargement
      expect(nasAPI.browse).toHaveBeenCalledWith('/home/user/Documents')
    })

    it('devrait logger le force refresh', async () => {
      await nextTick()
      
      await wrapper.setProps({ externalPath: '/home/user/Documents' })
      await nextTick()

      expect(console.log).toHaveBeenCalledWith(
        'FileExplorer.externalPath.watcher - FORCE REFRESH detected',
        expect.objectContaining({
          path: '/home/user/Documents',
          currentPath: '/home/user/Documents',
          reason: 'external_path_force_refresh',
          pathsEqual: true
        })
      )
    })
  })

  describe('Watcher externalPath - Gestion d\'erreur', () => {
    beforeEach(() => {
      wrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          externalPath: null,
          autoLoad: false
        }
      })
    })

    it('devrait gérer les erreurs de normalisation de chemin', async () => {
      const error = new Error('Invalid path format')
      nasAPI.normalizePath.mockImplementation(() => {
        throw error
      })

      await wrapper.setProps({ externalPath: '/invalid/path' })
      await nextTick()

      expect(console.error).toHaveBeenCalledWith(
        'FileExplorer.externalPath.watcher - Path normalization FAILED',
        expect.objectContaining({
          path: '/invalid/path',
          error: error.message
        })
      )

      expect(mockStore.dispatch).toHaveBeenCalledWith('showError', 'Chemin invalide: /invalid/path')
    })

    it('devrait gérer les erreurs de navigation', async () => {
      const error = new Error('Network error')
      nasAPI.browse.mockRejectedValue(error)

      await wrapper.setProps({ externalPath: '/home/user/Documents' })
      await nextTick()

      expect(console.error).toHaveBeenCalledWith(
        'FileExplorer.externalPath.watcher - External path navigation FAILED',
        expect.objectContaining({
          navigationError: expect.objectContaining({
            path: '/home/user/Documents',
            error: error.message
          })
        })
      )
    })

    it('devrait émettre une erreur lors d\'échec de navigation', async () => {
      const error = new Error('Access denied')
      nasAPI.browse.mockRejectedValue(error)

      await wrapper.setProps({ externalPath: '/home/user/protected' })
      await nextTick()

      const errorEvents = wrapper.emitted('error')
      expect(errorEvents).toBeTruthy()
      expect(errorEvents[0][0]).toMatchObject({
        error: error,
        path: '/home/user/protected',
        action: 'external_navigation'
      })
    })
  })

  describe('Watcher externalPath - Notifications de succès', () => {
    beforeEach(() => {
      wrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          externalPath: null,
          autoLoad: false
        }
      })
    })

    it('devrait afficher une notification de succès pour une navigation normale', async () => {
      await wrapper.setProps({ externalPath: '/home/user/Documents' })
      await nextTick()

      expect(mockStore.dispatch).toHaveBeenCalledWith('showSuccess', 'Navigation vers Documents')
    })

    it('ne devrait pas afficher de notification pour un force refresh', async () => {
      // Définir le chemin initial
      wrapper.vm.currentPath = '/home/user/Documents'
      
      await wrapper.setProps({ externalPath: '/home/user/Documents' })
      await nextTick()

      // Ne devrait pas y avoir de notification de succès pour un force refresh
      expect(mockStore.dispatch).not.toHaveBeenCalledWith('showSuccess', expect.any(String))
    })

    it('devrait utiliser le nom correct du dossier dans la notification', async () => {
      const testCases = [
        { path: '/home/user/Documents', expectedName: 'Documents' },
        { path: '/var/www/html', expectedName: 'html' },
        { path: '/', expectedName: 'Racine' },
        { path: '/tmp', expectedName: 'tmp' }
      ]

      for (const { path, expectedName } of testCases) {
        vi.clearAllMocks()
        
        await wrapper.setProps({ externalPath: path })
        await nextTick()

        expect(mockStore.dispatch).toHaveBeenCalledWith('showSuccess', `Navigation vers ${expectedName}`)
      }
    })
  })

  describe('Watcher externalPath - Intégration avec l\'historique', () => {
    beforeEach(() => {
      wrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          externalPath: null,
          autoLoad: false
        }
      })
    })

    it('devrait ajouter le chemin à l\'historique de navigation', async () => {
      await wrapper.setProps({ externalPath: '/home/user/Documents' })
      await nextTick()

      // Vérifier que le chemin a été ajouté à l'historique
      expect(wrapper.vm.navigationHistory).toContain('/home/user/Documents')
    })

    it('devrait émettre les événements de navigation appropriés', async () => {
      await wrapper.setProps({ externalPath: '/home/user/Documents' })
      await nextTick()

      // Vérifier l'événement path-changed
      const pathChangedEvents = wrapper.emitted('path-changed')
      expect(pathChangedEvents).toBeTruthy()
      expect(pathChangedEvents[0][0]).toMatchObject({
        newPath: '/home/user/Documents',
        source: 'external_path'
      })

      // Vérifier l'événement navigate
      const navigateEvents = wrapper.emitted('navigate')
      expect(navigateEvents).toBeTruthy()
      expect(navigateEvents[0][0]).toMatchObject({
        path: '/home/user/Documents',
        source: 'external_path'
      })
    })
  })

  describe('Watcher externalPath - Performance et optimisation', () => {
    beforeEach(() => {
      wrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          externalPath: null,
          autoLoad: false
        }
      })
    })

    it('ne devrait pas déclencher de navigation redondante', async () => {
      // Premier changement
      await wrapper.setProps({ externalPath: '/home/user/Documents' })
      await nextTick()

      const firstCallCount = nasAPI.browse.mock.calls.length

      // Même chemin - devrait quand même déclencher (force refresh)
      await wrapper.setProps({ externalPath: '/home/user/Documents' })
      await nextTick()

      // Devrait avoir une nouvelle navigation (force refresh)
      expect(nasAPI.browse.mock.calls.length).toBeGreaterThan(firstCallCount)
    })

    it('devrait gérer les changements rapides de chemin', async () => {
      const paths = [
        '/home/user/Documents',
        '/home/user/Photos',
        '/home/user/Videos'
      ]

      // Changer rapidement plusieurs chemins
      for (const path of paths) {
        await wrapper.setProps({ externalPath: path })
      }
      
      await nextTick()

      // Vérifier que tous les chemins ont été traités
      expect(nasAPI.browse).toHaveBeenCalledTimes(paths.length)
      paths.forEach(path => {
        expect(nasAPI.browse).toHaveBeenCalledWith(path)
      })
    })
  })

  describe('Watcher externalPath - Logging complet', () => {
    beforeEach(() => {
      wrapper = mount(FileExplorer, {
        props: {
          initialPath: '/',
          externalPath: null,
          autoLoad: false
        }
      })
    })

    it('devrait logger toutes les étapes de la navigation réussie', async () => {
      await wrapper.setProps({ externalPath: '/home/user/Documents' })
      await nextTick()

      // Vérifier les logs de déclenchement
      expect(console.log).toHaveBeenCalledWith(
        'FileExplorer.externalPath.watcher - TRIGGERED',
        expect.any(Object)
      )

      // Vérifier les logs de validation
      expect(console.log).toHaveBeenCalledWith(
        'FileExplorer.externalPath.watcher - Path validation SUCCESS',
        expect.objectContaining({
          normalizedPath: '/home/user/Documents',
          isValid: true
        })
      )

      // Vérifier les logs de completion
      expect(console.log).toHaveBeenCalledWith(
        'FileExplorer.externalPath.watcher - COMPLETED',
        expect.objectContaining({
          finalState: expect.objectContaining({
            currentPath: '/home/user/Documents'
          })
        })
      )
    })

    it('devrait logger les détails des erreurs', async () => {
      const error = new Error('Test error')
      nasAPI.browse.mockRejectedValue(error)

      await wrapper.setProps({ externalPath: '/home/user/Documents' })
      await nextTick()

      expect(console.error).toHaveBeenCalledWith(
        'FileExplorer.externalPath.watcher - External path navigation FAILED',
        expect.objectContaining({
          navigationError: expect.objectContaining({
            path: '/home/user/Documents',
            error: error.message,
            errorType: 'Error'
          })
        })
      )
    })
  })
})