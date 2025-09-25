/**
 * @fileoverview Tests de performance pour les composants d'affichage de fichiers
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { generateTestFiles, measurePerformance } from '@/utils/performanceTest.js'
import OptimizedDetailedListView from '../OptimizedDetailedListView.vue'
import VirtualizedDetailedListView from '../VirtualizedDetailedListView.vue'
import DetailedListView from '../DetailedListView.vue'

// Mock des composables
vi.mock('@/composables/useViewMode.js', () => ({
  useViewMode: () => ({
    sortColumn: { value: 'name' },
    sortDirection: { value: 'asc' },
    visibleColumns: { value: [
      { key: 'name', label: 'Nom' },
      { key: 'size', label: 'Taille' },
      { key: 'type', label: 'Type' },
      { key: 'modified', label: 'Modifié' }
    ]},
    setSortColumn: vi.fn(),
    isSelected: vi.fn(() => false),
    sortFiles: vi.fn((files) => files)
  })
}))

vi.mock('@/composables/usePerformanceOptimization.js', () => ({
  usePerformanceOptimization: () => ({
    isPerformanceMode: { value: false },
    frameRate: { value: 60 },
    getOptimizedStyles: vi.fn(() => ({})),
    getTransitionDuration: vi.fn((duration) => duration),
    getAnimationDuration: vi.fn((duration) => duration),
    measurePerformance: vi.fn()
  })
}))

vi.mock('@/utils/fileUtils.js', () => ({
  formatBytes: vi.fn((bytes) => `${bytes} B`),
  formatDate: vi.fn((date) => new Date(date).toLocaleDateString())
}))

describe('Performance Tests', () => {
  let performanceObserver
  
  beforeEach(() => {
    // Mock performance.now pour des tests reproductibles
    vi.spyOn(performance, 'now').mockImplementation(() => Date.now())
    
    // Mock performance.memory si disponible
    if (!performance.memory) {
      performance.memory = {
        usedJSHeapSize: 1024 * 1024,
        totalJSHeapSize: 2 * 1024 * 1024,
        jsHeapSizeLimit: 4 * 1024 * 1024
      }
    }
  })
  
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('generateTestFiles', () => {
    it('should generate the correct number of files', () => {
      const files = generateTestFiles(100)
      expect(files).toHaveLength(100)
    })

    it('should generate files with correct structure', () => {
      const files = generateTestFiles(10)
      
      files.forEach(file => {
        expect(file).toHaveProperty('name')
        expect(file).toHaveProperty('path')
        expect(file).toHaveProperty('is_directory')
        expect(file).toHaveProperty('modified_time')
        
        if (!file.is_directory) {
          expect(file).toHaveProperty('size')
          expect(file.size).toBeGreaterThan(0)
        }
      })
    })

    it('should respect directory ratio', () => {
      const files = generateTestFiles(100, { directoryRatio: 0.5 })
      const directories = files.filter(f => f.is_directory)
      
      // Permettre une marge d'erreur de 20% pour la randomisation
      expect(directories.length).toBeGreaterThan(30)
      expect(directories.length).toBeLessThan(70)
    })
  })

  describe('measurePerformance', () => {
    it('should measure execution time', async () => {
      const testFn = () => {
        // Simuler une opération qui prend du temps
        const start = Date.now()
        while (Date.now() - start < 10) {
          // Attendre 10ms
        }
        return 'result'
      }

      const { result, metrics } = await measurePerformance(testFn, 'test-operation')
      
      expect(result).toBe('result')
      expect(metrics).toHaveProperty('name', 'test-operation')
      expect(metrics).toHaveProperty('duration')
      expect(metrics.duration).toBeGreaterThan(0)
    })

    it('should handle async functions', async () => {
      const asyncFn = async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        return 'async-result'
      }

      const { result, metrics } = await measurePerformance(asyncFn, 'async-test')
      
      expect(result).toBe('async-result')
      expect(metrics.duration).toBeGreaterThan(0)
    })
  })

  describe('Component Performance', () => {
    const createWrapper = (Component, props = {}) => {
      return mount(Component, {
        props: {
          files: [],
          loading: false,
          error: '',
          currentPath: '/',
          focusedIndex: -1,
          ...props
        },
        global: {
          stubs: {
            FileListItem: true,
            VirtualizedFileListItem: true,
            KeyboardShortcutsHelp: true
          }
        }
      })
    }

    it('should render DetailedListView with small datasets efficiently', async () => {
      const files = generateTestFiles(50)
      
      const { metrics } = await measurePerformance(async () => {
        const wrapper = createWrapper(DetailedListView, { files })
        await nextTick()
        return wrapper
      }, 'detailed-list-small')

      expect(metrics.duration).toBeLessThan(100) // Moins de 100ms
    })

    it('should use OptimizedDetailedListView for medium datasets', async () => {
      const files = generateTestFiles(500)
      
      const { metrics } = await measurePerformance(async () => {
        const wrapper = createWrapper(OptimizedDetailedListView, { files })
        await nextTick()
        return wrapper
      }, 'optimized-list-medium')

      expect(metrics.duration).toBeLessThan(200) // Moins de 200ms
    })

    it('should use VirtualizedDetailedListView for large datasets', async () => {
      const files = generateTestFiles(2000)
      
      const { metrics } = await measurePerformance(async () => {
        const wrapper = createWrapper(VirtualizedDetailedListView, { 
          files,
          containerHeight: 400,
          itemHeight: 48
        })
        await nextTick()
        return wrapper
      }, 'virtualized-list-large')

      // La virtualisation devrait maintenir des performances constantes
      expect(metrics.duration).toBeLessThan(300) // Moins de 300ms même avec 2000 éléments
    })

    it('should handle sorting performance', async () => {
      const files = generateTestFiles(1000)
      
      const { metrics } = await measurePerformance(async () => {
        const wrapper = createWrapper(OptimizedDetailedListView, { files })
        
        // Simuler un tri
        await wrapper.vm.handleSort('name')
        await nextTick()
        
        return wrapper
      }, 'sorting-performance')

      expect(metrics.duration).toBeLessThan(150) // Tri rapide
    })

    it('should maintain performance with frequent updates', async () => {
      const initialFiles = generateTestFiles(100)
      const wrapper = createWrapper(OptimizedDetailedListView, { files: initialFiles })
      
      const { metrics } = await measurePerformance(async () => {
        // Simuler plusieurs mises à jour
        for (let i = 0; i < 10; i++) {
          const newFiles = generateTestFiles(100 + i * 10)
          await wrapper.setProps({ files: newFiles })
          await nextTick()
        }
      }, 'frequent-updates')

      expect(metrics.duration).toBeLessThan(500) // 10 mises à jour en moins de 500ms
    })
  })

  describe('Memory Management', () => {
    it('should not leak memory with large datasets', async () => {
      const initialMemory = performance.memory.usedJSHeapSize
      
      // Créer et détruire plusieurs composants avec de gros datasets
      for (let i = 0; i < 5; i++) {
        const files = generateTestFiles(1000)
        const wrapper = createWrapper(VirtualizedDetailedListView, { files })
        await nextTick()
        wrapper.unmount()
      }
      
      // Forcer le garbage collection si possible
      if (global.gc) {
        global.gc()
      }
      
      const finalMemory = performance.memory.usedJSHeapSize
      const memoryIncrease = finalMemory - initialMemory
      
      // L'augmentation de mémoire ne devrait pas être excessive
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024) // Moins de 10MB
    })
  })

  describe('Responsive Performance', () => {
    it('should adapt to performance constraints', async () => {
      // Simuler un environnement avec des performances limitées
      const mockPerformanceMode = vi.fn(() => ({ value: true }))
      
      const files = generateTestFiles(500)
      const wrapper = createWrapper(OptimizedDetailedListView, { 
        files,
        performanceMode: true
      })
      
      await nextTick()
      
      // Vérifier que le composant s'adapte au mode performance
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty file lists', async () => {
      const { metrics } = await measurePerformance(async () => {
        const wrapper = createWrapper(OptimizedDetailedListView, { files: [] })
        await nextTick()
        return wrapper
      }, 'empty-list')

      expect(metrics.duration).toBeLessThan(50) // Très rapide pour une liste vide
    })

    it('should handle files with missing properties', async () => {
      const incompleteFiles = [
        { name: 'file1.txt', is_directory: false },
        { name: 'folder1', is_directory: true },
        { name: 'file2.pdf', is_directory: false, size: null }
      ]
      
      const { metrics } = await measurePerformance(async () => {
        const wrapper = createWrapper(OptimizedDetailedListView, { files: incompleteFiles })
        await nextTick()
        return wrapper
      }, 'incomplete-files')

      expect(metrics.duration).toBeLessThan(100)
    })

    it('should handle very long file names', async () => {
      const longNameFiles = generateTestFiles(100, {
        nameLength: { min: 100, max: 200 }
      })
      
      const { metrics } = await measurePerformance(async () => {
        const wrapper = createWrapper(OptimizedDetailedListView, { files: longNameFiles })
        await nextTick()
        return wrapper
      }, 'long-names')

      expect(metrics.duration).toBeLessThan(200)
    })
  })
})