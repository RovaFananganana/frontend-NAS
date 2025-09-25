/**
 * @fileoverview Tests simples de performance pour les utilitaires
 */

import { describe, it, expect } from 'vitest'
import { generateTestFiles, measurePerformance } from '@/utils/performanceTest.js'

describe('Performance Utilities', () => {
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
      
      // Permettre une marge d'erreur de 30% pour la randomisation
      expect(directories.length).toBeGreaterThan(20)
      expect(directories.length).toBeLessThan(80)
    })

    it('should generate files with different extensions', () => {
      const files = generateTestFiles(50, { 
        includeDirectories: false,
        fileTypes: ['txt', 'pdf', 'jpg']
      })
      
      const extensions = new Set()
      files.forEach(file => {
        if (!file.is_directory) {
          const ext = file.name.split('.').pop()
          extensions.add(ext)
        }
      })
      
      expect(extensions.size).toBeGreaterThan(1)
    })
  })

  describe('measurePerformance', () => {
    it('should measure execution time', async () => {
      const testFn = () => {
        // Simuler une opération qui prend du temps
        let sum = 0
        for (let i = 0; i < 10000; i++) {
          sum += i
        }
        return sum
      }

      const { result, metrics } = await measurePerformance(testFn, 'test-operation')
      
      expect(result).toBe(49995000) // Somme de 0 à 9999
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
      expect(metrics.duration).toBeGreaterThan(5) // Au moins 5ms
    })

    it('should handle errors gracefully', async () => {
      const errorFn = () => {
        throw new Error('Test error')
      }

      await expect(measurePerformance(errorFn, 'error-test')).rejects.toThrow('Test error')
    })
  })

  describe('Performance Benchmarks', () => {
    it('should generate large datasets efficiently', async () => {
      const { metrics } = await measurePerformance(
        () => generateTestFiles(1000),
        'generate-1000-files'
      )

      expect(metrics.duration).toBeLessThan(1000) // Moins d'1 seconde
    })

    it('should handle sorting large datasets', async () => {
      const files = generateTestFiles(1000)
      
      const { metrics } = await measurePerformance(
        () => {
          return [...files].sort((a, b) => {
            return a.name.localeCompare(b.name)
          })
        },
        'sort-1000-files'
      )

      expect(metrics.duration).toBeLessThan(100) // Moins de 100ms
    })

    it('should handle filtering large datasets', async () => {
      const files = generateTestFiles(2000)
      
      const { metrics } = await measurePerformance(
        () => {
          return files.filter(f => !f.is_directory)
        },
        'filter-2000-files'
      )

      expect(metrics.duration).toBeLessThan(50) // Moins de 50ms
    })

    it('should handle mapping large datasets', async () => {
      const files = generateTestFiles(1500)
      
      const { metrics } = await measurePerformance(
        () => {
          return files.map(f => ({
            ...f,
            displayName: f.name.toUpperCase()
          }))
        },
        'map-1500-files'
      )

      expect(metrics.duration).toBeLessThan(100) // Moins de 100ms
    })
  })

  describe('Memory Efficiency', () => {
    it('should not create excessive objects', () => {
      const files = generateTestFiles(100)
      
      // Vérifier que chaque fichier a les propriétés attendues sans propriétés supplémentaires
      files.forEach(file => {
        const keys = Object.keys(file)
        expect(keys).toContain('name')
        expect(keys).toContain('path')
        expect(keys).toContain('is_directory')
        expect(keys).toContain('modified_time')
        expect(keys).toContain('created_time')
        expect(keys).toContain('permissions')
        
        if (!file.is_directory) {
          expect(keys).toContain('size')
          expect(keys).toContain('file_type')
        }
        
        // Pas plus de 8 propriétés par fichier
        expect(keys.length).toBeLessThanOrEqual(8)
      })
    })

    it('should reuse common values', () => {
      const files = generateTestFiles(100)
      
      // Vérifier que les permissions sont réutilisées
      const permissions = new Set(files.map(f => f.permissions))
      expect(permissions.size).toBeLessThanOrEqual(3) // Peu de valeurs différentes
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero files', () => {
      const files = generateTestFiles(0)
      expect(files).toHaveLength(0)
    })

    it('should handle single file', () => {
      const files = generateTestFiles(1)
      expect(files).toHaveLength(1)
      expect(files[0]).toHaveProperty('name')
    })

    it('should handle very large numbers', () => {
      // Test avec un nombre plus raisonnable pour les tests
      const files = generateTestFiles(5000)
      expect(files).toHaveLength(5000)
      
      // Vérifier que tous les fichiers ont des noms uniques
      const names = new Set(files.map(f => f.name))
      expect(names.size).toBe(5000)
    })

    it('should handle custom options', () => {
      const files = generateTestFiles(50, {
        includeDirectories: false,
        fileTypes: ['custom'],
        sizeRange: { min: 1000, max: 2000 },
        nameLength: { min: 10, max: 10 }
      })

      files.forEach(file => {
        expect(file.is_directory).toBe(false)
        expect(file.name).toMatch(/\.custom$/)
        expect(file.size).toBeGreaterThanOrEqual(1000)
        expect(file.size).toBeLessThanOrEqual(2000)
        expect(file.name.length).toBeGreaterThanOrEqual(10) // Au moins 10 chars + .custom
      })
    })
  })
})