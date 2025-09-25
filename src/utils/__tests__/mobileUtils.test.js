/**
 * Tests pour les utilitaires mobiles
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  isTouchDevice,
  isMobileScreen,
  isTabletScreen,
  isDesktopScreen,
  getBreakpoints,
  getVisibleColumns,
  getTouchSizes,
  formatDateForScreen,
  formatSizeForScreen,
  shouldUseVirtualization,
  getItemHeight
} from '../mobileUtils.js'

describe('Utilitaires mobiles', () => {
  let originalInnerWidth
  let originalMaxTouchPoints
  let originalOntouchstart

  beforeEach(() => {
    // Sauvegarder les valeurs originales
    originalInnerWidth = window.innerWidth
    originalMaxTouchPoints = navigator.maxTouchPoints
    originalOntouchstart = window.ontouchstart
  })

  afterEach(() => {
    // Restaurer les valeurs originales
    Object.defineProperty(window, 'innerWidth', {
      value: originalInnerWidth,
      writable: true
    })
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: originalMaxTouchPoints,
      writable: true
    })
    if (originalOntouchstart !== undefined) {
      window.ontouchstart = originalOntouchstart
    } else {
      delete window.ontouchstart
    }
  })

  describe('Détection d\'appareil', () => {
    it('devrait détecter un appareil tactile', () => {
      // Simuler un appareil tactile
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 1,
        writable: true
      })

      expect(isTouchDevice()).toBe(true)
    })

    it('devrait détecter un appareil non tactile', () => {
      // Simuler un appareil non tactile
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 0,
        writable: true
      })
      delete window.ontouchstart

      expect(isTouchDevice()).toBe(false)
    })
  })

  describe('Détection de taille d\'écran', () => {
    it('devrait détecter un écran mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 600,
        writable: true
      })

      expect(isMobileScreen()).toBe(true)
      expect(isTabletScreen()).toBe(false)
      expect(isDesktopScreen()).toBe(false)
    })

    it('devrait détecter un écran tablette', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 800,
        writable: true
      })

      expect(isMobileScreen()).toBe(false)
      expect(isTabletScreen()).toBe(true)
      expect(isDesktopScreen()).toBe(false)
    })

    it('devrait détecter un écran desktop', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 1200,
        writable: true
      })

      expect(isMobileScreen()).toBe(false)
      expect(isTabletScreen()).toBe(false)
      expect(isDesktopScreen()).toBe(true)
    })
  })

  describe('Breakpoints', () => {
    it('devrait retourner les breakpoints corrects', () => {
      const breakpoints = getBreakpoints()
      
      expect(breakpoints).toEqual({
        mobile: 640,
        tablet: 768,
        desktop: 1024,
        wide: 1280
      })
    })
  })

  describe('Colonnes visibles', () => {
    it('devrait masquer des colonnes sur petit écran', () => {
      const columns = getVisibleColumns(480) // Très petit écran
      
      expect(columns.name).toBe(true)
      expect(columns.size).toBe(true)
      expect(columns.type).toBe(false)
      expect(columns.date).toBe(false)
    })

    it('devrait afficher plus de colonnes sur tablette', () => {
      const columns = getVisibleColumns(800) // Tablette
      
      expect(columns.name).toBe(true)
      expect(columns.size).toBe(true)
      expect(columns.type).toBe(true)
      expect(columns.date).toBe(true)
    })

    it('devrait afficher toutes les colonnes sur desktop', () => {
      const columns = getVisibleColumns(1200) // Desktop
      
      expect(columns.name).toBe(true)
      expect(columns.size).toBe(true)
      expect(columns.type).toBe(true)
      expect(columns.date).toBe(true)
    })
  })

  describe('Tailles tactiles', () => {
    it('devrait retourner des tailles plus grandes pour le tactile', () => {
      const touchSizes = getTouchSizes(true)
      const nonTouchSizes = getTouchSizes(false)
      
      expect(touchSizes.minTouchTarget).toBeGreaterThan(nonTouchSizes.minTouchTarget)
      expect(touchSizes.buttonHeight).toBeGreaterThan(nonTouchSizes.buttonHeight)
    })

    it('devrait respecter les recommandations d\'accessibilité', () => {
      const touchSizes = getTouchSizes(true)
      
      expect(touchSizes.minTouchTarget).toBeGreaterThanOrEqual(44) // Recommandation Apple/Google
    })
  })

  describe('Formatage adaptatif', () => {
    it('devrait formater les dates selon la taille d\'écran', () => {
      const date = '2024-01-15T12:00:00Z'
      
      const mobileFormat = formatDateForScreen(date, 480)
      const tabletFormat = formatDateForScreen(date, 800)
      const desktopFormat = formatDateForScreen(date, 1200)
      
      expect(mobileFormat).toBe('15/01') // Format court
      expect(tabletFormat).toBe('15/01/24') // Format moyen
      expect(desktopFormat).toBe('15/01/2024') // Format complet
    })

    it('devrait formater les tailles selon la taille d\'écran', () => {
      const size = 1536 // 1.5 KB
      
      const mobileFormat = formatSizeForScreen(size, 480)
      const desktopFormat = formatSizeForScreen(size, 1200)
      
      expect(mobileFormat).toBe('2KB') // Format compact
      expect(desktopFormat).toBe('1.5 KB') // Format complet
    })

    it('devrait gérer les tailles nulles', () => {
      expect(formatSizeForScreen(0, 480)).toBe('—')
      expect(formatSizeForScreen(null, 480)).toBe('—')
      expect(formatSizeForScreen(undefined, 480)).toBe('—')
    })

    it('devrait gérer les dates nulles', () => {
      expect(formatDateForScreen(null, 480)).toBe('')
      expect(formatDateForScreen(undefined, 480)).toBe('')
      expect(formatDateForScreen('', 480)).toBe('')
    })
  })

  describe('Virtualisation', () => {
    it('devrait recommander la virtualisation pour de gros volumes sur mobile', () => {
      expect(shouldUseVirtualization(60, true)).toBe(true) // Seuil plus bas sur mobile
      expect(shouldUseVirtualization(40, true)).toBe(false)
    })

    it('devrait recommander la virtualisation pour de très gros volumes sur desktop', () => {
      expect(shouldUseVirtualization(120, false)).toBe(true)
      expect(shouldUseVirtualization(80, false)).toBe(false)
    })
  })

  describe('Hauteur d\'éléments', () => {
    it('devrait retourner des hauteurs plus grandes pour le tactile', () => {
      const touchHeight = getItemHeight(true, false)
      const nonTouchHeight = getItemHeight(false, false)
      
      expect(touchHeight).toBeGreaterThan(nonTouchHeight)
    })

    it('devrait retourner des hauteurs plus petites en mode compact', () => {
      const normalHeight = getItemHeight(true, false)
      const compactHeight = getItemHeight(true, true)
      
      expect(compactHeight).toBeLessThan(normalHeight)
    })

    it('devrait respecter les tailles minimales pour l\'accessibilité', () => {
      const touchHeight = getItemHeight(true, false)
      
      expect(touchHeight).toBeGreaterThanOrEqual(44) // Minimum recommandé
    })
  })
})