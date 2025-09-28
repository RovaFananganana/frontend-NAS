import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ActivityLogs from '../ActivityLogs.vue'
import { userAPI } from '@/services/api'

// Mock the API
vi.mock('@/services/api', () => ({
  userAPI: {
    getLogs: vi.fn()
  }
}))

describe('ActivityLogs.vue', () => {
  let wrapper

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  const createWrapper = () => {
    return mount(ActivityLogs, {
      global: {
        stubs: {
          // Stub any child components if needed
        }
      }
    })
  }

  describe('Component Initialization', () => {
    it('should render loading state initially', async () => {
      // Mock API to return a pending promise
      let resolvePromise
      userAPI.getLogs.mockImplementation(() => new Promise((resolve) => {
        resolvePromise = resolve
      }))
      
      wrapper = createWrapper()
      await nextTick() // Wait for component to mount and start loading
      
      expect(wrapper.find('.loading').exists()).toBe(true)
      expect(wrapper.text()).toContain('Chargement des logs...')
      
      // Clean up by resolving the promise
      if (resolvePromise) {
        resolvePromise({ data: { logs: [], total: 0 } })
      }
    })

    it('should call load() on mount', () => {
      userAPI.getLogs.mockResolvedValue({
        data: { logs: [], total: 0 }
      })
      
      wrapper = createWrapper()
      
      expect(userAPI.getLogs).toHaveBeenCalledWith(1, 20)
    })
  })

  describe('Data Loading - Different Formats', () => {
    it('should handle backend format with logs array', async () => {
      const mockLogs = [
        {
          id: 1,
          action: 'READ',
          target: 'document.pdf',
          created_at: '2024-01-15T10:30:00Z'
        },
        {
          id: 2,
          action: 'DOWNLOAD',
          target: 'image.jpg',
          created_at: '2024-01-15T11:00:00Z'
        }
      ]

      userAPI.getLogs.mockResolvedValue({
        data: {
          logs: mockLogs,
          total: 2
        }
      })

      wrapper = createWrapper()
      await nextTick()
      await nextTick() // Wait for async operations

      expect(wrapper.vm.logs).toHaveLength(2)
      expect(wrapper.vm.total).toBe(2)
      expect(wrapper.vm.logs[0].action).toBe('READ')
      expect(wrapper.vm.logs[0].target).toBe('document.pdf')
    })

    it('should handle frontend format with items array', async () => {
      const mockLogs = [
        {
          id: 1,
          action: 'CREATE',
          details: 'folder created',
          timestamp: '2024-01-15T10:30:00Z'
        }
      ]

      userAPI.getLogs.mockResolvedValue({
        data: {
          items: mockLogs,
          total: 1
        }
      })

      wrapper = createWrapper()
      await nextTick()
      await nextTick()

      expect(wrapper.vm.logs).toHaveLength(1)
      expect(wrapper.vm.total).toBe(1)
      expect(wrapper.vm.logs[0].action).toBe('CREATE')
    })

    it('should handle direct array format', async () => {
      const mockLogs = [
        {
          id: 1,
          action: 'UPDATE',
          target: 'profile.json'
        }
      ]

      userAPI.getLogs.mockResolvedValue({
        data: mockLogs
      })

      wrapper = createWrapper()
      await nextTick()
      await nextTick()

      expect(wrapper.vm.logs).toHaveLength(1)
      expect(wrapper.vm.total).toBe(1)
    })

    it('should handle empty data gracefully', async () => {
      userAPI.getLogs.mockResolvedValue({
        data: { logs: [], total: 0 }
      })

      wrapper = createWrapper()
      await nextTick()
      await nextTick()

      expect(wrapper.vm.logs).toHaveLength(0)
      expect(wrapper.vm.total).toBe(0)
      expect(wrapper.text()).toContain('Aucune activité récente')
    })

    it('should handle unrecognized data format', async () => {
      userAPI.getLogs.mockResolvedValue({
        data: { unknown: 'format' }
      })

      wrapper = createWrapper()
      await nextTick()
      await nextTick()

      expect(wrapper.vm.logs).toHaveLength(0)
      expect(wrapper.vm.total).toBe(0)
    })

    it('should filter out invalid log entries', async () => {
      userAPI.getLogs.mockResolvedValue({
        data: {
          logs: [
            { id: 1, action: 'READ', target: 'file1.txt' }, // valid
            null, // invalid
            { id: 2, action: 'write', target: 'file2.txt' }, // valid
            'invalid string', // invalid
            { id: 3 } // valid but minimal
          ],
          total: 5
        }
      })

      wrapper = createWrapper()
      await nextTick()
      await nextTick()

      expect(wrapper.vm.logs).toHaveLength(3)
      expect(wrapper.vm.logs[0].action).toBe('READ') // Keep original case
      expect(wrapper.vm.logs[2].action).toBe('Action inconnue') // fallback for missing action
    })
  })

  describe('Error Handling', () => {
    it('should display 404 error message', async () => {
      const error = {
        response: { status: 404 }
      }
      userAPI.getLogs.mockRejectedValue(error)

      wrapper = createWrapper()
      await nextTick()
      await nextTick()

      expect(wrapper.vm.error).toBe('Service de logs non disponible')
      expect(wrapper.find('.alert-error').exists()).toBe(true)
    })

    it('should display 403 error message', async () => {
      const error = {
        response: { status: 403 }
      }
      userAPI.getLogs.mockRejectedValue(error)

      wrapper = createWrapper()
      await nextTick()
      await nextTick()

      expect(wrapper.vm.error).toBe('Accès refusé aux logs d\'activité')
    })

    it('should display server error message', async () => {
      const error = {
        response: { status: 500 }
      }
      userAPI.getLogs.mockRejectedValue(error)

      wrapper = createWrapper()
      await nextTick()
      await nextTick()

      expect(wrapper.vm.error).toBe('Erreur serveur lors du chargement des logs')
    })

    it('should display network error message', async () => {
      // Mock navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      })

      const error = new Error('Network error')
      userAPI.getLogs.mockRejectedValue(error)

      wrapper = createWrapper()
      await nextTick()
      await nextTick()

      expect(wrapper.vm.error).toBe('Connexion réseau indisponible')

      // Restore navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      })
    })

    it('should display custom error message from response', async () => {
      const error = {
        response: {
          status: 400,
          data: { message: 'Custom error message' }
        }
      }
      userAPI.getLogs.mockRejectedValue(error)

      wrapper = createWrapper()
      await nextTick()
      await nextTick()

      expect(wrapper.vm.error).toBe('Custom error message')
    })

    it('should display generic error message as fallback', async () => {
      const error = new Error('Generic error')
      userAPI.getLogs.mockRejectedValue(error)

      wrapper = createWrapper()
      await nextTick()
      await nextTick()

      expect(wrapper.vm.error).toBe('Generic error')
    })

    it('should allow retry after error', async () => {
      const error = new Error('Test error')
      userAPI.getLogs.mockRejectedValueOnce(error)
      userAPI.getLogs.mockResolvedValueOnce({
        data: { logs: [], total: 0 }
      })

      wrapper = createWrapper()
      await nextTick()
      await nextTick()

      expect(wrapper.vm.error).toBe('Test error')

      // Click retry button
      const retryButton = wrapper.find('button')
      await retryButton.trigger('click')
      await nextTick()

      expect(userAPI.getLogs).toHaveBeenCalledTimes(2)
      expect(wrapper.vm.error).toBe('')
    })
  })

  describe('Pagination', () => {
    beforeEach(async () => {
      userAPI.getLogs.mockResolvedValue({
        data: {
          logs: Array.from({ length: 20 }, (_, i) => ({
            id: i + 1,
            action: 'READ',
            target: `file${i + 1}.txt`,
            created_at: '2024-01-15T10:30:00Z'
          })),
          total: 100
        }
      })

      wrapper = createWrapper()
      await nextTick()
      await nextTick()
    })

    it('should calculate total pages correctly', () => {
      expect(wrapper.vm.totalPages).toBe(5) // 100 / 20 = 5
    })

    it('should display current page information', () => {
      expect(wrapper.text()).toContain('Page 1 / 5')
    })

    it('should disable previous button on first page', () => {
      const prevButton = wrapper.find('button:first-of-type')
      expect(prevButton.attributes('disabled')).toBeDefined()
    })

    it('should enable next button when not on last page', () => {
      const nextButton = wrapper.find('button:last-of-type')
      expect(nextButton.attributes('disabled')).toBeUndefined()
    })

    it('should navigate to next page', async () => {
      userAPI.getLogs.mockResolvedValue({
        data: { logs: [], total: 100 }
      })

      const nextButton = wrapper.find('button:last-of-type')
      await nextButton.trigger('click')
      await nextTick()

      expect(wrapper.vm.page).toBe(2)
      expect(userAPI.getLogs).toHaveBeenCalledWith(2, 20)
    })

    it('should navigate to previous page', async () => {
      wrapper.vm.page = 2
      await nextTick()

      userAPI.getLogs.mockResolvedValue({
        data: { logs: [], total: 100 }
      })

      const prevButton = wrapper.find('button:first-of-type')
      await prevButton.trigger('click')
      await nextTick()

      expect(wrapper.vm.page).toBe(1)
      expect(userAPI.getLogs).toHaveBeenCalledWith(1, 20)
    })

    it('should not navigate beyond boundaries', async () => {
      // Test going beyond last page
      wrapper.vm.go(10)
      expect(wrapper.vm.page).toBe(5) // Should stay at max page

      // Reset to page 1 first
      wrapper.vm.page = 1
      await nextTick()

      // Test going below first page
      wrapper.vm.go(-1)
      expect(wrapper.vm.page).toBe(1) // Should stay at min page
    })

    it('should not navigate when loading', async () => {
      wrapper.vm.loading = true
      const currentPage = wrapper.vm.page

      wrapper.vm.go(2)
      expect(wrapper.vm.page).toBe(currentPage) // Should not change
    })

    it('should handle single page correctly', async () => {
      userAPI.getLogs.mockResolvedValue({
        data: { 
          logs: [
            { id: 1, action: 'READ', target: 'file.txt', created_at: '2024-01-15T10:30:00Z' }
          ], 
          total: 5 
        }
      })

      wrapper = createWrapper()
      await nextTick()
      await nextTick()

      expect(wrapper.vm.totalPages).toBe(1)
      expect(wrapper.text()).toContain('Page 1 / 1')
    })
  })

  describe('Data Formatting', () => {
    beforeEach(async () => {
      const mockLogs = [
        {
          id: 1,
          action: 'READ',
          target: 'document.pdf',
          created_at: '2024-01-15T10:30:00Z'
        },
        {
          id: 2,
          action: 'UNKNOWN_ACTION',
          target: 'file.txt',
          timestamp: '2024-01-15T11:00:00Z'
        },
        {
          id: 3,
          action: null,
          target: null,
          created_at: 'invalid-date'
        }
      ]

      userAPI.getLogs.mockResolvedValue({
        data: { logs: mockLogs, total: 3 }
      })

      wrapper = createWrapper()
      await nextTick()
      await nextTick()
    })

    it('should format known actions correctly', () => {
      const actionTexts = wrapper.findAll('.text-sm.font-medium')
      expect(actionTexts[0].text()).toBe('Lecture')
    })

    it('should handle unknown actions', () => {
      const actionTexts = wrapper.findAll('.text-sm.font-medium')
      expect(actionTexts[1].text()).toBe('UNKNOWN_ACTION')
    })

    it('should handle null actions', () => {
      const actionTexts = wrapper.findAll('.text-sm.font-medium')
      expect(actionTexts[2].text()).toBe('Action inconnue')
    })

    it('should format dates correctly', () => {
      const dateTexts = wrapper.findAll('.text-xs.text-gray-500')
      expect(dateTexts[0].text()).toMatch(/15\/01\/2024.*10:30:00/)
    })

    it('should handle invalid dates', () => {
      const dateTexts = wrapper.findAll('.text-xs.text-gray-500')
      expect(dateTexts[2].text()).toBe('—')
    })

    it('should display target information', () => {
      const targetTexts = wrapper.findAll('.text-sm.text-gray-600')
      expect(targetTexts[0].text()).toBe('document.pdf')
    })

    it('should handle missing target with fallback', () => {
      const targetTexts = wrapper.findAll('.text-sm.text-gray-600')
      expect(targetTexts[2].text()).toBe('Cible inconnue') // This is what the component actually returns
    })
  })

  describe('Action Formatting', () => {
    it('should format all known action types', () => {
      const testCases = [
        { input: 'CREATE', expected: 'Création' },
        { input: 'READ', expected: 'Lecture' },
        { input: 'UPDATE', expected: 'Modification' },
        { input: 'DELETE', expected: 'Suppression' },
        { input: 'DOWNLOAD', expected: 'Téléchargement' },
        { input: 'UPLOAD', expected: 'Upload' },
        { input: 'SHARE', expected: 'Partage' },
        { input: 'UPDATE_PROFILE', expected: 'Mise à jour profil' },
        { input: 'read', expected: 'Consultation' },
        { input: 'create', expected: 'Création' },
        { input: 'update', expected: 'Modification' },
        { input: 'delete', expected: 'Suppression' }
      ]

      testCases.forEach(({ input, expected }) => {
        expect(wrapper.vm.formatAction(input)).toBe(expected)
      })
    })

    it('should return original action for unknown types', () => {
      expect(wrapper.vm.formatAction('CUSTOM_ACTION')).toBe('CUSTOM_ACTION')
    })

    it('should handle null/undefined actions', () => {
      expect(wrapper.vm.formatAction(null)).toBe('Action inconnue')
      expect(wrapper.vm.formatAction(undefined)).toBe('Action inconnue')
      expect(wrapper.vm.formatAction('')).toBe('Action inconnue')
    })
  })

  describe('Date Formatting', () => {
    it('should format valid ISO dates', () => {
      const result = wrapper.vm.formatDate('2024-01-15T10:30:00Z')
      expect(result).toMatch(/15\/01\/2024.*10:30:00/)
    })

    it('should handle various date formats', () => {
      const validDates = [
        '2024-01-15T10:30:00Z',
        '2024-01-15T10:30:00.000Z',
        '2024-01-15 10:30:00',
        new Date().toISOString()
      ]

      validDates.forEach(date => {
        const result = wrapper.vm.formatDate(date)
        expect(result).not.toBe('—')
      })
    })

    it('should handle invalid dates', () => {
      const invalidDates = [
        'invalid-date',
        '',
        null,
        undefined,
        'not-a-date'
        // Removed 123456 as it creates a valid date (epoch time)
      ]

      invalidDates.forEach(date => {
        expect(wrapper.vm.formatDate(date)).toBe('—')
      })
    })

    it('should handle date parsing errors gracefully', () => {
      // Mock console.warn to avoid test output noise
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      const result = wrapper.vm.formatDate('definitely-not-a-date')
      expect(result).toBe('—')
      
      consoleSpy.mockRestore()
    })
  })

  describe('UI States', () => {
    it('should show loading state', async () => {
      let resolvePromise
      userAPI.getLogs.mockImplementation(() => new Promise((resolve) => {
        resolvePromise = resolve
      }))
      
      wrapper = createWrapper()
      await nextTick() // Wait for component to mount and start loading
      
      expect(wrapper.find('.loading').exists()).toBe(true)
      expect(wrapper.text()).toContain('Chargement des logs...')
      expect(wrapper.find('.space-y-2').exists()).toBe(false)
      
      // Clean up by resolving the promise
      if (resolvePromise) {
        resolvePromise({ data: { logs: [], total: 0 } })
      }
    })

    it('should show error state', async () => {
      userAPI.getLogs.mockRejectedValue(new Error('Test error'))
      
      wrapper = createWrapper()
      await nextTick()
      await nextTick()
      
      expect(wrapper.find('.alert-error').exists()).toBe(true)
      expect(wrapper.text()).toContain('Test error')
      expect(wrapper.find('button').text()).toContain('Réessayer')
    })

    it('should show empty state', async () => {
      userAPI.getLogs.mockResolvedValue({
        data: { logs: [], total: 0 }
      })
      
      wrapper = createWrapper()
      await nextTick()
      await nextTick()
      
      expect(wrapper.text()).toContain('Aucune activité récente')
      expect(wrapper.text()).toContain('Vos actions apparaîtront ici')
      expect(wrapper.text()).toContain('📋')
    })

    it('should show logs with pagination when data exists', async () => {
      userAPI.getLogs.mockResolvedValue({
        data: {
          logs: [{ id: 1, action: 'READ', target: 'file.txt', created_at: '2024-01-15T10:30:00Z' }],
          total: 25
        }
      })
      
      wrapper = createWrapper()
      await nextTick()
      await nextTick()
      
      expect(wrapper.find('.space-y-2').exists()).toBe(true)
      expect(wrapper.text()).toContain('Page 1 / 2')
      expect(wrapper.text()).toContain('Total : 25')
    })

    it('should hide pagination when loading', async () => {
      userAPI.getLogs.mockResolvedValue({
        data: { logs: [{ id: 1, action: 'READ' }], total: 25 }
      })
      
      wrapper = createWrapper()
      await nextTick()
      await nextTick()
      
      // Set loading state
      wrapper.vm.loading = true
      await nextTick()
      
      expect(wrapper.text()).not.toContain('Page 1 / 2')
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete successful flow', async () => {
      const mockLogs = [
        { id: 1, action: 'READ', target: 'file1.txt', created_at: '2024-01-15T10:30:00Z' },
        { id: 2, action: 'DOWNLOAD', target: 'file2.pdf', created_at: '2024-01-15T11:00:00Z' }
      ]

      userAPI.getLogs.mockResolvedValue({
        data: { logs: mockLogs, total: 50 }
      })

      wrapper = createWrapper()
      await nextTick()
      await nextTick()

      // Check initial state
      expect(wrapper.vm.loading).toBe(false)
      expect(wrapper.vm.error).toBe('')
      expect(wrapper.vm.logs).toHaveLength(2)
      expect(wrapper.vm.total).toBe(50)

      // Check UI rendering
      expect(wrapper.text()).toContain('Total : 50')
      expect(wrapper.text()).toContain('Logs chargés: 2')
      expect(wrapper.text()).toContain('Lecture')
      expect(wrapper.text()).toContain('Téléchargement')
      expect(wrapper.text()).toContain('Page 1 / 3')
    })

    it('should handle error recovery flow', async () => {
      // First call fails
      userAPI.getLogs.mockRejectedValueOnce(new Error('Network error'))
      
      wrapper = createWrapper()
      await nextTick()
      await nextTick()

      expect(wrapper.vm.error).toBe('Network error')
      expect(wrapper.find('.alert-error').exists()).toBe(true)

      // Second call succeeds
      userAPI.getLogs.mockResolvedValueOnce({
        data: { logs: [{ id: 1, action: 'READ' }], total: 1 }
      })

      await wrapper.find('button').trigger('click')
      await nextTick()
      await nextTick()

      expect(wrapper.vm.error).toBe('')
      expect(wrapper.vm.logs).toHaveLength(1)
      expect(wrapper.find('.alert-error').exists()).toBe(false)
    })

    it('should handle pagination navigation flow', async () => {
      // Initial load
      userAPI.getLogs.mockResolvedValueOnce({
        data: { logs: Array(20).fill().map((_, i) => ({ id: i, action: 'READ' })), total: 100 }
      })

      wrapper = createWrapper()
      await nextTick()
      await nextTick()

      expect(wrapper.vm.page).toBe(1)

      // Navigate to page 2
      userAPI.getLogs.mockResolvedValueOnce({
        data: { logs: Array(20).fill().map((_, i) => ({ id: i + 20, action: 'write' })), total: 100 }
      })

      const nextButton = wrapper.find('button:last-of-type')
      await nextButton.trigger('click')
      await nextTick()
      await nextTick()

      expect(wrapper.vm.page).toBe(2)
      expect(userAPI.getLogs).toHaveBeenLastCalledWith(2, 20)

      // Navigate back to page 1
      userAPI.getLogs.mockResolvedValueOnce({
        data: { logs: Array(20).fill().map((_, i) => ({ id: i, action: 'read' })), total: 100 }
      })

      const prevButton = wrapper.find('button:first-of-type')
      await prevButton.trigger('click')
      await nextTick()
      await nextTick()

      expect(wrapper.vm.page).toBe(1)
      expect(userAPI.getLogs).toHaveBeenLastCalledWith(1, 20)
    })
  })
})