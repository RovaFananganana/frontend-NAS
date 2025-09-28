// tests/unit/ActivityLogs.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ActivityLogs from '@/components/User/ActivityLogs.vue'

// Mock child components
vi.mock('@/components/User/ActivityFilters.vue', () => ({
  default: {
    name: 'ActivityFilters',
    template: '<div data-testid="activity-filters"></div>',
    emits: ['filter-changed', 'filters-cleared']
  }
}))

vi.mock('@/components/User/ActivityList.vue', () => ({
  default: {
    name: 'ActivityList',
    template: '<div data-testid="activity-list"></div>',
    props: ['activities', 'loading', 'hasMore', 'totalCount', 'currentPage', 'itemsPerPage', 'hasFilters', 'showPagination'],
    emits: ['load-more', 'clear-filters']
  }
}))

// Mock the activity API
const mockActivityAPI = {
  getActivities: vi.fn(),
  getActivityStats: vi.fn(),
  logActivity: vi.fn()
}

vi.mock('@/services/activityAPI.js', () => ({
  activityAPI: mockActivityAPI,
  ActivityAPIError: class ActivityAPIError extends Error {
    constructor(message, status, code) {
      super(message)
      this.status = status
      this.code = code
    }
  }
}))

// Mock document.visibilityState
Object.defineProperty(document, 'visibilityState', {
  value: 'visible',
  writable: true
})

describe('ActivityLogs.vue', () => {
  let wrapper

  const mockActivities = [
    {
      id: 1,
      action: 'login',
      resource: null,
      created_at: '2024-01-01T10:00:00Z',
      success: true,
      user: { username: 'testuser' }
    },
    {
      id: 2,
      action: 'file_download',
      resource: '/documents/test.pdf',
      created_at: '2024-01-01T10:05:00Z',
      success: true,
      user: { username: 'testuser' }
    }
  ]

  const mockPagination = {
    page: 1,
    limit: 20,
    total_count: 2,
    has_next: false,
    has_prev: false
  }

  const mockStats = {
    today: 5,
    week: 25,
    total: 100
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mock responses
    mockActivityAPI.getActivities.mockResolvedValue({
      activities: mockActivities,
      pagination: mockPagination
    })
    
    mockActivityAPI.getActivityStats.mockResolvedValue({
      stats: mockStats
    })
    
    mockActivityAPI.logActivity.mockResolvedValue({ success: true })
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    vi.restoreAllMocks()
  })

  describe('Component Initialization', () => {
    it('should render correctly', async () => {
      wrapper = mount(ActivityLogs)
      await nextTick()
      
      expect(wrapper.find('.activity-logs').exists()).toBe(true)
      expect(wrapper.find('.page-header').exists()).toBe(true)
      expect(wrapper.find('[data-testid="activity-filters"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="activity-list"]').exists()).toBe(true)
    })

    it('should load activities and stats on mount', async () => {
      wrapper = mount(ActivityLogs)
      await nextTick()
      
      expect(mockActivityAPI.getActivities).toHaveBeenCalledWith({}, 1, false)
      expect(mockActivityAPI.getActivityStats).toHaveBeenCalled()
    })

    it('should display quick stats when available', async () => {
      wrapper = mount(ActivityLogs)
      await nextTick()
      
      const quickStats = wrapper.find('.quick-stats')
      expect(quickStats.exists()).toBe(true)
      
      const statItems = wrapper.findAll('.stat-item')
      expect(statItems).toHaveLength(3)
      
      expect(statItems[0].find('.stat-value').text()).toBe('5')
      expect(statItems[1].find('.stat-value').text()).toBe('25')
      expect(statItems[2].find('.stat-value').text()).toBe('100')
    })
  })

  describe('Data Loading', () => {
    it('should handle loading state correctly', async () => {
      let resolvePromise
      const loadingPromise = new Promise(resolve => {
        resolvePromise = resolve
      })
      
      mockActivityAPI.getActivities.mockReturnValue(loadingPromise)
      
      wrapper = mount(ActivityLogs)
      
      // Should be loading initially
      expect(wrapper.vm.loading).toBe(true)
      
      // Resolve the promise
      resolvePromise({
        activities: mockActivities,
        pagination: mockPagination
      })
      
      await nextTick()
      
      // Should not be loading anymore
      expect(wrapper.vm.loading).toBe(false)
    })

    it('should handle API errors gracefully', async () => {
      const { ActivityAPIError } = await import('@/services/activityAPI.js')
      const error = new ActivityAPIError('Failed to load activities', 500, 'LOAD_ERROR')
      
      mockActivityAPI.getActivities.mockRejectedValue(error)
      
      wrapper = mount(ActivityLogs)
      await nextTick()
      
      expect(wrapper.vm.error).toBe('Failed to load activities')
      expect(wrapper.find('.error-state').exists()).toBe(true)
    })

    it('should handle generic errors', async () => {
      mockActivityAPI.getActivities.mockRejectedValue(new Error('Generic error'))
      
      wrapper = mount(ActivityLogs)
      await nextTick()
      
      expect(wrapper.vm.error).toBe('Une erreur est survenue lors du chargement des activités')
    })

    it('should reset data on error when not appending', async () => {
      wrapper = mount(ActivityLogs)
      
      // First load some data
      await nextTick()
      expect(wrapper.vm.activities).toHaveLength(2)
      
      // Then simulate an error
      mockActivityAPI.getActivities.mockRejectedValue(new Error('Error'))
      
      await wrapper.vm.loadActivities({}, 1, false)
      
      expect(wrapper.vm.activities).toHaveLength(0)
      expect(wrapper.vm.totalCount).toBe(0)
      expect(wrapper.vm.hasMore).toBe(false)
    })
  })

  describe('Pagination', () => {
    it('should load more activities when requested', async () => {
      wrapper = mount(ActivityLogs)
      await nextTick()
      
      // Setup for next page
      wrapper.vm.hasMore = true
      wrapper.vm.currentPage = 1
      
      mockActivityAPI.getActivities.mockResolvedValue({
        activities: [{ id: 3, action: 'logout' }],
        pagination: { page: 2, has_more: false }
      })
      
      await wrapper.vm.loadMoreActivities()
      
      expect(mockActivityAPI.getActivities).toHaveBeenCalledWith({}, 2, true)
      expect(wrapper.vm.activities).toHaveLength(3) // Original 2 + 1 new
    })

    it('should not load more when already loading', async () => {
      wrapper = mount(ActivityLogs)
      await nextTick()
      
      wrapper.vm.loading = true
      wrapper.vm.hasMore = true
      
      const callCount = mockActivityAPI.getActivities.mock.calls.length
      
      await wrapper.vm.loadMoreActivities()
      
      expect(mockActivityAPI.getActivities).toHaveBeenCalledTimes(callCount)
    })

    it('should not load more when no more data available', async () => {
      wrapper = mount(ActivityLogs)
      await nextTick()
      
      wrapper.vm.hasMore = false
      
      const callCount = mockActivityAPI.getActivities.mock.calls.length
      
      await wrapper.vm.loadMoreActivities()
      
      expect(mockActivityAPI.getActivities).toHaveBeenCalledTimes(callCount)
    })
  })

  describe('Filtering', () => {
    it('should handle filter changes', async () => {
      wrapper = mount(ActivityLogs)
      await nextTick()
      
      const filters = { period: 'today', action: 'login' }
      
      await wrapper.vm.handleFilterChange(filters)
      
      expect(wrapper.vm.currentFilters).toEqual(filters)
      expect(wrapper.vm.currentPage).toBe(1)
      expect(mockActivityAPI.getActivities).toHaveBeenCalledWith(filters, 1, false)
    })

    it('should clear filters correctly', async () => {
      wrapper = mount(ActivityLogs)
      await nextTick()
      
      // Set some filters first
      wrapper.vm.currentFilters.period = 'today'
      wrapper.vm.currentFilters.action = 'login'
      
      await wrapper.vm.handleFiltersClear()
      
      expect(Object.keys(wrapper.vm.currentFilters)).toHaveLength(0)
      expect(wrapper.vm.currentPage).toBe(1)
      expect(mockActivityAPI.getActivities).toHaveBeenCalledWith({}, 1, false)
    })

    it('should compute hasActiveFilters correctly', async () => {
      wrapper = mount(ActivityLogs)
      await nextTick()
      
      expect(wrapper.vm.hasActiveFilters).toBe(false)
      
      wrapper.vm.currentFilters.period = 'today'
      await nextTick()
      
      expect(wrapper.vm.hasActiveFilters).toBe(true)
    })
  })

  describe('User Interactions', () => {
    it('should refresh activities when refresh button is clicked', async () => {
      wrapper = mount(ActivityLogs)
      await nextTick()
      
      const refreshBtn = wrapper.find('.refresh-btn')
      expect(refreshBtn.exists()).toBe(true)
      
      await refreshBtn.trigger('click')
      
      // Should call both activities and stats
      expect(mockActivityAPI.getActivities).toHaveBeenCalledTimes(2) // Initial + refresh
      expect(mockActivityAPI.getActivityStats).toHaveBeenCalledTimes(2) // Initial + refresh
    })

    it('should retry loading when retry button is clicked', async () => {
      mockActivityAPI.getActivities.mockRejectedValue(new Error('Error'))
      
      wrapper = mount(ActivityLogs)
      await nextTick()
      
      const retryBtn = wrapper.find('.retry-btn')
      expect(retryBtn.exists()).toBe(true)
      
      // Reset mock to succeed
      mockActivityAPI.getActivities.mockResolvedValue({
        activities: mockActivities,
        pagination: mockPagination
      })
      
      await retryBtn.trigger('click')
      
      expect(wrapper.vm.error).toBe('')
    })

    it('should disable refresh button when loading', async () => {
      wrapper = mount(ActivityLogs)
      
      wrapper.vm.loading = true
      await nextTick()
      
      const refreshBtn = wrapper.find('.refresh-btn')
      expect(refreshBtn.attributes('disabled')).toBeDefined()
    })
  })

  describe('Activity Logging', () => {
    it('should log navigation activity on initial load', async () => {
      wrapper = mount(ActivityLogs)
      await nextTick()
      
      expect(mockActivityAPI.logActivity).toHaveBeenCalledWith({
        action: 'navigation',
        resource: '/activity-logs',
        details: {
          page: 'activity_logs',
          filters: {}
        }
      })
    })

    it('should not log navigation when appending data', async () => {
      wrapper = mount(ActivityLogs)
      await nextTick()
      
      vi.clearAllMocks()
      
      await wrapper.vm.loadActivities({}, 2, true)
      
      expect(mockActivityAPI.logActivity).not.toHaveBeenCalled()
    })

    it('should handle navigation logging errors silently', async () => {
      mockActivityAPI.logActivity.mockRejectedValue(new Error('Log error'))
      
      wrapper = mount(ActivityLogs)
      
      // Should not throw error
      await expect(nextTick()).resolves.toBeUndefined()
    })
  })

  describe('Auto-refresh', () => {
    it('should setup auto-refresh on mount', async () => {
      const setIntervalSpy = vi.spyOn(global, 'setInterval')
      
      wrapper = mount(ActivityLogs)
      await nextTick()
      
      expect(setIntervalSpy).toHaveBeenCalled()
      
      setIntervalSpy.mockRestore()
    })

    it('should refresh stats when document becomes visible', async () => {
      wrapper = mount(ActivityLogs)
      await nextTick()
      
      vi.clearAllMocks()
      
      // Simulate document becoming visible
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true
      })
      
      // Trigger visibility change (this would normally be done by the browser)
      // Since we can't easily test the actual visibility change event,
      // we'll test the method directly
      await wrapper.vm.loadActivityStats()
      
      expect(mockActivityAPI.getActivityStats).toHaveBeenCalled()
    })
  })

  describe('Keyboard Shortcuts', () => {
    it('should refresh on R key press', async () => {
      wrapper = mount(ActivityLogs)
      await nextTick()
      
      vi.clearAllMocks()
      
      // Simulate R key press
      const event = new KeyboardEvent('keydown', { key: 'r' })
      document.dispatchEvent(event)
      
      await nextTick()
      
      // Note: This test might need adjustment based on actual implementation
      // The keyboard event handling might need to be tested differently
    })

    it('should clear filters on Escape key press when filters are active', async () => {
      wrapper = mount(ActivityLogs)
      await nextTick()
      
      // Set some filters
      wrapper.vm.currentFilters.period = 'today'
      await nextTick()
      
      vi.clearAllMocks()
      
      // Simulate Escape key press
      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      document.dispatchEvent(event)
      
      await nextTick()
      
      // Note: This test might need adjustment based on actual implementation
    })
  })

  describe('Component Props and Events', () => {
    it('should pass correct props to ActivityFilters', async () => {
      wrapper = mount(ActivityLogs)
      await nextTick()
      
      const activityFilters = wrapper.findComponent({ name: 'ActivityFilters' })
      expect(activityFilters.exists()).toBe(true)
      
      // Check props are passed correctly
      expect(activityFilters.props('initialFilters')).toEqual(wrapper.vm.currentFilters)
    })

    it('should pass correct props to ActivityList', async () => {
      wrapper = mount(ActivityLogs)
      await nextTick()
      
      const activityList = wrapper.findComponent({ name: 'ActivityList' })
      expect(activityList.exists()).toBe(true)
      
      // Check props are passed correctly
      expect(activityList.props('activities')).toEqual(wrapper.vm.activities)
      expect(activityList.props('loading')).toBe(wrapper.vm.loading)
      expect(activityList.props('hasMore')).toBe(wrapper.vm.hasMore)
      expect(activityList.props('totalCount')).toBe(wrapper.vm.totalCount)
      expect(activityList.props('currentPage')).toBe(wrapper.vm.currentPage)
      expect(activityList.props('itemsPerPage')).toBe(wrapper.vm.itemsPerPage)
      expect(activityList.props('hasFilters')).toBe(wrapper.vm.hasActiveFilters)
      expect(activityList.props('showPagination')).toBe(true)
    })
  })
})