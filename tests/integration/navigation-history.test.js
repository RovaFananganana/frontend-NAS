/**
 * Integration Tests for Navigation History
 * 
 * Tests the navigation history functionality across the application
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { nextTick } from 'vue'

// Components to test
import User from '@/views/User.vue'
import FileExplorer from '@/components/Shared/FileExplorer.vue'
import FavoritesPanel from '@/components/Shared/FavoritesPanel.vue'

// Services
import { nasAPI } from '@/services/nasAPI.js'
import { favoritesService } from '@/services/favoritesService.js'

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
    name: 'Projects',
    path: '/home/user/Projects',
    isValid: true,
    canAccess: true
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

describe('Navigation History Integration Tests', () => {
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
      normalizePath: vi.fn((path) => {
        if (!path) return '/'
        return path.replace(/\/+/g, '/').replace(/\/$/, '') || '/'
      })
    }
    vi.mocked(nasAPI, { partial: true }).browse = mockNasAPI.browse
    vi.mocked(nasAPI, { partial: true }).normalizePath = mockNasAPI.normalizePath

    // Mock favoritesService
    mockFavoritesService = {
      getFavorites: vi.fn(() => mockFavorites),
      checkNavigationPermissions: vi.fn(() => Promise.resolve({
        canNavigate: true,
        errorType: null,
        error: null
      }))
    }
    vi.mocked(favoritesService, { partial: true }).getFavorites = mockFavoritesService.getFavorites
    vi.mocked(favoritesService, { partial: true }).checkNavigationPermissions = mockFavoritesService.checkNavigationPermissions

    // Default successful responses
    mockNasAPI.browse.mockResolvedValue({
      success: true,
      items: mockFiles
    })
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    vi.clearAllMocks()
  })

  describe('Navigation History Management', () => {
    it('should update navigation history when navigating to favorites', async () => {
      // Requirement 4.1: Navigation history updated with new path
      wrapper = mount(User, {
        global: {
          plugins: [store]
        }
      })

      const fileExplorer = wrapper.findComponent(FileExplorer)
      const favoritesPanel = wrapper.findComponent(FavoritesPanel)
      const favorite = mockFavorites[0]

      // Initial state - should be at root
      expect(fileExplorer.vm.navigationHistory).toEqual(['/'])
      expect(fileExplorer.vm.historyIndex).toBe(0)

      // Navigate to favorite
      await favoritesPanel.vm.navigateToFavorite(favorite)
      await nextTick()

      // Verify history was updated
      expect(fileExplorer.vm.navigationHistory).toContain(favorite.path)
      expect(fileExplorer.vm.navigationHistory.length).toBe(2)
      expect(fileExplorer.vm.historyIndex).toBe(1)
      expect(fileExplorer.vm.navigationHistory[1]).toBe(favorite.path)
    })

    it('should enable back button after navigating to favorites', async () => {
      // Requirement 4.2: Back button functionality
      wrapper = mount(User, {
        global: {
          plugins: [store]
        }
      })

      const fileExplorer = wrapper.findComponent(FileExplorer)
      const favoritesPanel = wrapper.findComponent(FavoritesPanel)
      const favorite = mockFavorites[0]

      // Initially, back button should be disabled
      expect(fileExplorer.vm.canNavigateBack).toBe(false)

      // Navigate to favorite
      await favoritesPanel.vm.navigateToFavorite(favorite)
      await nextTick()

      // Back button should now be enabled
      expect(fileExplorer.vm.canNavigateBack).toBe(true)
      expect(fileExplorer.vm.canNavigateForward).toBe(false)

      // Test back navigation
      await fileExplorer.vm.navigateHistoryBack()
      await nextTick()

      // Should be back at root
      expect(wrapper.vm.currentPath).toBe('/')
      expect(fileExplorer.vm.canNavigateBack).toBe(false)
      expect(fileExplorer.vm.canNavigateForward).toBe(true)
    })

    it('should handle forward navigation after using back button', async () => {
      // Requirement 4.2: Forward button functionality
      wrapper = mount(User, {
        global: {
          plugins: [store]
        }
      })

      const fileExplorer = wrapper.findComponent(FileExplorer)
      const favoritesPanel = wrapper.findComponent(FavoritesPanel)
      const favorite = mockFavorites[0]

      // Navigate to favorite
      await favoritesPanel.vm.navigateToFavorite(favorite)
      await nextTick()

      // Go back
      await fileExplorer.vm.navigateHistoryBack()
      await nextTick()

      // Should be at root with forward enabled
      expect(wrapper.vm.currentPath).toBe('/')
      expect(fileExplorer.vm.canNavigateForward).toBe(true)

      // Go forward
      await fileExplorer.vm.navigateHistoryForward()
      await nextTick()

      // Should be back at favorite
      expect(wrapper.vm.currentPath).toBe(favorite.path)
      expect(fileExplorer.vm.canNavigateForward).toBe(false)
    })

    it('should normalize paths correctly in navigation history', async () => {
      // Requirement 4.4: Path normalization
      wrapper = mount(User, {
        global: {
          plugins: [store]
        }
      })

      const fileExplorer = wrapper.findComponent(FileExplorer)

      // Test various path formats that should be normalized
      const pathVariations = [
        '/home/user/Documents/',    // trailing slash
        '/home/user//Documents',    // double slash
        '/home/user/Documents///',  // multiple trailing slashes
        '/home/user/Documents'      // clean path
      ]

      for (const path of pathVariations) {
        // Navigate to path
        await fileExplorer.vm.handlePathSelected(path, 'manual')
        await nextTick()
      }

      // All variations should result in the same normalized path in history
      const normalizedPath = '/home/user/Documents'
      const historyOccurrences = fileExplorer.vm.navigationHistory.filter(
        p => p === normalizedPath
      ).length

      // Should only appear once in history due to normalization
      expect(historyOccurrences).toBe(1)
    })

    it('should prevent duplicate entries in navigation history', async () => {
      // Requirement 4.3: Avoid duplicates in history
      wrapper = mount(User, {
        global: {
          plugins: [store]
        }
      })

      const fileExplorer = wrapper.findComponent(FileExplorer)
      const favoritesPanel = wrapper.findComponent(FavoritesPanel)
      const favorite = mockFavorites[0]

      // Navigate to same favorite multiple times
      await favoritesPanel.vm.navigateToFavorite(favorite)
      await nextTick()

      const historyLengthAfterFirst = fileExplorer.vm.navigationHistory.length

      // Navigate to same favorite again
      await favoritesPanel.vm.navigateToFavorite(favorite)
      await nextTick()

      // History length should not increase (no duplicate)
      expect(fileExplorer.vm.navigationHistory.length).toBe(historyLengthAfterFirst)
    })
  })

  describe('Complex Navigation Scenarios', () => {
    it('should handle navigation through multiple favorites correctly', async () => {
      // Test complex navigation flow
      wrapper = mount(User, {
        global: {
          plugins: [store]
        }
      })

      const fileExplorer = wrapper.findComponent(FileExplorer)
      const favoritesPanel = wrapper.findComponent(FavoritesPanel)

      // Navigate through multiple favorites
      const navigationSequence = [
        mockFavorites[0], // Documents
        mockFavorites[1], // Photos
        mockFavorites[2]  // Projects
      ]

      for (const favorite of navigationSequence) {
        await favoritesPanel.vm.navigateToFavorite(favorite)
        await nextTick()
      }

      // Verify complete history
      const expectedHistory = ['/', ...navigationSequence.map(f => f.path)]
      expect(fileExplorer.vm.navigationHistory).toEqual(expectedHistory)
      expect(fileExplorer.vm.historyIndex).toBe(expectedHistory.length - 1)

      // Test navigating back through the entire history
      for (let i = navigationSequence.length - 1; i >= 0; i--) {
        await fileExplorer.vm.navigateHistoryBack()
        await nextTick()

        const expectedPath = i === 0 ? '/' : navigationSequence[i - 1].path
        expect(wrapper.vm.currentPath).toBe(expectedPath)
      }
    })

    it('should clear forward history when navigating to new location', async () => {
      // Test forward history clearing behavior
      wrapper = mount(User, {
        global: {
          plugins: [store]
        }
      })

      const fileExplorer = wrapper.findComponent(FileExplorer)
      const favoritesPanel = wrapper.findComponent(FavoritesPanel)

      // Build up some history
      await favoritesPanel.vm.navigateToFavorite(mockFavorites[0])
      await nextTick()
      await favoritesPanel.vm.navigateToFavorite(mockFavorites[1])
      await nextTick()

      // Go back one step
      await fileExplorer.vm.navigateHistoryBack()
      await nextTick()

      // Should have forward history available
      expect(fileExplorer.vm.canNavigateForward).toBe(true)

      // Navigate to a new location (should clear forward history)
      await favoritesPanel.vm.navigateToFavorite(mockFavorites[2])
      await nextTick()

      // Forward history should be cleared
      expect(fileExplorer.vm.canNavigateForward).toBe(false)
      expect(fileExplorer.vm.historyIndex).toBe(fileExplorer.vm.navigationHistory.length - 1)
    })

    it('should limit history size to prevent memory issues', async () => {
      // Test history size limitation
      wrapper = mount(User, {
        global: {
          plugins: [store]
        }
      })

      const fileExplorer = wrapper.findComponent(FileExplorer)

      // Simulate navigating to many different paths
      const manyPaths = Array.from({ length: 60 }, (_, i) => `/path/to/folder${i}`)

      for (const path of manyPaths) {
        await fileExplorer.vm.handlePathSelected(path, 'manual')
        await nextTick()
      }

      // History should be limited to 50 entries (plus initial root)
      expect(fileExplorer.vm.navigationHistory.length).toBeLessThanOrEqual(51)
      
      // Should still be able to navigate back
      expect(fileExplorer.vm.canNavigateBack).toBe(true)
    })
  })

  describe('Navigation History with Breadcrumbs', () => {
    it('should add breadcrumb navigation to history correctly', async () => {
      // Test breadcrumb navigation integration with history
      wrapper = mount(User, {
        global: {
          plugins: [store]
        }
      })

      const fileExplorer = wrapper.findComponent(FileExplorer)

      // Simulate breadcrumb navigation
      const breadcrumbPath = '/home/user'
      await fileExplorer.vm.handleBreadcrumbNavigation(breadcrumbPath)
      await nextTick()

      // Verify breadcrumb navigation was added to history
      expect(fileExplorer.vm.navigationHistory).toContain(breadcrumbPath)
      expect(wrapper.vm.currentPath).toBe(breadcrumbPath)
    })

    it('should handle mixed navigation sources in history', async () => {
      // Test history with different navigation sources
      wrapper = mount(User, {
        global: {
          plugins: [store]
        }
      })

      const fileExplorer = wrapper.findComponent(FileExplorer)
      const favoritesPanel = wrapper.findComponent(FavoritesPanel)

      // Mix of navigation types
      await favoritesPanel.vm.navigateToFavorite(mockFavorites[0]) // favorite
      await nextTick()

      await fileExplorer.vm.handleBreadcrumbNavigation('/home/user') // breadcrumb
      await nextTick()

      await fileExplorer.vm.handlePathSelected('/home/user/Downloads', 'manual') // manual
      await nextTick()

      // All should be in history
      const expectedPaths = ['/', mockFavorites[0].path, '/home/user', '/home/user/Downloads']
      expect(fileExplorer.vm.navigationHistory).toEqual(expectedPaths)

      // Should be able to navigate back through all of them
      for (let i = expectedPaths.length - 2; i >= 0; i--) {
        await fileExplorer.vm.navigateHistoryBack()
        await nextTick()
        expect(wrapper.vm.currentPath).toBe(expectedPaths[i])
      }
    })
  })

  describe('Navigation History Events', () => {
    it('should emit correct events during history navigation', async () => {
      // Test event emission during navigation
      wrapper = mount(User, {
        global: {
          plugins: [store]
        }
      })

      const fileExplorer = wrapper.findComponent(FileExplorer)
      const favoritesPanel = wrapper.findComponent(FavoritesPanel)

      // Navigate to favorite
      await favoritesPanel.vm.navigateToFavorite(mockFavorites[0])
      await nextTick()

      // Clear previous events
      fileExplorer.vm.$emit = vi.fn()

      // Navigate back
      await fileExplorer.vm.navigateHistoryBack()
      await nextTick()

      // Verify events were emitted
      expect(fileExplorer.vm.$emit).toHaveBeenCalledWith('path-changed', expect.objectContaining({
        oldPath: mockFavorites[0].path,
        newPath: '/',
        source: 'history-back'
      }))

      expect(fileExplorer.vm.$emit).toHaveBeenCalledWith('navigate', expect.objectContaining({
        path: '/',
        source: 'history-back'
      }))
    })

    it('should handle navigation events correctly in User component', async () => {
      // Test User component response to navigation events
      wrapper = mount(User, {
        global: {
          plugins: [store]
        }
      })

      const fileExplorer = wrapper.findComponent(FileExplorer)
      const favoritesPanel = wrapper.findComponent(FavoritesPanel)

      // Navigate to favorite
      await favoritesPanel.vm.navigateToFavorite(mockFavorites[0])
      await nextTick()

      // Navigate back via history
      await fileExplorer.vm.navigateHistoryBack()
      await nextTick()

      // User component should reflect the navigation
      expect(wrapper.vm.currentPath).toBe('/')
      
      // FileExplorer should receive the updated external path
      expect(fileExplorer.props('externalPath')).toBe('/')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle navigation history when API calls fail', async () => {
      // Test history behavior with failed API calls
      wrapper = mount(User, {
        global: {
          plugins: [store]
        }
      })

      const fileExplorer = wrapper.findComponent(FileExplorer)
      const favoritesPanel = wrapper.findComponent(FavoritesPanel)

      // First navigation succeeds
      await favoritesPanel.vm.navigateToFavorite(mockFavorites[0])
      await nextTick()

      // Mock API failure for next navigation
      mockNasAPI.browse.mockRejectedValueOnce(new Error('API Error'))

      // Attempt navigation that will fail
      try {
        await fileExplorer.vm.handlePathSelected('/invalid/path', 'manual')
        await nextTick()
      } catch (error) {
        // Expected to fail
      }

      // History should still be intact and functional
      expect(fileExplorer.vm.canNavigateBack).toBe(true)
      
      // Should be able to navigate back successfully
      await fileExplorer.vm.navigateHistoryBack()
      await nextTick()
      
      expect(wrapper.vm.currentPath).toBe('/')
    })

    it('should handle empty or invalid history states', async () => {
      // Test edge cases with history manipulation
      wrapper = mount(User, {
        global: {
          plugins: [store]
        }
      })

      const fileExplorer = wrapper.findComponent(FileExplorer)

      // Manually corrupt history (simulate edge case)
      fileExplorer.vm.navigationHistory = []
      fileExplorer.vm.historyIndex = -1

      // Should handle gracefully
      expect(fileExplorer.vm.canNavigateBack).toBe(false)
      expect(fileExplorer.vm.canNavigateForward).toBe(false)

      // Should be able to recover by adding new navigation
      await fileExplorer.vm.handlePathSelected('/recovery/path', 'manual')
      await nextTick()

      // History should be restored
      expect(fileExplorer.vm.navigationHistory.length).toBeGreaterThan(0)
      expect(fileExplorer.vm.historyIndex).toBeGreaterThanOrEqual(0)
    })
  })
})