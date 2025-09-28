/**
 * @fileoverview Tests unitaires pour le composant User
 * Focus sur la gestion de la navigation des favoris
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import User from '../User.vue'

// Mock du service favoris
const mockFavoritesService = {
  checkNavigationPermissions: vi.fn()
}

vi.mock('@/services/favoritesService.js', () => ({
  favoritesService: mockFavoritesService
}))

// Mock du store Vuex
const mockStore = {
  dispatch: vi.fn()
}

vi.mock('vuex', () => ({
  useStore: () => mockStore
}))

// Mock global pour $store
const globalMocks = {
  $store: mockStore
}

// Mock des composants enfants
vi.mock('@/components/Shared/Navbar.vue', () => ({
  default: {
    name: 'Navbar',
    template: '<div data-testid="navbar">Navbar</div>',
    props: ['pageTitle']
  }
}))

vi.mock('@/components/Shared/Sidebar.vue', () => ({
  default: {
    name: 'Sidebar',
    template: '<div data-testid="sidebar" @click="$emit(\'navigate-to-favorite\', testEvent)">Sidebar</div>',
    props: ['activeTab', 'currentPath'],
    emits: ['tab-changed', 'navigate-to-favorite'],
    data() {
      return {
        testEvent: null
      }
    }
  }
}))

vi.mock('@/components/User/UserDashboard.vue', () => ({
  default: {
    name: 'UserDashboard',
    template: '<div data-testid="user-dashboard">UserDashboard</div>'
  }
}))

vi.mock('@/components/Shared/FileExplorer.vue', () => ({
  default: {
    name: 'FileExplorer',
    template: '<div data-testid="file-explorer">FileExplorer</div>',
    props: ['userRole', 'externalPath', 'key'],
    emits: ['navigate', 'path-changed']
  }
}))

vi.mock('@/components/User/StorageInfo.vue', () => ({
  default: {
    name: 'StorageInfo',
    template: '<div data-testid="storage-info">StorageInfo</div>'
  }
}))

vi.mock('@/components/User/ActivityLogs.vue', () => ({
  default: {
    name: 'ActivityLogs',
    template: '<div data-testid="activity-logs">ActivityLogs</div>'
  }
}))

vi.mock('@/components/User/ProfileEditor.vue', () => ({
  default: {
    name: 'ProfileEditor',
    template: '<div data-testid="profile-editor">ProfileEditor</div>'
  }
}))

describe('User - Navigation des favoris', () => {
  let wrapper

  beforeEach(() => {
    // Reset des mocks
    vi.clearAllMocks()
    
    // Configuration par défaut du service favoris
    mockFavoritesService.checkNavigationPermissions.mockResolvedValue({
      canNavigate: true,
      errorType: null,
      error: null,
      canRetry: false
    })
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('handleFavoriteNavigation() - Scénarios de succès', () => {
    beforeEach(() => {
      wrapper = mount(User, {
        global: {
          mocks: globalMocks
        }
      })
    })

    it('devrait traiter un événement de navigation valide', async () => {
      const navigationEvent = {
        path: '/home/user/Documents',
        source: 'favorite',
        favorite: {
          name: 'Documents',
          path: '/home/user/Documents'
        }
      }

      await wrapper.vm.handleFavoriteNavigation(navigationEvent)
      await nextTick()

      // Vérifier que l'onglet files est activé
      expect(wrapper.vm.activeTab).toBe('files')
      
      // Vérifier que le chemin est mis à jour
      expect(wrapper.vm.currentPath).toBe('/home/user/Documents')
    })

    it('devrait normaliser les chemins avant navigation', async () => {
      const navigationEvent = {
        path: '/home/user/Documents///',
        source: 'favorite',
        favorite: {
          name: 'Documents',
          path: '/home/user/Documents///'
        }
      }

      await wrapper.vm.handleFavoriteNavigation(navigationEvent)
      await nextTick()

      // Le chemin devrait être normalisé (sans slashes multiples)
      expect(wrapper.vm.currentPath).toBe('/home/user/Documents')
    })

    it('devrait forcer le rafraîchissement du composant pour le même chemin', async () => {
      // Définir un chemin initial
      wrapper.vm.currentPath = '/home/user/Documents'
      const initialComponentKey = wrapper.vm.componentKey

      const navigationEvent = {
        path: '/home/user/Documents',
        source: 'favorite',
        favorite: {
          name: 'Documents',
          path: '/home/user/Documents'
        }
      }

      await wrapper.vm.handleFavoriteNavigation(navigationEvent)
      await nextTick()

      // Le componentKey devrait avoir changé pour forcer le refresh
      expect(wrapper.vm.componentKey).toBeGreaterThan(initialComponentKey)
    })

    it('devrait afficher une notification de navigation', async () => {
      const navigationEvent = {
        path: '/home/user/Photos',
        source: 'favorite',
        favorite: {
          name: 'Photos',
          path: '/home/user/Photos'
        }
      }

      await wrapper.vm.handleFavoriteNavigation(navigationEvent)

      expect(mockStore.dispatch).toHaveBeenCalledWith('showInfo', 'Navigation vers Photos')
    })

    it('devrait réinitialiser le compteur de retry en cas de succès', async () => {
      // Simuler des tentatives précédentes
      wrapper.vm.navigationRetryCount = 2

      const navigationEvent = {
        path: '/home/user/Documents',
        source: 'favorite',
        favorite: {
          name: 'Documents',
          path: '/home/user/Documents'
        }
      }

      await wrapper.vm.handleFavoriteNavigation(navigationEvent)

      expect(wrapper.vm.navigationRetryCount).toBe(0)
    })
  })

  describe('handleFavoriteNavigation() - Validation des données', () => {
    beforeEach(() => {
      wrapper = mount(User, {
        global: {
          mocks: globalMocks
        }
      })
    })

    it('devrait rejeter les événements sans chemin', async () => {
      const invalidEvent = {
        source: 'favorite',
        favorite: {
          name: 'Test',
          path: null
        }
      }

      await expect(wrapper.vm.handleFavoriteNavigation(invalidEvent)).rejects.toThrow('Invalid navigation event: missing path')
    })

    it('devrait rejeter les chemins invalides', async () => {
      const invalidEvent = {
        path: '<invalid>path',
        source: 'favorite',
        favorite: {
          name: 'Test',
          path: '<invalid>path'
        }
      }

      await expect(wrapper.vm.handleFavoriteNavigation(invalidEvent)).rejects.toThrow('Invalid path format')
    })

    it('devrait accepter les chemins valides', async () => {
      const validPaths = [
        '/home/user/Documents',
        '/var/www/html',
        '/tmp',
        '/'
      ]

      for (const path of validPaths) {
        const event = {
          path,
          source: 'favorite',
          favorite: {
            name: 'Test',
            path
          }
        }

        await expect(wrapper.vm.handleFavoriteNavigation(event)).resolves.not.toThrow()
      }
    })
  })

  describe('handleFavoriteNavigation() - Vérification des permissions', () => {
    beforeEach(() => {
      wrapper = mount(User, {
        global: {
          mocks: globalMocks
        }
      })
    })

    it('devrait vérifier les permissions avant navigation', async () => {
      const navigationEvent = {
        path: '/home/user/Documents',
        source: 'favorite',
        favorite: {
          name: 'Documents',
          path: '/home/user/Documents'
        }
      }

      await wrapper.vm.handleFavoriteNavigation(navigationEvent)

      expect(mockFavoritesService.checkNavigationPermissions).toHaveBeenCalledWith(navigationEvent.favorite)
    })

    it('devrait bloquer la navigation si les permissions sont refusées', async () => {
      mockFavoritesService.checkNavigationPermissions.mockResolvedValue({
        canNavigate: false,
        errorType: 'PERMISSION_DENIED',
        error: 'Accès refusé'
      })

      const navigationEvent = {
        path: '/home/user/protected',
        source: 'favorite',
        favorite: {
          name: 'Protected',
          path: '/home/user/protected'
        }
      }

      await expect(wrapper.vm.handleFavoriteNavigation(navigationEvent)).rejects.toThrow('Permission denied')
    })

    it('devrait bloquer la navigation si le chemin n\'existe pas', async () => {
      mockFavoritesService.checkNavigationPermissions.mockResolvedValue({
        canNavigate: false,
        errorType: 'NOT_FOUND',
        error: 'Chemin inexistant'
      })

      const navigationEvent = {
        path: '/home/user/nonexistent',
        source: 'favorite',
        favorite: {
          name: 'NonExistent',
          path: '/home/user/nonexistent'
        }
      }

      await expect(wrapper.vm.handleFavoriteNavigation(navigationEvent)).rejects.toThrow('Path not found')
    })
  })

  describe('handleFavoriteNavigation() - Gestion d\'erreur et retry', () => {
    beforeEach(() => {
      wrapper = mount(User, {
        global: {
          mocks: globalMocks
        }
      })
      
      // Mock console pour éviter les logs pendant les tests
      vi.spyOn(console, 'log').mockImplementation(() => {})
      vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
      console.log.mockRestore()
      console.error.mockRestore()
    })

    it('devrait gérer les erreurs de permissions sans retry automatique', async () => {
      mockFavoritesService.checkNavigationPermissions.mockResolvedValue({
        canNavigate: false,
        errorType: 'PERMISSION_DENIED',
        error: 'Accès refusé'
      })

      const navigationEvent = {
        path: '/home/user/protected',
        source: 'favorite',
        favorite: {
          name: 'Protected',
          path: '/home/user/protected'
        }
      }

      try {
        await wrapper.vm.handleFavoriteNavigation(navigationEvent)
      } catch (error) {
        // L'erreur est attendue
      }

      // Le retry count devrait être réinitialisé à 0 pour les erreurs de permissions
      // car handleNavigationFailure remet le compteur à 0 pour les erreurs de permissions
      expect(wrapper.vm.navigationRetryCount).toBe(0)
    })

    it('devrait gérer les erreurs de chemin inexistant sans retry', async () => {
      mockFavoritesService.checkNavigationPermissions.mockResolvedValue({
        canNavigate: false,
        errorType: 'NOT_FOUND',
        error: 'Chemin inexistant'
      })

      const navigationEvent = {
        path: '/home/user/nonexistent',
        source: 'favorite',
        favorite: {
          name: 'NonExistent',
          path: '/home/user/nonexistent'
        }
      }

      try {
        await wrapper.vm.handleFavoriteNavigation(navigationEvent)
      } catch (error) {
        // L'erreur est attendue
      }

      // Le retry count devrait être réinitialisé à 0 pour les erreurs NOT_FOUND
      // car handleNavigationFailure remet le compteur à 0 pour ces erreurs
      expect(wrapper.vm.navigationRetryCount).toBe(0)
    })

    it('devrait incrémenter le retry count pour les erreurs génériques', async () => {
      const error = new Error('Erreur réseau temporaire')
      mockFavoritesService.checkNavigationPermissions.mockRejectedValue(error)

      const navigationEvent = {
        path: '/home/user/Documents',
        source: 'favorite',
        favorite: {
          name: 'Documents',
          path: '/home/user/Documents'
        }
      }

      try {
        await wrapper.vm.handleFavoriteNavigation(navigationEvent)
      } catch (e) {
        // L'erreur est attendue
      }

      expect(wrapper.vm.navigationRetryCount).toBe(1)
    })
  })

  describe('handleFavoriteNavigation() - Logging et debugging', () => {
    beforeEach(() => {
      wrapper = mount(User, {
        global: {
          mocks: globalMocks
        }
      })
      
      // Mock console.log pour vérifier les logs
      vi.spyOn(console, 'log').mockImplementation(() => {})
      vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
      console.log.mockRestore()
      console.error.mockRestore()
    })

    it('devrait logger le début de la navigation avec tous les détails', async () => {
      const navigationEvent = {
        path: '/home/user/Documents',
        source: 'favorite',
        favorite: {
          name: 'Documents',
          path: '/home/user/Documents'
        }
      }

      await wrapper.vm.handleFavoriteNavigation(navigationEvent)

      expect(console.log).toHaveBeenCalledWith(
        'User.handleFavoriteNavigation() - START',
        expect.objectContaining({
          event: expect.objectContaining({
            path: navigationEvent.path,
            source: navigationEvent.source,
            favorite: expect.objectContaining({
              name: navigationEvent.favorite.name,
              path: navigationEvent.favorite.path
            })
          }),
          currentState: expect.objectContaining({
            activeTab: expect.any(String),
            currentPath: expect.any(String),
            componentKey: expect.any(Number)
          })
        })
      )
    })

    it('devrait logger les erreurs avec le contexte complet', async () => {
      const error = new Error('Test error')
      mockFavoritesService.checkNavigationPermissions.mockRejectedValue(error)

      const navigationEvent = {
        path: '/home/user/Documents',
        source: 'favorite',
        favorite: {
          name: 'Documents',
          path: '/home/user/Documents'
        }
      }

      try {
        await wrapper.vm.handleFavoriteNavigation(navigationEvent)
      } catch (e) {
        // L'erreur est attendue
      }

      expect(console.error).toHaveBeenCalledWith(
        'User.handleFavoriteNavigation() - ERROR',
        expect.objectContaining({
          error: error.message,
          event: navigationEvent,
          currentState: expect.objectContaining({
            activeTab: expect.any(String),
            currentPath: expect.any(String)
          })
        })
      )
    })

    it('devrait logger le succès avec l\'état final', async () => {
      const navigationEvent = {
        path: '/home/user/Documents',
        source: 'favorite',
        favorite: {
          name: 'Documents',
          path: '/home/user/Documents'
        }
      }

      await wrapper.vm.handleFavoriteNavigation(navigationEvent)

      expect(console.log).toHaveBeenCalledWith(
        'User.handleFavoriteNavigation() - SUCCESS',
        expect.objectContaining({
          finalState: expect.objectContaining({
            path: '/home/user/Documents',
            activeTab: 'files',
            componentKey: expect.any(Number)
          })
        })
      )
    })
  })

  describe('handleFavoriteNavigation() - Intégration avec les composants', () => {
    beforeEach(() => {
      wrapper = mount(User, {
        global: {
          mocks: globalMocks
        }
      })
    })

    it('devrait passer le bon externalPath au FileExplorer', async () => {
      const navigationEvent = {
        path: '/home/user/Documents',
        source: 'favorite',
        favorite: {
          name: 'Documents',
          path: '/home/user/Documents'
        }
      }

      await wrapper.vm.handleFavoriteNavigation(navigationEvent)
      await nextTick()

      // Vérifier que l'onglet files est actif
      expect(wrapper.vm.activeTab).toBe('files')
      
      // Le FileExplorer devrait recevoir le bon externalPath
      const fileExplorer = wrapper.findComponent({ name: 'FileExplorer' })
      expect(fileExplorer.props('externalPath')).toBe('/home/user/Documents')
    })

    it('devrait mettre à jour la clé du composant pour forcer le refresh', async () => {
      const initialKey = wrapper.vm.componentKey
      
      // Navigation vers le même chemin que le chemin actuel
      wrapper.vm.currentPath = '/home/user/Documents'
      
      const navigationEvent = {
        path: '/home/user/Documents',
        source: 'favorite',
        favorite: {
          name: 'Documents',
          path: '/home/user/Documents'
        }
      }

      await wrapper.vm.handleFavoriteNavigation(navigationEvent)
      await nextTick()

      expect(wrapper.vm.componentKey).toBeGreaterThan(initialKey)
    })
  })

  describe('Méthodes utilitaires', () => {
    beforeEach(() => {
      wrapper = mount(User, {
        global: {
          mocks: globalMocks
        }
      })
    })

    it('isValidPath devrait valider correctement les chemins', () => {
      const validPaths = [
        '/',
        '/home',
        '/home/user',
        '/var/www/html'
      ]

      const invalidPaths = [
        '',
        null,
        undefined,
        '/path/with<invalid>chars',
        '/path/with|pipe',
        '/path/with"quotes'
      ]

      validPaths.forEach(path => {
        expect(wrapper.vm.isValidPath(path)).toBe(true)
      })

      invalidPaths.forEach(path => {
        expect(wrapper.vm.isValidPath(path)).toBe(false)
      })
      
      // Test spécial pour 'relative/path' qui devrait être invalide car ne commence pas par /
      expect(wrapper.vm.isValidPath('relative/path')).toBe(false)
    })

    it('normalizePath devrait normaliser correctement les chemins', () => {
      const testCases = [
        { input: '/home/user/', expected: '/home/user' },
        { input: '/home//user', expected: '/home/user' },
        { input: '/', expected: '/' },
        { input: '', expected: '/' },
        { input: null, expected: '/' },
        { input: 'relative', expected: '/relative' }
      ]

      testCases.forEach(({ input, expected }) => {
        expect(wrapper.vm.normalizePath(input)).toBe(expected)
      })
    })
  })
})