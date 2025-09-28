/**
 * @fileoverview Tests unitaires pour le composant FavoritesPanel
 * Focus sur la navigation des favoris
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import FavoritesPanel from '../FavoritesPanel.vue'
import { favoritesService } from '@/services/favoritesService.js'

// Mock du service favoris
vi.mock('@/services/favoritesService.js', () => ({
  favoritesService: {
    getFavorites: vi.fn(),
    checkNavigationPermissions: vi.fn(),
    maxFavorites: 10,
    onFavoritesChanged: vi.fn(() => () => {}), // Return unsubscribe function
    addFavorite: vi.fn(),
    removeFavorite: vi.fn(),
    isFavorite: vi.fn(),
    validateAllFavorites: vi.fn(),
    removeInvalidFavorites: vi.fn(),
    retryFavoriteAccess: vi.fn(),
    exportFavorites: vi.fn(),
    importFavorites: vi.fn(),
    clearAllFavorites: vi.fn()
  }
}))

// Mock du store Vuex
const mockStore = {
  dispatch: vi.fn()
}

vi.mock('vuex', () => ({
  useStore: () => mockStore
}))

describe('FavoritesPanel - Navigation des favoris', () => {
  let wrapper

  const mockFavorites = [
    {
      name: 'Documents',
      path: '/home/user/Documents',
      isValid: true,
      canAccess: true
    },
    {
      name: 'Photos',
      path: '/home/user/Photos',
      isValid: true,
      canAccess: true
    },
    {
      name: 'Dossier Invalide',
      path: '/home/user/invalid',
      isValid: false,
      canAccess: false,
      validationError: 'Dossier inexistant'
    },
    {
      name: 'Dossier Protégé',
      path: '/home/user/protected',
      isValid: true,
      canAccess: false
    }
  ]

  beforeEach(() => {
    // Reset des mocks
    vi.clearAllMocks()
    
    // Configuration par défaut du service favoris
    favoritesService.getFavorites.mockReturnValue(mockFavorites)
    favoritesService.checkNavigationPermissions.mockResolvedValue({
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

  describe('navigateToFavorite() - Scénarios de succès', () => {
    beforeEach(() => {
      wrapper = mount(FavoritesPanel, {
        props: {
          currentPath: '/',
          compact: false
        }
      })
    })

    it('devrait émettre un événement navigate avec les bonnes données pour un favori valide', async () => {
      const favorite = mockFavorites[0] // Documents - valide et accessible
      
      await wrapper.vm.navigateToFavorite(favorite)
      await nextTick()

      // Vérifier que l'événement navigate a été émis
      const navigateEvents = wrapper.emitted('navigate')
      expect(navigateEvents).toBeTruthy()
      expect(navigateEvents[0][0]).toMatchObject({
        path: favorite.path,
        source: 'favorite',
        favorite: favorite
      })
    })

    it('devrait vérifier les permissions avant la navigation', async () => {
      const favorite = mockFavorites[0]
      
      await wrapper.vm.navigateToFavorite(favorite)

      expect(favoritesService.checkNavigationPermissions).toHaveBeenCalledWith(favorite)
    })

    it('devrait afficher une notification de succès lors de la navigation', async () => {
      const favorite = mockFavorites[0]
      
      await wrapper.vm.navigateToFavorite(favorite)

      expect(mockStore.dispatch).toHaveBeenCalledWith('showInfo', `Navigation vers ${favorite.name}`)
    })

    it('devrait gérer la navigation vers différents types de favoris', async () => {
      const favorites = [mockFavorites[0], mockFavorites[1]]
      
      for (const favorite of favorites) {
        await wrapper.vm.navigateToFavorite(favorite)
        
        const navigateEvents = wrapper.emitted('navigate')
        const lastEvent = navigateEvents[navigateEvents.length - 1][0]
        
        expect(lastEvent.path).toBe(favorite.path)
        expect(lastEvent.source).toBe('favorite')
        expect(lastEvent.favorite).toEqual(favorite)
      }
    })
  })

  describe('navigateToFavorite() - Gestion des erreurs', () => {
    beforeEach(() => {
      wrapper = mount(FavoritesPanel, {
        props: {
          currentPath: '/',
          compact: false
        }
      })
    })

    it('devrait gérer les favoris avec dossier inexistant', async () => {
      const favorite = mockFavorites[2] // Dossier invalide
      
      // Mock de la vérification des permissions pour un dossier inexistant
      favoritesService.checkNavigationPermissions.mockResolvedValue({
        canNavigate: false,
        errorType: 'NOT_FOUND',
        error: 'Dossier inexistant',
        canRetry: false
      })

      await wrapper.vm.navigateToFavorite(favorite)

      // Vérifier qu'aucun événement navigate n'a été émis
      expect(wrapper.emitted('navigate')).toBeFalsy()
      
      // Vérifier que l'erreur appropriée a été affichée
      expect(mockStore.dispatch).toHaveBeenCalledWith(
        'showError', 
        `Impossible de naviguer vers ${favorite.name} : dossier inexistant`
      )
    })

    it('devrait gérer les favoris avec permissions insuffisantes', async () => {
      const favorite = mockFavorites[3] // Dossier protégé
      
      favoritesService.checkNavigationPermissions.mockResolvedValue({
        canNavigate: false,
        errorType: 'PERMISSION_DENIED',
        error: 'Accès refusé',
        canRetry: true
      })

      await wrapper.vm.navigateToFavorite(favorite)

      // Vérifier qu'aucun événement navigate n'a été émis
      expect(wrapper.emitted('navigate')).toBeFalsy()
      
      // Vérifier que l'erreur appropriée a été affichée
      expect(mockStore.dispatch).toHaveBeenCalledWith(
        'showError', 
        `Impossible de naviguer vers ${favorite.name} : accès refusé`
      )
    })

    it('devrait suggérer le bouton de réessai pour les erreurs de permissions', async () => {
      const favorite = mockFavorites[3]
      
      favoritesService.checkNavigationPermissions.mockResolvedValue({
        canNavigate: false,
        errorType: 'PERMISSION_DENIED',
        error: 'Accès refusé',
        canRetry: true
      })

      await wrapper.vm.navigateToFavorite(favorite)

      // Attendre le timeout pour le message de suggestion
      await new Promise(resolve => setTimeout(resolve, 2100))

      expect(mockStore.dispatch).toHaveBeenCalledWith(
        'showInfo', 
        'Cliquez sur l\'icône de verrouillage pour réessayer l\'accès'
      )
    })

    it('devrait gérer les erreurs génériques', async () => {
      const favorite = mockFavorites[0]
      
      favoritesService.checkNavigationPermissions.mockResolvedValue({
        canNavigate: false,
        errorType: 'GENERIC_ERROR',
        error: 'Erreur inconnue',
        canRetry: false
      })

      await wrapper.vm.navigateToFavorite(favorite)

      expect(wrapper.emitted('navigate')).toBeFalsy()
      expect(mockStore.dispatch).toHaveBeenCalledWith(
        'showError', 
        `Impossible de naviguer vers ${favorite.name} : Erreur inconnue`
      )
    })

    it('devrait gérer les exceptions lors de la vérification des permissions', async () => {
      const favorite = mockFavorites[0]
      const error = new Error('Erreur réseau')
      
      favoritesService.checkNavigationPermissions.mockRejectedValue(error)

      await wrapper.vm.navigateToFavorite(favorite)

      expect(wrapper.emitted('navigate')).toBeFalsy()
      expect(mockStore.dispatch).toHaveBeenCalledWith(
        'showError', 
        `Erreur lors de la navigation : ${error.message}`
      )
    })
  })

  describe('navigateToFavorite() - Logging et debugging', () => {
    beforeEach(() => {
      wrapper = mount(FavoritesPanel, {
        props: {
          currentPath: '/',
          compact: false
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

    it('devrait logger le début et la fin de la navigation avec succès', async () => {
      const favorite = mockFavorites[0]
      
      await wrapper.vm.navigateToFavorite(favorite)

      // Vérifier les logs de début
      expect(console.log).toHaveBeenCalledWith(
        'FavoritesPanel.navigateToFavorite() - START',
        expect.objectContaining({
          favorite: expect.objectContaining({
            name: favorite.name,
            path: favorite.path
          })
        })
      )

      // Vérifier les logs de succès
      expect(console.log).toHaveBeenCalledWith(
        'FavoritesPanel.navigateToFavorite() - SUCCESS',
        expect.objectContaining({
          favoriteName: favorite.name,
          favoritePath: favorite.path
        })
      )
    })

    it('devrait logger les erreurs avec les détails appropriés', async () => {
      const favorite = mockFavorites[0]
      const error = new Error('Test error')
      
      favoritesService.checkNavigationPermissions.mockRejectedValue(error)

      await wrapper.vm.navigateToFavorite(favorite)

      expect(console.error).toHaveBeenCalledWith(
        'FavoritesPanel.navigateToFavorite() - ERROR',
        expect.objectContaining({
          error: error.message,
          favorite: expect.objectContaining({
            name: favorite.name,
            path: favorite.path
          })
        })
      )
    })

    it('devrait logger les vérifications de permissions', async () => {
      const favorite = mockFavorites[0]
      
      await wrapper.vm.navigateToFavorite(favorite)

      expect(console.log).toHaveBeenCalledWith(
        'FavoritesPanel.navigateToFavorite() - Checking permissions',
        expect.objectContaining({
          favoritePath: favorite.path,
          favoriteValid: favorite.isValid,
          favoriteAccess: favorite.canAccess
        })
      )
    })
  })

  describe('navigateToFavorite() - États des favoris', () => {
    beforeEach(() => {
      wrapper = mount(FavoritesPanel, {
        props: {
          currentPath: '/',
          compact: false
        }
      })
    })

    it('devrait bloquer la navigation pour les favoris invalides', async () => {
      const favorite = mockFavorites[2] // Favori invalide
      
      favoritesService.checkNavigationPermissions.mockResolvedValue({
        canNavigate: false,
        errorType: 'NOT_FOUND',
        error: 'Dossier inexistant'
      })

      await wrapper.vm.navigateToFavorite(favorite)

      expect(wrapper.emitted('navigate')).toBeFalsy()
    })

    it('devrait permettre la navigation pour les favoris valides et accessibles', async () => {
      const favorite = mockFavorites[0] // Favori valide et accessible
      
      await wrapper.vm.navigateToFavorite(favorite)

      expect(wrapper.emitted('navigate')).toBeTruthy()
    })

    it('devrait gérer les favoris avec accès limité', async () => {
      const favorite = mockFavorites[3] // Favori valide mais non accessible
      
      favoritesService.checkNavigationPermissions.mockResolvedValue({
        canNavigate: false,
        errorType: 'PERMISSION_DENIED',
        error: 'Permissions insuffisantes',
        canRetry: true
      })

      await wrapper.vm.navigateToFavorite(favorite)

      expect(wrapper.emitted('navigate')).toBeFalsy()
      expect(mockStore.dispatch).toHaveBeenCalledWith(
        'showError',
        expect.stringContaining('accès refusé')
      )
    })
  })

  describe('navigateToFavorite() - Intégration avec les événements', () => {
    beforeEach(() => {
      wrapper = mount(FavoritesPanel, {
        props: {
          currentPath: '/',
          compact: false
        }
      })
    })

    it('devrait émettre l\'événement navigate avec toutes les propriétés requises', async () => {
      const favorite = mockFavorites[0]
      
      await wrapper.vm.navigateToFavorite(favorite)

      const navigateEvents = wrapper.emitted('navigate')
      expect(navigateEvents[0][0]).toEqual({
        path: favorite.path,
        source: 'favorite',
        favorite: favorite
      })
    })

    it('devrait maintenir la cohérence des données dans l\'événement émis', async () => {
      const favorite = mockFavorites[1]
      
      await wrapper.vm.navigateToFavorite(favorite)

      const navigateEvent = wrapper.emitted('navigate')[0][0]
      
      expect(navigateEvent.path).toBe(favorite.path)
      expect(navigateEvent.favorite.name).toBe(favorite.name)
      expect(navigateEvent.favorite.path).toBe(favorite.path)
      expect(navigateEvent.source).toBe('favorite')
    })
  })
})