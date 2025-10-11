import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useFileSearch } from '../useFileSearch.js'

// Mock nasAPI
vi.mock('@/services/nasAPI.js', () => ({
  nasAPI: {
    search: vi.fn().mockResolvedValue({
      success: true,
      results: []
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

describe('useFileSearch Stability Tests', () => {
  let searchComposable

  beforeEach(() => {
    vi.clearAllMocks()
    searchComposable = useFileSearch({
      maxResults: 5,
      searchTimeout: 1000
    })
  })

  afterEach(() => {
    searchComposable.cleanup()
  })

  it('should handle rapid search updates without errors', async () => {
    const testFiles = [
      {
        name: 'test1.txt',
        path: '/test1.txt',
        is_directory: false
      },
      {
        name: 'test2.txt',
        path: '/test2.txt',
        is_directory: false
      }
    ]

    // Perform multiple rapid searches
    const promises = []
    for (let i = 0; i < 5; i++) {
      promises.push(searchComposable.performSearch(`test${i}`, '/test', testFiles))
    }

    // Wait for all searches to complete
    await Promise.allSettled(promises)

    // Should not crash and should have some results
    expect(Array.isArray(searchComposable.searchResults.value)).toBe(true)
    expect(searchComposable.searchStats.value).toBeDefined()
  })

  it('should handle null/undefined inputs gracefully', async () => {
    // Test with null files
    await expect(searchComposable.performSearch('test', '/test', null)).resolves.not.toThrow()
    
    // Test with undefined files
    await expect(searchComposable.performSearch('test', '/test', undefined)).resolves.not.toThrow()
    
    // Test with empty query
    await expect(searchComposable.performSearch('', '/test', [])).resolves.not.toThrow()
    
    // Test with null query
    await expect(searchComposable.performSearch(null, '/test', [])).resolves.not.toThrow()
  })

  it('should maintain stable state during concurrent operations', async () => {
    const testFiles = [
      { name: 'file1.txt', path: '/file1.txt', is_directory: false },
      { name: 'file2.txt', path: '/file2.txt', is_directory: false }
    ]

    // Start a search
    const searchPromise = searchComposable.performSearch('file', '/test', testFiles)
    
    // Clear search while it's running
    searchComposable.clearSearch()
    
    // Wait for search to complete
    await searchPromise
    
    // State should be cleared
    expect(searchComposable.searchQuery.value).toBe('')
    expect(searchComposable.searchResults.value).toEqual([])
  })
})