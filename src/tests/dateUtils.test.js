/**
 * Tests pour les utilitaires de date
 */

import { describe, it, expect } from 'vitest'
import { formatDate, formatRelativeDate, testDateFormats } from '@/utils/dateUtils.js'

describe('Date Utils', () => {
  it('should format GMT dates correctly', () => {
    const gmtDate = 'Fri, 17 Oct 2025 05:33:28 GMT'
    const formatted = formatDate(gmtDate)
    
    expect(formatted).toBeTruthy()
    expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4} à \d{2}:\d{2}/)
  })

  it('should format PostgreSQL dates correctly', () => {
    const pgDate = '2025-10-06 08:06:04.184352'
    const formatted = formatDate(pgDate)
    
    expect(formatted).toBeTruthy()
    expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4} à \d{2}:\d{2}/)
  })

  it('should format ISO dates correctly', () => {
    const isoDate = '2025-10-06T08:06:04.184Z'
    const formatted = formatDate(isoDate)
    
    expect(formatted).toBeTruthy()
    expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4} à \d{2}:\d{2}/)
  })

  it('should handle invalid dates gracefully', () => {
    expect(formatDate(null)).toBeNull()
    expect(formatDate('')).toBeNull()
    expect(formatDate('invalid date')).toBeNull()
  })

  it('should format relative dates correctly', () => {
    const now = new Date()
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
    
    const formatted = formatRelativeDate(fiveMinutesAgo.toISOString())
    expect(formatted).toBe('Il y a 5 min')
  })

  it('should run test formats without errors', () => {
    expect(() => testDateFormats()).not.toThrow()
  })
})