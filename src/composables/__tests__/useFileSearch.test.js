import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useFileSearch } from '../useFileSearch.js'

// Mock nasAPI
vi.mock('@/services/nasAPI.js', () => ({
  nasAPI: {
    search: vi.fn()
  }
}))

describe('useFileSearch', () => {
  let fileSearch
  
  beforeEach(() => {
    fileSearch = useFileSearch()
    vi.clearAllMocks()
  })

  afterEach(() => {
    fileSearch.cleanup()
  })

  describe('localSearch', () => {
    it('should filter files by name', () => {
      const files = [
        { name: 'document.pdf', path: '/document.pdf' },
        { name: 'image.jpg', path: '/image.jpg' },
        { name: 'test.txt', path: '/test.txt' }
      ]

      const results = fileSearch.localSearch('doc', files)
      
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('document.pdf')
      expect(results[0].match_type).toBe('name')
      expect(results[0].source).toBe('local')
    })

    it('should return empty array for empty query', () => {
      const files = [{ name: 'test.txt', path: '/test.txt' }]
      const results = fileSearch.localSearch('', files)
      
      expect(results).toHaveLength(0)
    })

    it('should limit results to maxResults', () => {
      const files = Array.from({ length: 50 }, (_, i) => ({
        name: `file${i}.txt`,
        path: `/file${i}.txt`
      }))

      const results = fileSearch.localSearch('file', files)
      
      expect(results.length).toBeLessThanOrEqual(fileSearch.config.maxResults)
    })
  })

  describe('mergeResults', () => {
    it('should prioritize local results', () => {
      const localResults = [
        { name: 'local.txt', path: '/local.txt', source: 'local' }
      ]
      const remoteResults = [
        { name: 'remote.txt', path: '/remote.txt', source: 'remote' }
      ]

      const merged = fileSearch.mergeResults(localResults, remoteResults)
      
      expect(merged).toHaveLength(2)
      expect(merged[0].source).toBe('local')
      expect(merged[1].source).toBe('remote')
    })

    it('should deduplicate results by path', () => {
      const localResults = [
        { name: 'file.txt', path: '/file.txt', source: 'local' }
      ]
      const remoteResults = [
        { name: 'file.txt', path: '/file.txt', source: 'remote' }
      ]

      const merged = fileSearch.mergeResults(localResults, remoteResults)
      
      expect(merged).toHaveLength(1)
      expect(merged[0].source).toBe('local') // Local has priority
    })
  })

  describe('computed properties', () => {
    it('should compute isSearchActive correctly', () => {
      expect(fileSearch.isSearchActive.value).toBe(false)
      
      fileSearch.searchQuery.value = 'te'
      expect(fileSearch.isSearchActive.value).toBe(true)
      
      fileSearch.searchQuery.value = 't'
      expect(fileSearch.isSearchActive.value).toBe(false)
    })

    it('should compute hasResults correctly', () => {
      expect(fileSearch.hasResults.value).toBe(false)
      
      fileSearch.searchResults.value = [{ name: 'test.txt' }]
      expect(fileSearch.hasResults.value).toBe(true)
    })

    it('should compute searchStatusMessage correctly', () => {
      // No search active
      expect(fileSearch.searchStatusMessage.value).toBe('')
      
      // Search active but no results
      fileSearch.searchQuery.value = 'test'
      expect(fileSearch.searchStatusMessage.value).toBe('Aucun résultat trouvé')
      
      // Has results
      fileSearch.searchResults.value = [{ name: 'test.txt' }]
      fileSearch.searchStats.value.totalFound = 1
      expect(fileSearch.searchStatusMessage.value).toBe('1 résultat trouvé')
      
      // Multiple results
      fileSearch.searchResults.value = [{ name: 'test1.txt' }, { name: 'test2.txt' }]
      fileSearch.searchStats.value.totalFound = 2
      expect(fileSearch.searchStatusMessage.value).toBe('2 résultats trouvés')
    })
  })

  describe('clearSearch', () => {
    it('should reset all state', () => {
      fileSearch.searchQuery.value = 'test'
      fileSearch.searchResults.value = [{ name: 'test.txt' }]
      fileSearch.isSearching.value = true
      
      fileSearch.clearSearch()
      
      expect(fileSearch.searchQuery.value).toBe('')
      expect(fileSearch.searchResults.value).toHaveLength(0)
      expect(fileSearch.isSearching.value).toBe(false)
    })
  })
})