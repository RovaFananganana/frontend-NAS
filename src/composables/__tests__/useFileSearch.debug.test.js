import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useFileSearch } from '../useFileSearch.js'

// Mock nasAPI
vi.mock('@/services/nasAPI.js', () => ({
  nasAPI: {
    search: vi.fn().mockResolvedValue({
      success: true,
      results: [
        {
          name: 'remote-test.txt',
          path: '/remote/remote-test.txt',
          is_directory: false,
          size: 1024
        }
      ]
    })
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

describe('useFileSearch Debug Tests', () => {
  let searchComposable

  beforeEach(() => {
    vi.clearAllMocks()
    searchComposable = useFileSearch({
      maxResults: 10,
      searchTimeout: 2000
    })
  })

  afterEach(() => {
    searchComposable.cleanup()
  })

  it('should perform a complete search and return results', async () => {
    const testFiles = [
      {
        name: 'local-test.txt',
        path: '/local/local-test.txt',
        is_directory: false,
        size: 512
      },
      {
        name: 'another-file.pdf',
        path: '/local/another-file.pdf',
        is_directory: false,
        size: 2048
      }
    ]

    // Perform search
    await searchComposable.performSearch('test', '/test-path', testFiles)

    // Check that search results are populated
    expect(searchComposable.searchResults.value.length).toBeGreaterThan(0)
    
    // Check that local results are included
    const localResults = searchComposable.searchResults.value.filter(r => r.source === 'local')
    expect(localResults.length).toBeGreaterThan(0)
    
    // Check that results have icon info
    searchComposable.searchResults.value.forEach(result => {
      expect(result.icon_info).toBeDefined()
      expect(result.icon_info.icon).toBeDefined()
    })

    // Check search stats
    expect(searchComposable.searchStats.value.totalFound).toBeGreaterThan(0)
    expect(searchComposable.searchStats.value.localResults).toBeGreaterThan(0)
    
    console.log('Search results:', searchComposable.searchResults.value)
    console.log('Search stats:', searchComposable.searchStats.value)
  })

  it('should handle search state correctly', () => {
    // Initially no search
    expect(searchComposable.isSearchActive.value).toBe(false)
    expect(searchComposable.hasResults.value).toBe(false)
    
    // Set search query
    searchComposable.searchQuery.value = 'test'
    expect(searchComposable.isSearchActive.value).toBe(true)
    
    // Add some results
    searchComposable.searchResults.value = [
      { name: 'test.txt', path: '/test.txt', is_directory: false }
    ]
    expect(searchComposable.hasResults.value).toBe(true)
    
    // Check status message
    expect(searchComposable.searchStatusMessage.value).toContain('résultat')
  })

  it('should clear search correctly', () => {
    // Set up search state
    searchComposable.searchQuery.value = 'test'
    searchComposable.searchResults.value = [{ name: 'test.txt' }]
    
    // Clear search
    searchComposable.clearSearch()
    
    // Check that everything is cleared
    expect(searchComposable.searchQuery.value).toBe('')
    expect(searchComposable.searchResults.value).toEqual([])
    expect(searchComposable.isSearchActive.value).toBe(false)
    expect(searchComposable.hasResults.value).toBe(false)
  })
})