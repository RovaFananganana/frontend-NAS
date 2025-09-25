/**
 * Tests pour les adaptations mobiles des composants de fichiers
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import DetailedListView from '../DetailedListView.vue'
import FileListItem from '../FileListItem.vue'
import ViewModeSelector from '../ViewModeSelector.vue'

// Mock des composables
const mockUseResponsive = vi.fn(() => ({
  isMobile: vi.fn(() => false),
  isTablet: vi.fn(() => false),
  isDesktop: vi.fn(() => true),
  isTouch: vi.fn(() => false),
  shouldShowColumn: vi.fn(() => true),
  touchSizes: { minTouchTarget: 44, buttonHeight: 48 },
  responsiveClasses: {}
}))

vi.mock('@/composables/useResponsive.js', () => ({
  useResponsive: mockUseResponsive
}))

vi.mock('@/composables/useTouchGestures.js', () => ({
  useTouchGestures: () => ({
    isGesturing: vi.fn(() => false),
    swipeDirection: vi.fn(() => null)
  })
}))

vi.mock('@/composables/useViewMode.js', () => ({
  useViewMode: () => ({
    sortColumn: vi.fn(() => 'name'),
    sortDirection: vi.fn(() => 'asc'),
    visibleColumns: [
      { key: 'name', label: 'Nom' },
      { key: 'size', label: 'Taille' },
      { key: 'type', label: 'Type' },
      { key: 'date', label: 'Date' }
    ],
    setSortColumn: vi.fn(),
    isSelected: vi.fn(() => false),
    sortFiles: vi.fn((files) => files),
    addShortcut: vi.fn(),
    currentMode: vi.fn(() => 'detailed-list'),
    availableModes: [
      { id: 'tree', label: 'Arbre', icon: 'fas fa-tree' },
      { id: 'detailed-list', label: 'Liste', icon: 'fas fa-list' }
    ],
    setCurrentMode: vi.fn()
  })
}))

// Mock des utilitaires
vi.mock('@/utils/mobileUtils.js', () => ({
  formatDateForScreen: vi.fn((date) => '01/01/24'),
  formatSizeForScreen: vi.fn((size) => '1 KB'),
  isTouchDevice: vi.fn(() => false),
  isMobileScreen: vi.fn(() => false)
}))

vi.mock('@/utils/fileUtils.js', () => ({
  formatBytes: vi.fn((bytes) => '1 KB'),
  formatDate: vi.fn((date) => '01/01/2024')
}))

describe('Adaptations mobiles', () => {
  let mockFiles

  beforeEach(() => {
    mockFiles = [
      {
        name: 'document.pdf',
        path: '/document.pdf',
        is_directory: false,
        size: 1024,
        modified_time: '2024-01-01T12:00:00Z'
      },
      {
        name: 'folder',
        path: '/folder',
        is_directory: true,
        size: 0,
        modified_time: '2024-01-01T12:00:00Z'
      }
    ]

    // Mock window.innerWidth pour les tests responsive
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('DetailedListView mobile', () => {
    it('devrait appliquer les classes mobiles quand isMobile est true', async () => {
      // Mock pour mobile
      mockUseResponsive.mockReturnValue({
        isMobile: vi.fn(() => true),
        isTablet: vi.fn(() => false),
        isDesktop: vi.fn(() => false),
        isTouch: vi.fn(() => true),
        shouldShowColumn: vi.fn(() => true),
        touchSizes: { minTouchTarget: 44, buttonHeight: 48 },
        responsiveClasses: { 'is-mobile': true, 'is-touch': true }
      })

      const wrapper = mount(DetailedListView, {
        props: {
          files: mockFiles,
          loading: false,
          error: '',
          currentPath: '/',
          focusedIndex: -1
        }
      })

      await nextTick()

      const container = wrapper.find('.detailed-list-view')
      expect(container.classes()).toContain('mobile-optimized')
      expect(container.classes()).toContain('touch-optimized')
    })

    it('devrait masquer les colonnes selon la taille d\'écran', async () => {
      const { useResponsive } = await import('@/composables/useResponsive.js')
      useResponsive.mockReturnValue({
        isMobile: vi.fn(() => true),
        isTablet: vi.fn(() => false),
        isDesktop: vi.fn(() => false),
        isTouch: vi.fn(() => true),
        shouldShowColumn: vi.fn((column) => {
          // Simuler le masquage de colonnes sur mobile
          if (column === 'date') return false
          if (column === 'type') return false
          return true
        }),
        touchSizes: { minTouchTarget: 44, buttonHeight: 48 },
        responsiveClasses: { 'is-mobile': true }
      })

      const wrapper = mount(DetailedListView, {
        props: {
          files: mockFiles,
          loading: false,
          error: '',
          currentPath: '/',
          focusedIndex: -1
        }
      })

      await nextTick()

      // Vérifier que seules les colonnes visibles sont affichées
      const headers = wrapper.findAll('th')
      expect(headers.length).toBe(2) // Seulement nom et taille
    })

    it('devrait utiliser des tailles tactiles appropriées', async () => {
      const { useResponsive } = await import('@/composables/useResponsive.js')
      useResponsive.mockReturnValue({
        isMobile: vi.fn(() => true),
        isTablet: vi.fn(() => false),
        isDesktop: vi.fn(() => false),
        isTouch: vi.fn(() => true),
        shouldShowColumn: vi.fn(() => true),
        touchSizes: { minTouchTarget: 44, buttonHeight: 48 },
        responsiveClasses: { 'is-touch': true }
      })

      const wrapper = mount(DetailedListView, {
        props: {
          files: mockFiles,
          loading: false,
          error: '',
          currentPath: '/',
          focusedIndex: -1
        }
      })

      await nextTick()

      const headers = wrapper.findAll('th')
      headers.forEach(header => {
        expect(header.attributes('style')).toContain('min-height: 44px')
      })
    })
  })

  describe('FileListItem mobile', () => {
    it('devrait adapter les tailles pour le tactile', () => {
      const wrapper = mount(FileListItem, {
        props: {
          file: mockFiles[0],
          selected: false,
          focused: false,
          index: 0,
          isMobile: true,
          isTouch: true,
          visibleColumns: [
            { key: 'name', label: 'Nom' },
            { key: 'size', label: 'Taille' }
          ]
        }
      })

      const row = wrapper.find('tr')
      expect(row.attributes('style')).toContain('min-height: 44px')
      expect(row.classes()).toContain('touch-manipulation')
    })

    it('devrait formater les données selon la taille d\'écran', async () => {
      const { formatDateForScreen, formatSizeForScreen } = await import('@/utils/mobileUtils.js')
      
      const wrapper = mount(FileListItem, {
        props: {
          file: mockFiles[0],
          selected: false,
          focused: false,
          index: 0,
          isMobile: true,
          isTouch: true,
          visibleColumns: [
            { key: 'name', label: 'Nom' },
            { key: 'size', label: 'Taille' },
            { key: 'date', label: 'Date' }
          ]
        }
      })

      await nextTick()

      // Vérifier que les fonctions de formatage mobile sont appelées
      expect(formatSizeForScreen).toHaveBeenCalled()
      expect(formatDateForScreen).toHaveBeenCalled()
    })

    it('devrait gérer les événements tactiles', async () => {
      const wrapper = mount(FileListItem, {
        props: {
          file: mockFiles[0],
          selected: false,
          focused: false,
          index: 0,
          isMobile: true,
          isTouch: true,
          visibleColumns: [{ key: 'name', label: 'Nom' }]
        }
      })

      const row = wrapper.find('tr')
      
      // Simuler un touchstart
      await row.trigger('touchstart', {
        touches: [{ clientX: 100, clientY: 100 }]
      })

      // Simuler un touchend rapide (tap)
      await row.trigger('touchend', {
        changedTouches: [{ clientX: 100, clientY: 100 }]
      })

      // Vérifier qu'un événement click a été émis
      expect(wrapper.emitted('click')).toBeTruthy()
    })
  })

  describe('ViewModeSelector mobile', () => {
    it('devrait adapter l\'interface pour mobile', async () => {
      const { useResponsive } = await import('@/composables/useResponsive.js')
      useResponsive.mockReturnValue({
        isMobile: vi.fn(() => true),
        isTouch: vi.fn(() => true),
        touchSizes: { minTouchTarget: 44, buttonHeight: 48 }
      })

      const wrapper = mount(ViewModeSelector, {
        props: {
          showShortcuts: false,
          size: 'md'
        }
      })

      await nextTick()

      const container = wrapper.find('.view-mode-selector')
      expect(container.classes()).toContain('touch-optimized')

      const buttons = wrapper.findAll('.btn')
      buttons.forEach(button => {
        expect(button.classes()).toContain('btn-lg') // Plus grand sur mobile tactile
        expect(button.classes()).toContain('flex-1')
      })
    })

    it('devrait désactiver les raccourcis clavier sur mobile', async () => {
      const { useResponsive } = await import('@/composables/useResponsive.js')
      useResponsive.mockReturnValue({
        isMobile: vi.fn(() => true),
        isTouch: vi.fn(() => true),
        touchSizes: { minTouchTarget: 44, buttonHeight: 48 }
      })

      const wrapper = mount(ViewModeSelector, {
        props: {
          showShortcuts: false // Désactivé sur mobile
        }
      })

      // Simuler un appui sur Ctrl+1
      const keyEvent = new KeyboardEvent('keydown', {
        key: '1',
        ctrlKey: true
      })

      document.dispatchEvent(keyEvent)

      // Vérifier que le mode n'a pas changé (raccourcis désactivés)
      expect(wrapper.emitted('mode-changed')).toBeFalsy()
    })
  })

  describe('Gestes tactiles', () => {
    it('devrait détecter les swipes', async () => {
      // Mock pour simuler un appareil tactile
      Object.defineProperty(window, 'ontouchstart', {
        value: true,
        writable: true
      })

      const { useTouchGestures } = await import('@/composables/useTouchGestures.js')
      const mockElement = { value: document.createElement('div') }
      
      const gestures = useTouchGestures(mockElement, {
        enableSwipe: true,
        swipeThreshold: 50
      })

      expect(gestures.isGesturing).toBeDefined()
      expect(gestures.swipeDirection).toBeDefined()
    })
  })

  describe('Utilitaires mobiles', () => {
    it('devrait détecter correctement les appareils tactiles', async () => {
      const { isTouchDevice } = await import('@/utils/mobileUtils.js')
      
      // Mock d'un appareil tactile
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 1,
        writable: true
      })

      expect(isTouchDevice()).toBe(true)
    })

    it('devrait adapter le formatage selon la taille d\'écran', async () => {
      const { formatSizeForScreen, formatDateForScreen } = await import('@/utils/mobileUtils.js')
      
      // Test sur petit écran
      expect(formatSizeForScreen(1024, 480)).toBe('1KB') // Format compact
      expect(formatDateForScreen('2024-01-01', 480)).toBe('01/01') // Format court
      
      // Test sur grand écran
      expect(formatSizeForScreen(1024, 1200)).toBe('1.0 KB') // Format complet
      expect(formatDateForScreen('2024-01-01', 1200)).toBe('01/01/2024') // Format complet
    })
  })
})