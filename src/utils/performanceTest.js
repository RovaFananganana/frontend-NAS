// utils/performanceTest.js
import { PerformanceMonitor } from '../services/performance'
import { userAPI } from '../services/api'

/**
 * Comprehensive performance test suite for the frontend
 */
export class PerformanceTestSuite {
  constructor() {
    this.results = []
    this.isRunning = false
  }

  async runAllTests() {
    if (this.isRunning) {
      console.warn('Performance tests already running')
      return
    }

    this.isRunning = true
    this.results = []
    
    console.log('🚀 Starting comprehensive performance tests...')
    
    try {
      // Test API performance
      await this.testApiPerformance()
      
      // Test component rendering
      await this.testComponentRendering()
      
      // Test virtual scrolling
      await this.testVirtualScrolling()
      
      // Test bulk operations
      await this.testBulkOperations()
      
      // Test caching
      await this.testCaching()
      
      console.log('✅ Performance tests completed')
      this.printResults()
      
    } catch (error) {
      console.error('❌ Performance tests failed:', error)
    } finally {
      this.isRunning = false
    }
    
    return this.results
  }

  async testApiPerformance() {
    console.log('📡 Testing API performance...')
    
    const tests = [
      {
        name: 'Get User Profile',
        test: () => userAPI.getProfile()
      },
      {
        name: 'Get Dashboard Data',
        test: () => userAPI.getDashboard()
      },
      {
        name: 'Get Folders',
        test: () => userAPI.getFolders()
      },
      {
        name: 'Get Files',
        test: () => userAPI.getFiles()
      },
      {
        name: 'Get Storage Info',
        test: () => userAPI.getStorageInfo()
      }
    ]

    for (const { name, test } of tests) {
      const startTime = Date.now()
      
      try {
        await test()
        const duration = Date.now() - startTime
        
        this.results.push({
          category: 'API',
          test: name,
          duration,
          status: 'success',
          rating: this.ratePerformance(duration, 'api')
        })
        
        // Performance tracking for test
        console.log(`Test ${name} completed in ${duration}ms`)
          test: true,
          category: 'performance_test'
        })
        
      } catch (error) {
        this.results.push({
          category: 'API',
          test: name,
          duration: Date.now() - startTime,
          status: 'error',
          error: error.message,
          rating: 'failed'
        })
      }
    }
  }

  async testComponentRendering() {
    console.log('🎨 Testing component rendering performance...')
    
    // Test large list rendering
    const startTime = Date.now()
    
    // Simulate rendering 1000 items
    const items = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      type: i % 2 === 0 ? 'file' : 'folder',
      size: Math.random() * 1000000
    }))
    
    // Simulate DOM operations
    const fragment = document.createDocumentFragment()
    items.forEach(item => {
      const div = document.createElement('div')
      div.textContent = item.name
      div.className = 'test-item'
      fragment.appendChild(div)
    })
    
    const duration = Date.now() - startTime
    
    this.results.push({
      category: 'Rendering',
      test: 'Large List Rendering (1000 items)',
      duration,
      status: 'success',
      rating: this.ratePerformance(duration, 'render')
    })
    
    // Performance tracking for component render
    console.log(`Large list render completed in ${duration}ms`)
      itemCount: 1000,
      test: true
    })
  }

  async testVirtualScrolling() {
    console.log('📜 Testing virtual scrolling performance...')
    
    const startTime = Date.now()
    
    // Simulate virtual scrolling calculations
    const totalItems = 10000
    const itemHeight = 50
    const containerHeight = 400
    const scrollTop = 5000
    
    // Calculate visible range (simulating VirtualList logic)
    const visibleCount = Math.ceil(containerHeight / itemHeight)
    const startIndex = Math.floor(scrollTop / itemHeight)
    const endIndex = Math.min(totalItems, startIndex + visibleCount)
    
    // Simulate rendering visible items
    const visibleItems = []
    for (let i = startIndex; i < endIndex; i++) {
      visibleItems.push({
        id: i,
        name: `Item ${i}`,
        index: i
      })
    }
    
    const duration = Date.now() - startTime
    
    this.results.push({
      category: 'Virtual Scrolling',
      test: `Virtual Scroll Calculation (${totalItems} items)`,
      duration,
      status: 'success',
      rating: this.ratePerformance(duration, 'calculation'),
      metadata: {
        totalItems,
        visibleItems: visibleItems.length,
        startIndex,
        endIndex
      }
    })
  }

  async testBulkOperations() {
    console.log('📦 Testing bulk operations performance...')
    
    // Test bulk selection
    const startTime = Date.now()
    
    const items = Array.from({ length: 1000 }, (_, i) => ({ id: i }))
    const selectedItems = new Set()
    
    // Simulate bulk selection
    items.forEach(item => {
      if (item.id % 2 === 0) {
        selectedItems.add(item.id)
      }
    })
    
    const selectionDuration = Date.now() - startTime
    
    this.results.push({
      category: 'Bulk Operations',
      test: 'Bulk Selection (1000 items)',
      duration: selectionDuration,
      status: 'success',
      rating: this.ratePerformance(selectionDuration, 'calculation'),
      metadata: {
        totalItems: items.length,
        selectedItems: selectedItems.size
      }
    })
    
    // Test bulk filtering
    const filterStartTime = Date.now()
    
    const filteredItems = items.filter(item => 
      item.id.toString().includes('5')
    )
    
    const filterDuration = Date.now() - filterStartTime
    
    this.results.push({
      category: 'Bulk Operations',
      test: 'Bulk Filtering (1000 items)',
      duration: filterDuration,
      status: 'success',
      rating: this.ratePerformance(filterDuration, 'calculation'),
      metadata: {
        totalItems: items.length,
        filteredItems: filteredItems.length
      }
    })
  }

  async testCaching() {
    console.log('💾 Testing caching performance...')
    
    // Test Map-based cache performance
    const cache = new Map()
    const startTime = Date.now()
    
    // Add 1000 items to cache
    for (let i = 0; i < 1000; i++) {
      cache.set(`key_${i}`, {
        data: `value_${i}`,
        timestamp: Date.now(),
        ttl: 300000
      })
    }
    
    // Test cache lookups
    let hits = 0
    for (let i = 0; i < 1000; i++) {
      if (cache.has(`key_${i}`)) {
        hits++
      }
    }
    
    const duration = Date.now() - startTime
    
    this.results.push({
      category: 'Caching',
      test: 'Cache Operations (1000 items)',
      duration,
      status: 'success',
      rating: this.ratePerformance(duration, 'calculation'),
      metadata: {
        cacheSize: cache.size,
        hits,
        hitRate: (hits / 1000) * 100
      }
    })
  }

  ratePerformance(duration, type) {
    const thresholds = {
      api: { excellent: 50, good: 100, acceptable: 200, poor: 500 },
      render: { excellent: 10, good: 30, acceptable: 50, poor: 100 },
      calculation: { excellent: 1, good: 5, acceptable: 10, poor: 50 }
    }
    
    const threshold = thresholds[type] || thresholds.calculation
    
    if (duration <= threshold.excellent) return 'excellent'
    if (duration <= threshold.good) return 'good'
    if (duration <= threshold.acceptable) return 'acceptable'
    if (duration <= threshold.poor) return 'poor'
    return 'critical'
  }

  printResults() {
    console.log('\n📊 Performance Test Results:')
    console.log('=' .repeat(60))
    
    const categories = [...new Set(this.results.map(r => r.category))]
    
    categories.forEach(category => {
      console.log(`\n${category}:`)
      const categoryResults = this.results.filter(r => r.category === category)
      
      categoryResults.forEach(result => {
        const emoji = {
          excellent: '🟢',
          good: '🟡',
          acceptable: '🟠',
          poor: '🔴',
          critical: '💀',
          failed: '❌'
        }[result.rating] || '⚪'
        
        console.log(`  ${emoji} ${result.test}: ${result.duration}ms (${result.rating})`)
        
        if (result.metadata) {
          Object.entries(result.metadata).forEach(([key, value]) => {
            console.log(`    ${key}: ${value}`)
          })
        }
        
        if (result.error) {
          console.log(`    Error: ${result.error}`)
        }
      })
    })
    
    // Summary
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length
    const successRate = (this.results.filter(r => r.status === 'success').length / this.results.length) * 100
    
    console.log('\n📈 Summary:')
    console.log(`  Average Duration: ${avgDuration.toFixed(2)}ms`)
    console.log(`  Success Rate: ${successRate.toFixed(1)}%`)
    console.log(`  Total Tests: ${this.results.length}`)
  }

  exportResults() {
    return {
      timestamp: new Date().toISOString(),
      results: this.results,
      summary: {
        totalTests: this.results.length,
        successRate: (this.results.filter(r => r.status === 'success').length / this.results.length) * 100,
        averageDuration: this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length,
        categories: [...new Set(this.results.map(r => r.category))]
      }
    }
  }
}

// Global instance
export const performanceTestSuite = new PerformanceTestSuite()

// Utility function to run tests from console
window.runPerformanceTests = () => performanceTestSuite.runAllTests()

export default performanceTestSuite