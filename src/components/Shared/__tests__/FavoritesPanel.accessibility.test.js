/**
 * Accessibility Tests for FavoritesPanel Component
 * Tests keyboard navigation, ARIA compliance, and user experience enhancements
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import FavoritesPanel from '../FavoritesPanel.vue'
import { validateFavoritesAccessibility, validateKeyboardNavigation } from '@/utils/accessibilityValidator.js'
import { createStore } from 'vuex'

// Mock store
const createMockStore = () => createStore({
  state: {
    notifications: []
  },
  mutations: {
    ADD_NOTIFICATION: (state, notification) => {
      state.notifications.push(notification)
    }
  },
  actions: {
    showSuccess: ({ commit }, message) => {
      commit('ADD_NOTIFICATION', { type: 'success', message })
    },
    showError: ({ commit }, message) => {
      commit('ADD_NOTIFICATION', { type: 'error', message })
    },
    showInfo: ({ commit }, message) => {
      commit('ADD_NOTIFICATION', { type: 'info', message })
    }
  }
})

// Mock favorites service
vi.mock('@/services/favoritesService.js', () => ({
  favoritesService: {
    getFavorites: vi.fn(() => [
      { name: 'Documents', path: '/documents', isValid: true, canAccess: true },
      { name: 'Photos', path: '/photos', isValid: true, canAccess: true },
      { name: 'Invalid Folder', path: '/invalid', isValid: false, canAccess: false },
      { name: 'Restricted', path: '/restricted', isValid: true, canAccess: false }
    ]),
    addFavorite: vi.fn(() => true),
    removeFavorite: vi.fn(() => true),
    validateAllFavorites: vi.fn(() => Promise.resolve({
      total: 4,
      valid: 2,
      invalid: 1,
      inaccessible: 1
    })),
    onFavoritesChanged: vi.fn(() => () => {}),
    checkNavigationPermissions: vi.fn((favorite) => {
      if (!favorite.isValid) {
        return { canNavigate: false, errorType: 'NOT_FOUND', error: 'Folder not found' }
      }
      if (!favorite.canAccess) {
        return { canNavigate: false, errorType: 'PERMISSION_DENIED', error: 'Access denied' }
      }
      return { canNavigate: true }
    })
  }
}))

// Mock navigation performance
vi.mock('@/utils/navigationPerformance.js', () => ({
  default: {
    debounce: (key, fn) => fn,
    normalizePath: (path) => path,
    recordNavigation: vi.fn(),
    setNavigationInProgress: vi.fn()
  }
}))

describe('FavoritesPanel Accessibility', () => {
  let wrapper
  let store

  beforeEach(() => {
    store = createMockStore()
    
    wrapper = mount(FavoritesPanel, {
      props: {
        currentPath: '/test',
        compact: false
      },
      global: {
        plugins: [store]
      }
    })
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  describe('Keyboard Navigation', () => {
    it('should be focusable with keyboard', async () => {
      const container = wrapper.find('.favorites-panel')
      expect(container.attributes('tabindex')).toBe('0')
      expect(container.attributes('role')).toBe('region')
      expect(container.attributes('aria-label')).toBe('Panneau des favoris')
    })

    it('should handle arrow key navigation', async () => {
      const container = wrapper.find('.favorites-panel')
      
      // Focus the container
      await container.trigger('focus')
      
      // Simulate down arrow key
      await container.trigger('keydown', { key: 'ArrowDown' })
      await nextTick()
      
      // Check if first favorite is selected
      const firstFavorite = wrapper.find('.favorite-item')
      expect(firstFavorite.classes()).toContain('keyboard-focused')
    })

    it('should handle Enter key to navigate to favorite', async () => {
      const container = wrapper.find('.favorites-panel')
      await container.trigger('focus')
      
      // Select first favorite
      await container.trigger('keydown', { key: 'ArrowDown' })
      await nextTick()
      
      // Press Enter
      await container.trigger('keydown', { key: 'Enter' })
      await nextTick()
      
      // Check if navigate event was emitted
      expect(wrapper.emitted('navigate')).toBeTruthy()
    })

    it('should handle Escape key to clear selection', async () => {
      const container = wrapper.find('.favorites-panel')
      await container.trigger('focus')
      
      // Select first favorite
      await container.trigger('keydown', { key: 'ArrowDown' })
      await nextTick()
      
      // Press Escape
      await container.trigger('keydown', { key: 'Escape' })
      await nextTick()
      
      // Check if selection is cleared
      const focusedItems = wrapper.findAll('.favorite-item.keyboard-focused')
      expect(focusedItems).toHaveLength(0)
    })

    it('should handle Home and End keys', async () => {
      const container = wrapper.find('.favorites-panel')
      await container.trigger('focus')
      
      // Press Home key
      await container.trigger('keydown', { key: 'Home' })
      await nextTick()
      
      // Check if first item is selected
      const firstItem = wrapper.find('.favorite-item')
      expect(firstItem.classes()).toContain('keyboard-focused')
      
      // Press End key
      await container.trigger('keydown', { key: 'End' })
      await nextTick()
      
      // Check if last item is selected
      const items = wrapper.findAll('.favorite-item')
      const lastItem = items[items.length - 1]
      expect(lastItem.classes()).toContain('keyboard-focused')
    })
  })

  describe('ARIA Compliance', () => {
    it('should have proper ARIA attributes on favorites list', () => {
      const list = wrapper.find('.favorites-list')
      expect(list.attributes('role')).toBe('list')
      
      const items = wrapper.findAll('.favorite-item')
      items.forEach((item, index) => {
        expect(item.attributes('role')).toBe('listitem')
        expect(item.attributes('aria-posinset')).toBe(String(index + 1))
        expect(item.attributes('aria-setsize')).toBe(String(items.length))
      })
    })

    it('should have accessible names for favorite buttons', () => {
      const buttons = wrapper.findAll('.favorite-button')
      
      buttons.forEach(button => {
        const ariaLabel = button.attributes('aria-label')
        expect(ariaLabel).toBeTruthy()
        expect(ariaLabel).toContain('Naviguer vers le dossier favori')
      })
    })

    it('should have proper status indicators with descriptions', () => {
      const statusIndicators = wrapper.findAll('.favorite-status-indicator')
      
      statusIndicators.forEach(indicator => {
        expect(indicator.attributes('id')).toBeTruthy()
        expect(indicator.attributes('title')).toBeTruthy()
      })
    })

    it('should associate status descriptions with buttons', () => {
      const buttons = wrapper.findAll('.favorite-button')
      
      buttons.forEach(button => {
        const describedBy = button.attributes('aria-describedby')
        if (describedBy) {
          const statusElement = wrapper.find(`#${describedBy}`)
          expect(statusElement.exists()).toBe(true)
        }
      })
    })
  })

  describe('Focus Management', () => {
    it('should manage focus properly on panel focus', async () => {
      const container = wrapper.find('.favorites-panel')
      
      await container.trigger('focus')
      await nextTick()
      
      // Should activate keyboard shortcuts
      expect(wrapper.vm.isFocused).toBe(true)
    })

    it('should clear focus when blurring outside panel', async () => {
      const container = wrapper.find('.favorites-panel')
      
      await container.trigger('focus')
      await nextTick()
      
      // Simulate blur to external element
      await container.trigger('blur', { 
        relatedTarget: document.body 
      })
      await nextTick()
      
      expect(wrapper.vm.isFocused).toBe(false)
    })

    it('should maintain focus when moving within panel', async () => {
      const container = wrapper.find('.favorites-panel')
      const button = wrapper.find('.favorite-button')
      
      await container.trigger('focus')
      await nextTick()
      
      // Simulate focus moving to button within panel
      await container.trigger('blur', { 
        relatedTarget: button.element 
      })
      await nextTick()
      
      // Focus should still be considered within panel
      expect(wrapper.vm.isFocused).toBe(true)
    })
  })

  describe('Screen Reader Support', () => {
    it('should announce favorite selection changes', async () => {
      const container = wrapper.find('.favorites-panel')
      const announceSpy = vi.spyOn(wrapper.vm, 'announce')
      
      await container.trigger('focus')
      await container.trigger('keydown', { key: 'ArrowDown' })
      await nextTick()
      
      expect(announceSpy).toHaveBeenCalledWith(
        expect.stringContaining('sélectionné')
      )
    })

    it('should announce navigation actions', async () => {
      const container = wrapper.find('.favorites-panel')
      const announceSpy = vi.spyOn(wrapper.vm, 'announce')
      
      await container.trigger('focus')
      await container.trigger('keydown', { key: 'ArrowDown' })
      await container.trigger('keydown', { key: 'Enter' })
      await nextTick()
      
      expect(announceSpy).toHaveBeenCalledWith(
        expect.stringContaining('Navigation vers')
      )
    })

    it('should have ARIA live region for announcements', () => {
      // Check if live region exists or is created
      const liveRegion = document.querySelector('[aria-live="polite"]')
      expect(liveRegion).toBeTruthy()
    })
  })

  describe('Animation and Motion', () => {
    it('should respect reduced motion preferences', async () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      })

      // Remount component to trigger motion preference check
      wrapper.unmount()
      wrapper = mount(FavoritesPanel, {
        props: {
          currentPath: '/test',
          compact: false
        },
        global: {
          plugins: [store]
        }
      })

      await nextTick()
      
      expect(wrapper.vm.prefersReducedMotion).toBe(true)
    })

    it('should apply animation classes when motion is enabled', () => {
      const items = wrapper.findAll('.favorite-item')
      
      items.forEach(item => {
        if (!wrapper.vm.prefersReducedMotion) {
          expect(item.classes()).toContain('animate-fast')
        }
      })
    })
  })

  describe('Error Handling and Feedback', () => {
    it('should provide appropriate feedback for invalid favorites', async () => {
      const invalidButton = wrapper.findAll('.favorite-button')[2] // Invalid folder
      
      await invalidButton.trigger('click')
      await nextTick()
      
      // Should show error feedback
      expect(store.state.notifications).toHaveLength(1)
      expect(store.state.notifications[0].type).toBe('error')
    })

    it('should provide feedback for permission denied', async () => {
      const restrictedButton = wrapper.findAll('.favorite-button')[3] // Restricted folder
      
      await restrictedButton.trigger('click')
      await nextTick()
      
      // Should show permission error
      expect(store.state.notifications).toHaveLength(1)
      expect(store.state.notifications[0].type).toBe('error')
    })

    it('should show success feedback for valid navigation', async () => {
      const validButton = wrapper.findAll('.favorite-button')[0] // Valid folder
      
      await validButton.trigger('click')
      await nextTick()
      
      // Should emit navigate event
      expect(wrapper.emitted('navigate')).toBeTruthy()
    })
  })

  describe('Accessibility Validation', () => {
    it('should pass basic accessibility validation', () => {
      const results = validateFavoritesAccessibility(wrapper.element)
      
      // Should have minimal accessibility issues
      expect(results.totalIssues).toBeLessThan(5)
      expect(results.summary.complianceLevel).not.toBe('Non-compliant')
    })

    it('should pass keyboard navigation validation', () => {
      const results = validateKeyboardNavigation(wrapper.element)
      
      // Should have no critical keyboard navigation issues
      expect(results.issues.filter(issue => 
        issue.level === 'A' && issue.rule === 'keyboard-navigation'
      )).toHaveLength(0)
    })

    it('should have proper color contrast', () => {
      const results = validateFavoritesAccessibility(wrapper.element)
      const contrastIssues = results.issues.filter(issue => 
        issue.rule === 'color-contrast'
      )
      
      // Should have no critical contrast issues
      expect(contrastIssues.filter(issue => issue.level === 'AA')).toHaveLength(0)
    })
  })

  describe('Keyboard Shortcuts Integration', () => {
    it('should register favorites-specific shortcuts', () => {
      // Check if keyboard shortcuts are properly initialized
      expect(wrapper.vm.setKeyboardFavorites).toBeDefined()
      expect(wrapper.vm.selectFavorite).toBeDefined()
      expect(wrapper.vm.clearSelection).toBeDefined()
    })

    it('should handle Ctrl+R for refresh', async () => {
      const container = wrapper.find('.favorites-panel')
      const validateSpy = vi.spyOn(wrapper.vm, 'validateAllFavorites')
      
      await container.trigger('focus')
      await container.trigger('keydown', { 
        key: 'r', 
        ctrlKey: true 
      })
      await nextTick()
      
      expect(validateSpy).toHaveBeenCalled()
    })

    it('should handle F1 for help', async () => {
      const container = wrapper.find('.favorites-panel')
      const consoleSpy = vi.spyOn(console, 'log')
      
      await container.trigger('focus')
      await container.trigger('keydown', { key: 'F1' })
      await nextTick()
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Raccourcis clavier')
      )
    })
  })

  describe('Touch and Mobile Support', () => {
    it('should handle touch interactions', async () => {
      const button = wrapper.find('.favorite-button')
      
      await button.trigger('touchstart')
      await button.trigger('touchend')
      await nextTick()
      
      // Should behave similar to click
      expect(wrapper.emitted('navigate')).toBeTruthy()
    })

    it('should have appropriate touch target sizes', () => {
      const buttons = wrapper.findAll('.favorite-button')
      
      buttons.forEach(button => {
        const rect = button.element.getBoundingClientRect()
        // Touch targets should be at least 44px (WCAG guideline)
        expect(Math.min(rect.width, rect.height)).toBeGreaterThanOrEqual(44)
      })
    })
  })
})

describe('FavoritesPanel Performance', () => {
  it('should debounce rapid navigation attempts', async () => {
    const store = createMockStore()
    const wrapper = mount(FavoritesPanel, {
      props: { currentPath: '/test' },
      global: { plugins: [store] }
    })

    const button = wrapper.find('.favorite-button')
    
    // Rapid clicks should be debounced
    await button.trigger('click')
    await button.trigger('click')
    await button.trigger('click')
    
    await nextTick()
    
    // Should only emit once due to debouncing
    expect(wrapper.emitted('navigate')).toHaveLength(1)
    
    wrapper.unmount()
  })

  it('should handle large numbers of favorites efficiently', async () => {
    // Mock large favorites list
    const largeFavoritesList = Array.from({ length: 100 }, (_, i) => ({
      name: `Folder ${i}`,
      path: `/folder${i}`,
      isValid: true,
      canAccess: true
    }))

    vi.mocked(require('@/services/favoritesService.js').favoritesService.getFavorites)
      .mockReturnValue(largeFavoritesList)

    const store = createMockStore()
    const wrapper = mount(FavoritesPanel, {
      props: { currentPath: '/test' },
      global: { plugins: [store] }
    })

    await nextTick()

    // Should render all favorites without performance issues
    const items = wrapper.findAll('.favorite-item')
    expect(items).toHaveLength(100)

    // Keyboard navigation should still work
    const container = wrapper.find('.favorites-panel')
    await container.trigger('focus')
    await container.trigger('keydown', { key: 'ArrowDown' })
    await nextTick()

    const firstItem = wrapper.find('.favorite-item.keyboard-focused')
    expect(firstItem.exists()).toBe(true)

    wrapper.unmount()
  })
})