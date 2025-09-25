/**
 * Composable pour la gestion responsive
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { 
  isTouchDevice, 
  isMobileScreen, 
  isTabletScreen, 
  isDesktopScreen,
  getBreakpoints,
  getVisibleColumns,
  getTouchSizes
} from '@/utils/mobileUtils.js'

export function useResponsive() {
  // État réactif
  const screenWidth = ref(window.innerWidth)
  const screenHeight = ref(window.innerHeight)
  const isTouch = ref(isTouchDevice())
  
  // Computed pour les breakpoints
  const breakpoints = computed(() => getBreakpoints())
  
  const isMobile = computed(() => screenWidth.value < breakpoints.value.tablet)
  const isTablet = computed(() => 
    screenWidth.value >= breakpoints.value.tablet && 
    screenWidth.value < breakpoints.value.desktop
  )
  const isDesktop = computed(() => screenWidth.value >= breakpoints.value.desktop)
  const isWide = computed(() => screenWidth.value >= breakpoints.value.wide)
  
  // Computed pour les colonnes visibles
  const visibleColumns = computed(() => getVisibleColumns(screenWidth.value))
  
  // Computed pour les tailles tactiles
  const touchSizes = computed(() => getTouchSizes(isTouch.value))
  
  // Computed pour les classes CSS conditionnelles
  const responsiveClasses = computed(() => ({
    'is-mobile': isMobile.value,
    'is-tablet': isTablet.value,
    'is-desktop': isDesktop.value,
    'is-wide': isWide.value,
    'is-touch': isTouch.value,
    'is-mouse': !isTouch.value
  }))
  
  // Computed pour la densité d'affichage
  const displayDensity = computed(() => {
    if (isMobile.value) return 'compact'
    if (isTablet.value) return 'comfortable'
    return 'spacious'
  })
  
  // Computed pour le nombre de colonnes dans une grille
  const gridColumns = computed(() => {
    if (isMobile.value) return 1
    if (isTablet.value) return 2
    if (isWide.value) return 4
    return 3
  })
  
  // Gestionnaire de redimensionnement
  const handleResize = () => {
    screenWidth.value = window.innerWidth
    screenHeight.value = window.innerHeight
  }
  
  // Gestionnaire de changement d'orientation
  const handleOrientationChange = () => {
    // Délai pour laisser le navigateur se redimensionner
    setTimeout(() => {
      screenWidth.value = window.innerWidth
      screenHeight.value = window.innerHeight
    }, 100)
  }
  
  // Méthodes utilitaires
  const isBreakpoint = (breakpoint) => {
    const bp = breakpoints.value[breakpoint]
    return bp ? screenWidth.value >= bp : false
  }
  
  const isBreakpointOnly = (breakpoint) => {
    const bp = breakpoints.value
    switch (breakpoint) {
      case 'mobile':
        return screenWidth.value < bp.tablet
      case 'tablet':
        return screenWidth.value >= bp.tablet && screenWidth.value < bp.desktop
      case 'desktop':
        return screenWidth.value >= bp.desktop && screenWidth.value < bp.wide
      case 'wide':
        return screenWidth.value >= bp.wide
      default:
        return false
    }
  }
  
  const getColumnCount = (maxColumns = 4) => {
    if (isMobile.value) return Math.min(1, maxColumns)
    if (isTablet.value) return Math.min(2, maxColumns)
    if (isDesktop.value) return Math.min(3, maxColumns)
    return Math.min(4, maxColumns)
  }
  
  const shouldShowColumn = (columnName) => {
    return visibleColumns.value[columnName] || false
  }
  
  const getOptimalItemSize = () => {
    if (isMobile.value) return { width: '100%', height: touchSizes.value.buttonHeight }
    if (isTablet.value) return { width: '48%', height: touchSizes.value.buttonHeight }
    return { width: '32%', height: touchSizes.value.buttonHeight }
  }
  
  // Méthodes pour les media queries programmatiques
  const matchMedia = (query) => {
    return window.matchMedia(query).matches
  }
  
  const prefersDarkMode = computed(() => matchMedia('(prefers-color-scheme: dark)'))
  const prefersReducedMotion = computed(() => matchMedia('(prefers-reduced-motion: reduce)'))
  const prefersHighContrast = computed(() => matchMedia('(prefers-contrast: high)'))
  
  // Fonction pour déterminer si la virtualisation doit être utilisée
  const shouldUseVirtualization = (itemCount, isMobileDevice = false) => {
    // Seuils différents selon le type d'appareil
    const mobileThreshold = 50
    const desktopThreshold = 100
    
    const threshold = isMobileDevice ? mobileThreshold : desktopThreshold
    return itemCount > threshold
  }
  
  // Lifecycle
  onMounted(() => {
    window.addEventListener('resize', handleResize, { passive: true })
    window.addEventListener('orientationchange', handleOrientationChange, { passive: true })
    
    // Mise à jour initiale
    handleResize()
  })
  
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('orientationchange', handleOrientationChange)
  })
  
  return {
    // État
    screenWidth,
    screenHeight,
    isTouch,
    
    // Breakpoints
    breakpoints,
    isMobile,
    isTablet,
    isDesktop,
    isWide,
    
    // Configuration
    visibleColumns,
    touchSizes,
    responsiveClasses,
    displayDensity,
    gridColumns,
    
    // Préférences système
    prefersDarkMode,
    prefersReducedMotion,
    prefersHighContrast,
    
    // Méthodes
    isBreakpoint,
    isBreakpointOnly,
    getColumnCount,
    shouldShowColumn,
    getOptimalItemSize,
    shouldUseVirtualization,
    matchMedia,
    handleResize,
    handleOrientationChange
  }
}