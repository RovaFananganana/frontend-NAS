import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useFileSearch } from '../useFileSearch.js'

// Mock nasAPI
vi.mock('@/services/nasAPI.js', () => ({
  nasAPI: {
    search: vi.fn()
  }
}))

// Mock fileUtils
vi.mock('@/utils/fileUtils.js', () => ({
  getFileIcon: vi.fn((item) => ({
    icon: item.is_directory ? 'fas fa-folder' : 'fas fa-file',
    color: item.is_directory ? 'text-blue-500' : 'text-gray-500',
    bgColor: 'from-gray-400 to-gray-600',
    textColor: 'text-white'
  }))
}))

describe('useFileSearch Performance Optimizations', () => {
  let searchComposable

  beforeEach(() => {
    vi.clearAllMocks()
    searchComposable = useFileSearch({
      maxResults: 5, // Small limit for testing
      searchTimeout: 100 // Short timeout for testing
    })
  })

  afterEach(() => {
    searchComposable.cleanup()
  })

  it('should automatically limit local search results', () => {
    const testFiles = Array.from({ length: 10 }, (_, i) => ({
      name: `file${i}.txt`,
      path: `/test/file${i}.txt`,
      is_directory: false
    }))

    const results = searchComposable.localSearch('file', testFiles)
    
    // Should be limited to maxResults (5)
    expect(results).toHaveLength(5)
    
    // Should have optimized icon info
    results.forEach(result => {
      expect(result.icon_info).toBeDefined()
      expect(result.icon_info.icon).toBe('fas fa-file')
      expect(result.source).toBe('local')
    })
  })

  it('should handle merge results with automatic limitation', () => {
    const localResults = Array.from({ length: 3 }, (_, i) => ({
      name: `local${i}.txt`,
      path: `/local/file${i}.txt`,
      is_directory: false,
      source: 'local'
    }))

    const remoteResults = Array.from({ length: 5 }, (_, i) => ({
      name: `remote${i}.txt`,
      path: `/remote/file${i}.txt`,
      is_directory: false,
      source: 'remote'
    }))

    const merged = searchComposable.mergeResults(localResults, remoteResults)
    
    // Should be limited to maxResults (5)
    expect(merged).toHaveLength(5)
    
    // Should prioritize local results
    expect(merged.slice(0, 3).every(r => r.name.startsWith('local'))).toBe(true)
    
    // Should have icon info for all results
    merged.forEach(result => {
      expect(result.icon_info).toBeDefined()
    })
  })

  it('should handle invalid inputs gracefully', () => {
    // Test with null/undefined inputs
    expect(searchComposable.localSearch('test', null)).toEqual([])
    expect(searchComposable.localSearch('', [])).toEqual([])
    expect(searchComposable.mergeResults(null, null)).toEqual([])
    expect(searchComposable.mergeResults(undefined, [])).toEqual([])
  })

  it('should update performance metrics', () => {
    const initialMetrics = searchComposable.performanceMetrics.value
    expect(initialMetrics.searchCount).toBe(0)
    expect(initialMetrics.averageSearchTime).toBe(0)

    // Simulate a search with timeout
    searchComposable.updatePerformanceMetrics(150, true)
    
    const updatedMetrics = searchComposable.performanceMetrics.value
    expect(updatedMetrics.searchCount).toBe(1)
    expect(updatedMetrics.averageSearchTime).toBe(150)
    expect(updatedMetrics.timeoutCount).toBe(1)
  })

  it('should provide optimized status messages', () => {
    // Test with no search
    expect(searchComposable.searchStatusMessage.value).toBe('')
    
    // Set up search state
    searchComposable.searchQuery.value = 'test'
    searchComposable.searchResults.value = []
    searchComposable.isSearching.value = false
    
    // Test no results
    expect(searchComposable.searchStatusMessage.value).toBe('Aucun résultat trouvé')
    
    // Test with results and truncation
    searchComposable.searchResults.value = [{ name: 'test.txt' }]
    searchComposable.searchStats.value = {
      totalFound: 1,
      truncated: true,
      searchTime: 150
    }
    
    expect(searchComposable.searchStatusMessage.value).toContain('limité')
  })
})