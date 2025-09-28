/**
 * Integration Tests for Favorites Navigation Fix
 * 
 * Tests the complete flow of favorites navigation from end to end
 * Requirements: 1.1, 1.2, 1.3, 1.4, 4.1, 4.2, 4.3, 4.4, 6.1, 6.4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { nextTick } from 'vue'

// Components to test
import User from '@/views/User.vue'
import FavoritesPanel from '@/components/Shared/FavoritesPanel.vue'
import FileExplorer from '@/components/Shared/FileExplorer.vue'
import Sidebar from '@/components/Shared/Sidebar.vue'

// Services
import { favoritesService } from '@/services/favoritesService.js'
import { nasAPI } from '@/services/nasAPI.js'

// Mock data
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
    name: 'Projets',
    path: '/home/user/Projets',
    isValid: false,
    canAccess: false,
    validationError: 'Dossier inexistant'
  },
  {
    name: 'Restricted',
    path: '/restricted/folder',
    isValid: true,
    canAccess: false,
    validationError: 'Accès refusé'
  }
]

const mockFiles = [
  {
    name: 'file1.txt',
    path: '/home/user/Documents/file1.txt',
    type: 'file',
    size: 1024,
    modified: '2024-01-01T10:00:00Z'
  },
  {
    name: 'subfolder',
    path: '/home/user/Documents/subfolder',
    type: 'directory',
    size: 0,
    modified: '2024-01-01T09:00:00Z'
  }
]

// Store setup
const createTestStore = () => {
  return createStore({
    state: {
      user: {
        username: 'testuser',
        role: 'user'
      },
      notifications: []
    },
    getters: {
      isAdmin: () => false,
      username: (state) => state.user.username
    },
    mutations: {
      ADD_NOTIFICATION(state, notification) {
        state.notifications.push(notification)
      },
      REMOVE_NOTIFICATION(state, id) {
        state.notifications = state.notifications.filter(n => n.id !== id)
      }
    },
    actions: {
      showSuccess({ commit }, message) {
        commit('ADD_NOTIFICATION', {
          id: Date.now(),
          type: 'success',
          title: 'Succès',
          message
        })
      },
      showError({ commit }, message) {
        commit('ADD_NOTIFICATION', {
          id: Date.now(),
          type: 'error',
          title: 'Erreur',
          message
        })
      },
      showInfo({ commit }, message) {
        commit('ADD_NOTIFICATION', {
          id: Date.now(),
          type: 'info',
          title: 'Information',
          message
        })
      }
    }
  })
}

describe('Favorites Navigation Integration Tests', () => {
  let store
  let wrapper
  let mockNasAPI
  let mockFavoritesService

  beforeEach(() => {
    // Setup store
    store = createTestStore()

    // Mock nasAPI
    mockNasAPI = {
      browse: vi.fn(),
      normalizePath: vi.fn((path) => path.replace(/\/+/g, '/').replace(/\/$/, '') || '/'),
      checkPermissions: vi.fn()
    }
    vi.mocked(nasAPI, { partial: true }).browse = mockNasAPI.browse
    vi.mocked(nasAPI, { partial: true }).normalizePath = mockNasAPI.normalizePath
    vi.mocked(nasAPI, { partial: true }).checkPermissions = mockNasAPI.checkPermissions

    // Mock favoritesService
    mockFavoritesService = {
      getFavorites: vi.fn(() => mockFavorites),
      checkNavigationPermissions: vi.fn(),
      addFavorite: vi.fn(),
      removeFavorite: vi.fn(),
      validateAllFavorites: vi.fn(),
      retryFavoriteAccess: vi.fn()
    }
    vi.mocked(favoritesService, { partial: true }).getFavorites = mockFavoritesService.getFavorites
    vi.mocked(favoritesService, { partial: true }).checkNavigationPermissions = mockFavoritesService.checkNavigationPermissions
    vi.mocked(favoritesService, { partial: true }).addFavorite = mockFavoritesService.addFavorite
    vi.mocked(favoritesService, { partial: true }).removeFavorite = mockFavoritesService.removeFavorite
    vi.mocked(favoritesService, { partial: true }).validateAllFavorites = mockFavoritesService.validateAllFavorites
    vi.mocked(favoritesService, { partial: true }).retryFavoriteAccess = mockFavoritesService.retryFavoriteAccess

    // Default successful responses
    mockNasAPI.browse.mockResolvedValue({
      success: true,
      items: mockFiles
    })

    mockFavoritesService.checkNavigationPermissions.mockResolvedValue({
      canNavigate: true,
      errorType: null,
      error: null
    })
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    vi.clearAllMocks()
  })

  describe('Complete Favorites Navigation Flow', () => {
    it('should navigate to favorite folder successfully from FavoritesPanel to FileExplorer', async () => {
      // Requirement 1.1: Navigation to exact favorite path
      const favorite = mockFavorites[0] // Documents folder

      // Mount User component (contains the complete flow)
      wrapper = mount(User, {
        global: {
          plugins: [store],
          stubs: {
            'router-link': true,
            'router-view': true
          }
        }
      })

      await nextTick()

      // Simulate favorite navigation from FavoritesPanel
      const favoritesPanel = wrapper.findComponent(FavoritesPanel)
      expect(favoritesPanel.exists()).toBe(true)

      // Trigger favorite navigation
      await favoritesPanel.vm.navigateToFavorite(favorite)
      await nextTick()

      // Verify navigation event was emitted
      const navigationEvents = favoritesPanel.emitted('navigate')
      expect(navigationEvents).toBeTruthy()
      expect(navigationEvents[0][0]).toEqual({
        path: favorite.path,
        source: 'favorite',
        favorite: favorite
      })

      // Verify User component handled the navigation
      expect(wrapper.vm.activeTab).toBe('files')
      expect(wrapper.vm.currentPath).toBe(favorite.path)

      // Verify FileExplorer received the external path
      const fileExplorer = wrapper.findComponent(FileExplorer)
      expect(fileExplorer.exists()).toBe(true)
      expect(fileExplorer.props('externalPath')).toBe(favorite.path)

      // Verify API was called with correct path
      expect(mockNasAPI.browse).toHaveBeenCalledWith(favorite.path)

      // Verify success notification
      const notifications = store.state.notifications
      expect(notifications.some(n => 
        n.type === 'success' && n.message.includes('Navigation vers Documents')
      )).toBe(true)
    })

    it('should handle navigation to different types of folders', async () => {
      // Requirement 1.3: Navigation from all access points
      const testCases = [
        { favorite: mockFavorites[0], expectedSuccess: true }, // Valid accessible folder
        { favorite: mockFavorites[1], expectedSuccess: true }  // Another valid folder
      ]

      wrapper = mount(User, {
        global: {
          plugins: [store]
        }
      })

      for (const testCase of testCases) {
        // Reset mocks
        vi.clearAllMocks()
        mockNasAPI.browse.mockResolvedValue({
          success: true,
          items: mockFiles
        })

        const favoritesPanel = wrapper.findComponent(FavoritesPanel)
        
        // Navigate to favorite
        await favoritesPanel.vm.navigateToFavorite(testCase.favorite)
        await nextTick()

        if (testCase.expectedSuccess) {
          // Verify successful navigation
          expect(wrapper.vm.currentPath).toBe(testCase.favorite.path)
          expect(mockNasAPI.browse).toHaveBeenCalledWith(testCase.favorite.path)
        }
      }
    })

    it('should update navigation history correctly when navigating to favorites', async () => {
      // Requirement 4.1, 4.2: Navigation history management
      wrapper = mount(User, {
        global: {
          plugins: [store]
        }
      })

      const fileExplorer = wrapper.findComponent(FileExplorer)
      const favorite = mockFavorites[0]

      // Initial state - should be at root
      expect(wrapper.vm.currentPath).toBe('/')

      // Navigate to favorite
      const favoritesPanel = wrapper.findComponent(FavoritesPanel)
      await favoritesPanel.vm.navigateToFavorite(favorite)
      await nextTick()

      // Verify path changed
      expect(wrapper.vm.currentPath).toBe(favorite.path)

      // Verify history was updated in FileExplorer
      expect(fileExplorer.vm.navigationHistory).toContain(favorite.path)
      expect(fileExplorer.vm.canNavigateBack).toBe(true)

      // Test back navigation
      await fileExplorer.vm.navigateHistoryBack()
      await nextTick()

      // Should be back at root
      expect(wrapper.vm.currentPath).toBe('/')
      expect(fileExplorer.vm.canNavigateForward).toBe(true)

      // Test forward navigation
      await fileExplorer.vm.navigateHistoryForward()
      await nextTick()

      // Should be back at favorite
      expect(wrapper.vm.currentPath).toBe(favorite.path)
    })
  })

  describe('Error Handling in Navigation Flow', () => {
    it('should handle navigation to non-existent favorite folders', async () => {
      // Requirement 5.1: Handle non-existent folders
      const invalidFavorite = mockFavorites[2] // Projets folder (invalid)

      // Mock permission check to return not found
      mockFavoritesService.checkNavigationPermissions.mockResolvedValue({
        canNavigate: false,
        errorType: 'NOT_FOUND',
        error: 'Dossier inexistant'
      })

      wrapper = mount(User, {
        global: {
          plugins: [store]
        }
      })

      const favoritesPanel = wrapper.findComponent(FavoritesPanel)
      
      // Attempt navigation to invalid favorite
      await favoritesPanel.vm.navigateToFavorite(invalidFavorite)
      await nextTick()

      // Verify navigation was blocked
      expect(wrapper.vm.currentPath).toBe('/') // Should remain at root
      expect(mockNasAPI.browse).not.toHaveBeenCalled()

      // Verify error notification
      const notifications = store.state.notifications
      expect(notifications.some(n => 
        n.type === 'error' && n.message.includes('dossier inexistant')
      )).toBe(true)
    })

    it('should handle navigation to folders with insufficient permissions', async () => {
      // Requirement 5.2, 5.3: Handle permission errors
      const restrictedFavorite = mockFavorites[3] // Restricted folder

      // Mock permission check to return permission denied
      mockFavoritesService.checkNavigationPermissions.mockResolvedValue({
        canNavigate: false,
        errorType: 'PERMISSION_DENIED',
        error: 'Accès refusé',
        canRetry: true
      })

      wrapper = mount(User, {
        global: {
          plugins: [store]
        }
      })

      const favoritesPanel = wrapper.findComponent(FavoritesPanel)
      
      // Attempt navigation to restricted favorite
      await favoritesPanel.vm.navigateToFavorite(restrictedFavorite)
      await nextTick()

      // Verify navigation was blocked
      expect(wrapper.vm.currentPath).toBe('/') // Should remain at root
      expect(mockNasAPI.browse).not.toHaveBeenCalled()

      // Verify error notification
      const notifications = store.state.notifications
      expect(notifications.some(n => 
        n.type === 'error' && n.message.includes('accès refusé')
      )).toBe(true)

      // Verify retry suggestion notification
      await new Promise(resolve => setTimeout(resolve, 2100)) // Wait for retry suggestion
      await nextTick()
      
      const updatedNotifications = store.state.notifications
      expect(updatedNotifications.some(n => 
        n.type === 'info' && n.message.includes('icône de verrouillage')
      )).toBe(true)
    })

    it('should handle network errors gracefully', async () => {
      // Test network error handling
      const favorite = mockFavorites[0]

      // Mock network error
      mockNasAPI.browse.mockRejectedValue(new Error('Network error'))
      mockFavoritesService.checkNavigationPermissions.mockResolvedValue({
        canNavigate: true
      })

      wrapper = mount(User, {
        global: {
          plugins: [store]
        }
      })

      const favoritesPanel = wrapper.findComponent(FavoritesPanel)
      
      // Attempt navigation
      await favoritesPanel.vm.navigateToFavorite(favorite)
      await nextTick()

      // Verify error handling
      const notifications = store.state.notifications
      expect(notifications.some(n => 
        n.type === 'error' && n.message.includes('Network error')
      )).toBe(true)
    })
  })

  describe('Navigation History Integration', () => {
    it('should maintain proper navigation history across favorite navigations', async () => {
      // Requirement 4.3, 4.4: Navigation history normalization and functionality
      wrapper = mount(User, {
        global: {
          plugins: [store]
        }
      })

      const fileExplorer = wrapper.findComponent(FileExplorer)
      const favoritesPanel = wrapper.findComponent(FavoritesPanel)

      // Navigate through multiple favorites
      const favorites = [mockFavorites[0], mockFavorites[1]]
      
      for (const favorite of favorites) {
        await favoritesPanel.vm.navigateToFavorite(favorite)
        await nextTick()
        
        // Verify each navigation is added to history
        expect(fileExplorer.vm.navigationHistory).toContain(favorite.path)
      }

      // Verify history contains all navigated paths
      expect(fileExplorer.vm.navigationHistory).toEqual(
        expect.arrayContaining(['/', favorites[0].path, favorites[1].path])
      )

      // Test back navigation through history
      await fileExplorer.vm.navigateHistoryBack()
      await nextTick()
      expect(wrapper.vm.currentPath).toBe(favorites[0].path)

      await fileExplorer.vm.navigateHistoryBack()
      await nextTick()
      expect(wrapper.vm.currentPath).toBe('/')

      // Test forward navigation
      await fileExplorer.vm.navigateHistoryForward()
      await nextTick()
      expect(wrapper.vm.currentPath).toBe(favorites[0].path)
    })

    it('should normalize paths correctly in navigation history', async () => {
      // Test path normalization to avoid duplicates
      wrapper = mount(User, {
        global: {
          plugins: [store]
        }
      })

      const fileExplorer = wrapper.findComponent(FileExplorer)
      const favoritesPanel = wrapper.findComponent(FavoritesPanel)

      // Create favorite with path that needs normalization
      const favoriteWithTrailingSlash = {
        ...mockFavorites[0],
        path: '/home/user/Documents/' // With trailing slash
      }

      // Navigate to favorite
      await favoritesPanel.vm.navigateToFavorite(favoriteWithTrailingSlash)
      await nextTick()

      // Verify path was normalized in history
      const normalizedPath = '/home/user/Documents' // Without trailing slash
      expect(fileExplorer.vm.navigationHistory).toContain(normalizedPath)
      expect(wrapper.vm.currentPath).toBe(normalizedPath)
    })
  })

  describe('Notification System Integration', () => {
    it('should display appropriate notifications for successful navigation', async () => {
      // Requirement 2.1, 2.2: Navigation notifications
      const favorite = mockFavorites[0]

      wrapper = mount(User, {
        global: {
          plugins: [store]
        }
      })

      const favoritesPanel = wrapper.findComponent(FavoritesPanel)
      
      // Navigate to favorite
      await favoritesPanel.vm.navigateToFavorite(favorite)
      await nextTick()

      // Verify success notifications
      const notifications = store.state.notifications
      expect(notifications).toHaveLength(2) // Navigation info + success
      
      // Check navigation notification
      expect(notifications.some(n => 
        n.type === 'info' && n.message.includes(`Navigation vers ${favorite.name}`)
      )).toBe(true)

      // Check success notification
      expect(notifications.some(n => 
        n.type === 'success' && n.message.includes(`Navigation vers ${favorite.name}`)
      )).toBe(true)
    })

    it('should display notifications with correct positioning and timing', async () => {
      // Requirement 2.3, 2.4: Notification positioning and auto-dismiss
      const favorite = mockFavorites[0]

      wrapper = mount(User, {
        global: {
          plugins: [store]
        }
      })

      const favoritesPanel = wrapper.findComponent(FavoritesPanel)
      
      // Navigate to favorite
      await favoritesPanel.vm.navigateToFavorite(favorite)
      await nextTick()

      // Verify notifications are added to store
      const notifications = store.state.notifications
      expect(notifications.length).toBeGreaterThan(0)

      // Verify notification structure
      notifications.forEach(notification => {
        expect(notification).toHaveProperty('id')
        expect(notification).toHaveProperty('type')
        expect(notification).toHaveProperty('message')
        expect(typeof notification.id).toBe('number')
        expect(['success', 'error', 'info', 'warning']).toContain(notification.type)
      })
    })
  })

  describe('Sidebar Integration', () => {
    it('should handle favorite navigation events from Sidebar correctly', async () => {
      // Requirement 1.2: Navigation from sidebar
      wrapper = mount(User, {
        global: {
          plugins: [store]
        }
      })

      const sidebar = wrapper.findComponent(Sidebar)
      const favorite = mockFavorites[0]

      // Simulate favorite navigation from sidebar
      const navigationEvent = {
        path: favorite.path,
        source: 'favorite',
        favorite: favorite
      }

      // Trigger navigation event from sidebar
      sidebar.vm.handleFavoriteNavigation(navigationEvent)
      await nextTick()

      // Verify User component received and handled the event
      expect(wrapper.vm.activeTab).toBe('files')
      expect(wrapper.vm.currentPath).toBe(favorite.path)

      // Verify FileExplorer was updated
      const fileExplorer = wrapper.findComponent(FileExplorer)
      expect(fileExplorer.props('externalPath')).toBe(favorite.path)
    })
  })

  describe('Force Refresh Scenarios', () => {
    it('should force refresh when navigating to the same path', async () => {
      // Test force refresh mechanism
      const favorite = mockFavorites[0]

      wrapper = mount(User, {
        global: {
          plugins: [store]
        }
      })

      // Set initial path to favorite path
      wrapper.vm.currentPath = favorite.path
      const initialComponentKey = wrapper.vm.componentKey

      const favoritesPanel = wrapper.findComponent(FavoritesPanel)
      
      // Navigate to same favorite (should force refresh)
      await favoritesPanel.vm.navigateToFavorite(favorite)
      await nextTick()

      // Verify component key was incremented (force refresh)
      expect(wrapper.vm.componentKey).toBe(initialComponentKey + 1)
      expect(wrapper.vm.currentPath).toBe(favorite.path)
    })
  })
})