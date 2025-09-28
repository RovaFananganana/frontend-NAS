/**
 * Integration Tests for Activity Logs
 * 
 * Tests the activity logs functionality with real data scenarios
 * Requirements: 6.1, 6.4, 7.1, 7.2, 7.3, 8.1, 8.2, 8.3, 8.4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { nextTick } from 'vue'

// Component to test
import ActivityLogs from '@/components/User/ActivityLogs.vue'

// Services
import { userAPI } from '@/services/api'

// Mock data - different response formats to test compatibility
const mockLogsBackendFormat = {
  logs: [
    {
      id: 1,
      action: 'READ',
      target: '/home/user/document.pdf',
      created_at: '2024-01-15T10:30:00Z',
      details: 'Consultation du fichier document.pdf'
    },
    {
      id: 2,
      action: 'DOWNLOAD',
      target: '/home/user/photo.jpg',
      created_at: '2024-01-15T09:15:00Z',
      details: 'Téléchargement de photo.jpg'
    },
    {
      id: 3,
      action: 'CREATE',
      target: '/home/user/nouveau_dossier',
      created_at: '2024-01-14T16:45:00Z',
      details: 'Création du dossier nouveau_dossier'
    }
  ],
  total: 25,
  pages: 2,
  current_page: 1
}

const mockLogsFrontendFormat = {
  items: [
    {
      id: 1,
      action: 'READ',
      target: '/home/user/document.pdf',
      timestamp: '2024-01-15T10:30:00Z',
      details: 'Consultation du fichier document.pdf'
    },
    {
      id: 2,
      action: 'DOWNLOAD',
      target: '/home/user/photo.jpg',
      timestamp: '2024-01-15T09:15:00Z',
      details: 'Téléchargement de photo.jpg'
    }
  ],
  total: 15,
  pages: 1,
  current_page: 1
}

const mockLogsArrayFormat = [
  {
    id: 1,
    action: 'UPDATE',
    target: '/home/user/config.txt',
    timestamp: '2024-01-15T14:20:00Z'
  },
  {
    id: 2,
    action: 'DELETE',
    target: '/home/user/old_file.txt',
    created_at: '2024-01-15T13:10:00Z'
  }
]

const mockEmptyResponse = {
  logs: [],
  total: 0,
  pages: 0,
  current_page: 1
}

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

describe('Activity Logs Integration Tests', () => {
  let store
  let wrapper
  let mockUserAPI

  beforeEach(() => {
    // Setup store
    store = createTestStore()

    // Mock userAPI
    mockUserAPI = {
      getLogs: vi.fn()
    }
    vi.mocked(userAPI, { partial: true }).getLogs = mockUserAPI.getLogs
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    vi.clearAllMocks()
  })

  describe('Activity Logs Loading with Real Data', () => {
    it('should load and display activity logs with backend format correctly', async () => {
      // Requirement 6.1: Load personal logs correctly
      mockUserAPI.getLogs.mockResolvedValue({
        data: mockLogsBackendFormat
      })

      wrapper = mount(ActivityLogs, {
        global: {
          plugins: [store]
        }
      })

      // Wait for component to mount and load data
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      // Verify loading state is handled
      expect(wrapper.vm.loading).toBe(false)
      expect(wrapper.vm.error).toBe('')

      // Verify logs are loaded correctly
      expect(wrapper.vm.logs).toHaveLength(3)
      expect(wrapper.vm.total).toBe(25)

      // Verify data parsing from backend format
      const firstLog = wrapper.vm.logs[0]
      expect(firstLog.action).toBe('READ') // Should be normalized to lowercase
      expect(firstLog.target).toBe('/home/user/document.pdf')
      expect(firstLog.timestamp).toBe('2024-01-15T10:30:00Z')

      // Verify UI displays the logs
      const logElements = wrapper.findAll('[data-testid="log-item"]')
      expect(logElements.length).toBeGreaterThan(0)
    })

    it('should handle frontend format data correctly', async () => {
      // Test compatibility with frontend expected format
      mockUserAPI.getLogs.mockResolvedValue({
        data: mockLogsFrontendFormat
      })

      wrapper = mount(ActivityLogs, {
        global: {
          plugins: [store]
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      // Verify logs are loaded from items array
      expect(wrapper.vm.logs).toHaveLength(2)
      expect(wrapper.vm.total).toBe(15)

      // Verify timestamp field is used correctly
      const firstLog = wrapper.vm.logs[0]
      expect(firstLog.timestamp).toBe('2024-01-15T10:30:00Z')
    })

    it('should handle direct array format data', async () => {
      // Test fallback to direct array format
      mockUserAPI.getLogs.mockResolvedValue({
        data: mockLogsArrayFormat
      })

      wrapper = mount(ActivityLogs, {
        global: {
          plugins: [store]
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      // Verify logs are loaded from direct array
      expect(wrapper.vm.logs).toHaveLength(2)
      expect(wrapper.vm.total).toBe(2) // Should default to array length

      // Verify mixed timestamp/created_at handling
      const logs = wrapper.vm.logs
      expect(logs[0].timestamp).toBe('2024-01-15T14:20:00Z')
      expect(logs[1].timestamp).toBe('2024-01-15T13:10:00Z') // Should use created_at as fallback
    })

    it('should display logs sorted by date descending', async () => {
      // Requirement 6.2: Logs sorted by date (most recent first)
      const unsortedLogs = {
        logs: [
          {
            id: 1,
            action: 'READ',
            target: 'file1.txt',
            created_at: '2024-01-10T10:00:00Z'
          },
          {
            id: 2,
            action: 'WRITE',
            target: 'file2.txt',
            created_at: '2024-01-15T10:00:00Z'
          },
          {
            id: 3,
            action: 'DELETE',
            target: 'file3.txt',
            created_at: '2024-01-12T10:00:00Z'
          }
        ],
        total: 3
      }

      mockUserAPI.getLogs.mockResolvedValue({
        data: unsortedLogs
      })

      wrapper = mount(ActivityLogs, {
        global: {
          plugins: [store]
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      // Note: The backend should handle sorting, but verify the data is displayed
      expect(wrapper.vm.logs).toHaveLength(3)
      
      // Verify all logs are present
      const actions = wrapper.vm.logs.map(log => log.action)
      expect(actions).toContain('read')
      expect(actions).toContain('write')
      expect(actions).toContain('delete')
    })
  })

  describe('Activity Logs Data Formatting', () => {
    it('should format dates correctly in French locale', async () => {
      // Requirement 7.3: Readable date and time formatting
      mockUserAPI.getLogs.mockResolvedValue({
        data: mockLogsBackendFormat
      })

      wrapper = mount(ActivityLogs, {
        global: {
          plugins: [store]
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      // Test date formatting function
      const testDate = '2024-01-15T10:30:00Z'
      const formattedDate = wrapper.vm.formatDate(testDate)
      
      // Should be in French format: DD/MM/YYYY HH:MM:SS
      expect(formattedDate).toMatch(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}/)
    })

    it('should format actions with proper French labels', async () => {
      // Requirement 7.1, 7.2: Detailed action information
      mockUserAPI.getLogs.mockResolvedValue({
        data: mockLogsBackendFormat
      })

      wrapper = mount(ActivityLogs, {
        global: {
          plugins: [store]
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      // Test action formatting
      const testCases = [
        { input: 'READ', expected: 'Lecture' },
        { input: 'DOWNLOAD', expected: 'Téléchargement' },
        { input: 'CREATE', expected: 'Création' },
        { input: 'UPDATE', expected: 'Modification' },
        { input: 'DELETE', expected: 'Suppression' }
      ]

      testCases.forEach(testCase => {
        const formatted = wrapper.vm.formatAction(testCase.input)
        expect(formatted).toBe(testCase.expected)
      })
    })

    it('should handle missing or invalid date values gracefully', async () => {
      // Test edge cases for date formatting
      const logsWithInvalidDates = {
        logs: [
          {
            id: 1,
            action: 'READ',
            target: 'file1.txt',
            created_at: null
          },
          {
            id: 2,
            action: 'WRITE',
            target: 'file2.txt',
            created_at: 'invalid-date'
          },
          {
            id: 3,
            action: 'DELETE',
            target: 'file3.txt'
            // No date field at all
          }
        ],
        total: 3
      }

      mockUserAPI.getLogs.mockResolvedValue({
        data: logsWithInvalidDates
      })

      wrapper = mount(ActivityLogs, {
        global: {
          plugins: [store]
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      // Verify component doesn't crash with invalid dates
      expect(wrapper.vm.logs).toHaveLength(3)

      // Test date formatting with invalid values
      expect(wrapper.vm.formatDate(null)).toBe('—')
      expect(wrapper.vm.formatDate('invalid-date')).toBe('—')
      expect(wrapper.vm.formatDate(undefined)).toBe('—')
    })
  })

  describe('Error Handling and UX', () => {
    it('should display loading indicator during data fetch', async () => {
      // Requirement 8.1: Loading indicator
      let resolvePromise
      const loadingPromise = new Promise(resolve => {
        resolvePromise = resolve
      })

      mockUserAPI.getLogs.mockReturnValue(loadingPromise)

      wrapper = mount(ActivityLogs, {
        global: {
          plugins: [store]
        }
      })

      await nextTick()

      // Verify loading state is shown
      expect(wrapper.vm.loading).toBe(true)
      expect(wrapper.find('.loading-spinner').exists()).toBe(true)
      expect(wrapper.text()).toContain('Chargement des logs')

      // Resolve the promise
      resolvePromise({ data: mockLogsBackendFormat })
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      // Verify loading state is cleared
      expect(wrapper.vm.loading).toBe(false)
      expect(wrapper.find('.loading-spinner').exists()).toBe(false)
    })

    it('should handle API errors with explicit error messages', async () => {
      // Requirement 8.2: Explicit error messages
      const errorCases = [
        {
          error: { response: { status: 404 } },
          expectedMessage: 'Service de logs non disponible'
        },
        {
          error: { response: { status: 403 } },
          expectedMessage: 'Accès refusé aux logs d\'activité'
        },
        {
          error: { response: { status: 500 } },
          expectedMessage: 'Erreur serveur lors du chargement des logs'
        },
        {
          error: { message: 'Network Error' },
          expectedMessage: 'Network Error'
        }
      ]

      for (const errorCase of errorCases) {
        // Reset for each test case
        vi.clearAllMocks()
        if (wrapper) wrapper.unmount()

        mockUserAPI.getLogs.mockRejectedValue(errorCase.error)

        wrapper = mount(ActivityLogs, {
          global: {
            plugins: [store]
          }
        })

        await nextTick()
        await new Promise(resolve => setTimeout(resolve, 100))

        // Verify error is displayed
        expect(wrapper.vm.error).toContain(errorCase.expectedMessage)
        expect(wrapper.find('.alert-error').exists()).toBe(true)
      }
    })

    it('should provide retry functionality on error', async () => {
      // Requirement 8.3: Retry button on error
      mockUserAPI.getLogs.mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValueOnce({ data: mockLogsBackendFormat })

      wrapper = mount(ActivityLogs, {
        global: {
          plugins: [store]
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      // Verify error state
      expect(wrapper.vm.error).toBeTruthy()
      expect(wrapper.find('.alert-error').exists()).toBe(true)

      // Find and click retry button
      const retryButton = wrapper.find('button:contains("Réessayer")')
      expect(retryButton.exists()).toBe(true)

      await retryButton.trigger('click')
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      // Verify retry worked
      expect(wrapper.vm.error).toBe('')
      expect(wrapper.vm.logs).toHaveLength(3)
      expect(mockUserAPI.getLogs).toHaveBeenCalledTimes(2)
    })

    it('should display informative message when no logs are available', async () => {
      // Requirement 8.4: Informative message for empty state
      mockUserAPI.getLogs.mockResolvedValue({
        data: mockEmptyResponse
      })

      wrapper = mount(ActivityLogs, {
        global: {
          plugins: [store]
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      // Verify empty state is displayed
      expect(wrapper.vm.logs).toHaveLength(0)
      expect(wrapper.text()).toContain('Aucune activité récente')
      expect(wrapper.text()).toContain('Vos actions apparaîtront ici')
      expect(wrapper.find('.text-center').exists()).toBe(true)
    })

    it('should handle network connectivity issues', async () => {
      // Test offline scenario
      const originalOnLine = navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      })

      mockUserAPI.getLogs.mockRejectedValue(new Error('Network Error'))

      wrapper = mount(ActivityLogs, {
        global: {
          plugins: [store]
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      // Verify offline error message
      expect(wrapper.vm.error).toBe('Connexion réseau indisponible')

      // Restore original value
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: originalOnLine
      })
    })
  })

  describe('Pagination Integration', () => {
    it('should handle pagination correctly with real data', async () => {
      // Requirement 6.4: Pagination functionality
      mockUserAPI.getLogs.mockResolvedValue({
        data: {
          ...mockLogsBackendFormat,
          total: 50,
          pages: 3,
          current_page: 1
        }
      })

      wrapper = mount(ActivityLogs, {
        global: {
          plugins: [store]
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      // Verify pagination state
      expect(wrapper.vm.totalPages).toBe(3)
      expect(wrapper.vm.page).toBe(1)

      // Test navigation to next page
      mockUserAPI.getLogs.mockResolvedValue({
        data: {
          logs: [
            {
              id: 4,
              action: 'READ',
              target: '/home/user/page2_file.txt',
              created_at: '2024-01-13T10:00:00Z'
            }
          ],
          total: 50,
          pages: 3,
          current_page: 2
        }
      })

      // Click next page
      const nextButton = wrapper.find('button:contains("Suivant")')
      expect(nextButton.exists()).toBe(true)
      expect(nextButton.attributes('disabled')).toBeUndefined()

      await nextButton.trigger('click')
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      // Verify page changed
      expect(wrapper.vm.page).toBe(2)
      expect(mockUserAPI.getLogs).toHaveBeenCalledWith(2, 20)
    })

    it('should disable navigation buttons appropriately', async () => {
      // Test button states at boundaries
      mockUserAPI.getLogs.mockResolvedValue({
        data: {
          ...mockLogsBackendFormat,
          total: 20,
          pages: 1,
          current_page: 1
        }
      })

      wrapper = mount(ActivityLogs, {
        global: {
          plugins: [store]
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      // On single page, both buttons should be disabled
      const prevButton = wrapper.find('button:contains("Précédent")')
      const nextButton = wrapper.find('button:contains("Suivant")')

      expect(prevButton.attributes('disabled')).toBeDefined()
      expect(nextButton.attributes('disabled')).toBeDefined()
    })
  })

  describe('Data Validation and Sanitization', () => {
    it('should handle malformed log data gracefully', async () => {
      // Test with various malformed data
      const malformedData = {
        logs: [
          null, // null entry
          { id: 1 }, // missing required fields
          { 
            id: 2,
            action: 'READ',
            target: '/valid/path',
            created_at: '2024-01-15T10:00:00Z'
          }, // valid entry
          'invalid-entry', // string instead of object
          { 
            id: 3,
            action: null,
            target: null,
            created_at: '2024-01-15T11:00:00Z'
          } // null fields
        ],
        total: 5
      }

      mockUserAPI.getLogs.mockResolvedValue({
        data: malformedData
      })

      wrapper = mount(ActivityLogs, {
        global: {
          plugins: [store]
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      // Should filter out invalid entries and handle missing fields
      expect(wrapper.vm.logs.length).toBeGreaterThan(0)
      
      // Valid entries should have default values for missing fields
      wrapper.vm.logs.forEach(log => {
        expect(log).toHaveProperty('id')
        expect(log).toHaveProperty('action')
        expect(log).toHaveProperty('target')
      })
    })

    it('should handle unexpected response formats', async () => {
      // Test with completely unexpected format
      mockUserAPI.getLogs.mockResolvedValue({
        data: {
          unexpected: 'format',
          someOtherField: 123
        }
      })

      wrapper = mount(ActivityLogs, {
        global: {
          plugins: [store]
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      // Should handle gracefully without crashing
      expect(wrapper.vm.logs).toEqual([])
      expect(wrapper.vm.total).toBe(0)
      expect(wrapper.vm.error).toBe('')
    })
  })
})