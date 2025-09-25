/**
 * @fileoverview Composable pour l'optimisation des performances
 */

import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

/**
 * Composable pour l'optimisation des performances
 * @param {Object} options - Options de configuration
 * @returns {Object} API du composable
 */
export function usePerformanceOptimization(options = {}) {
  const {
    debounceDelay = 150, // Délai pour le debouncing
    throttleDelay = 16, // Délai pour le throttling (~60fps)
    enableAnimations = true, // Activer/désactiver les animations
    enableTransitions = true, // Activer/désactiver les transitions
    performanceMode = 'auto' // 'auto', 'performance', 'quality'
  } = options

  // État réactif
  const isPerformanceMode = ref(false)
  const animationsEnabled = ref(enableAnimations)
  const transitionsEnabled = ref(enableTransitions)
  const frameRate = ref(60)
  const lastFrameTime = ref(0)
  const frameCount = ref(0)
  const averageFrameTime = ref(16.67) // ~60fps

  // Détection des performances
  const performanceMetrics = ref({
    memory: 0,
    timing: 0,
    fps: 60,
    isLowEnd: false
  })

  // Utilitaires de performance
  const debounce = (func, delay = debounceDelay) => {
    let timeoutId
    return (...args) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func.apply(null, args), delay)
    }
  }

  const throttle = (func, delay = throttleDelay) => {
    let lastCall = 0
    return (...args) => {
      const now = Date.now()
      if (now - lastCall >= delay) {
        lastCall = now
        return func.apply(null, args)
      }
    }
  }

  // Mesure des performances
  const measurePerformance = () => {
    if (typeof performance !== 'undefined') {
      // Mesure de la mémoire si disponible
      if (performance.memory) {
        performanceMetrics.value.memory = performance.memory.usedJSHeapSize / 1024 / 1024 // MB
      }

      // Mesure du timing
      const timing = performance.now()
      performanceMetrics.value.timing = timing

      // Estimation des performances basée sur les métriques
      const isLowEnd = performanceMetrics.value.memory > 100 || // Plus de 100MB
                       averageFrameTime.value > 33 || // Moins de 30fps
                       (performance.memory && performance.memory.totalJSHeapSize > 50 * 1024 * 1024) // Plus de 50MB total

      performanceMetrics.value.isLowEnd = isLowEnd
      
      // Ajuster le mode performance automatiquement
      if (performanceMode === 'auto') {
        isPerformanceMode.value = isLowEnd
      }
    }
  }

  // Mesure du framerate
  const measureFrameRate = () => {
    const now = performance.now()
    
    if (lastFrameTime.value > 0) {
      const deltaTime = now - lastFrameTime.value
      frameCount.value++
      
      // Calculer la moyenne mobile du temps de frame
      averageFrameTime.value = (averageFrameTime.value * 0.9) + (deltaTime * 0.1)
      frameRate.value = Math.round(1000 / averageFrameTime.value)
      
      performanceMetrics.value.fps = frameRate.value
    }
    
    lastFrameTime.value = now
    
    // Continuer la mesure
    if (frameCount.value < 1000) { // Mesurer pendant 1000 frames
      requestAnimationFrame(measureFrameRate)
    }
  }

  // Optimisations conditionnelles
  const getOptimizedStyles = () => {
    if (isPerformanceMode.value) {
      return {
        willChange: 'auto',
        transform: 'translateZ(0)', // Force hardware acceleration
        backfaceVisibility: 'hidden',
        perspective: '1000px'
      }
    }
    return {}
  }

  const getTransitionDuration = (defaultDuration = '150ms') => {
    if (!transitionsEnabled.value || isPerformanceMode.value) {
      return '0ms'
    }
    return defaultDuration
  }

  const getAnimationDuration = (defaultDuration = '300ms') => {
    if (!animationsEnabled.value || isPerformanceMode.value) {
      return '0ms'
    }
    return defaultDuration
  }

  // Optimisation des rendus
  const shouldSkipRender = ref(false)
  const renderThrottle = throttle(() => {
    shouldSkipRender.value = false
  }, 16) // 60fps

  const requestOptimizedRender = () => {
    if (shouldSkipRender.value) return false
    shouldSkipRender.value = true
    renderThrottle()
    return true
  }

  // Gestion de la mémoire
  const cleanupUnusedData = (dataArray, maxSize = 1000) => {
    if (dataArray.length > maxSize) {
      return dataArray.slice(-maxSize) // Garder les derniers éléments
    }
    return dataArray
  }

  // Optimisation des événements
  const createOptimizedEventHandler = (handler, type = 'throttle') => {
    if (type === 'debounce') {
      return debounce(handler)
    } else if (type === 'throttle') {
      return throttle(handler)
    }
    return handler
  }

  // Détection des capacités du navigateur
  const browserCapabilities = ref({
    supportsIntersectionObserver: typeof IntersectionObserver !== 'undefined',
    supportsRequestIdleCallback: typeof requestIdleCallback !== 'undefined',
    supportsWebGL: (() => {
      try {
        const canvas = document.createElement('canvas')
        return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      } catch (e) {
        return false
      }
    })(),
    supportsWorkers: typeof Worker !== 'undefined',
    devicePixelRatio: window.devicePixelRatio || 1
  })

  // Optimisation basée sur les capacités
  const getOptimizationLevel = () => {
    const capabilities = browserCapabilities.value
    let level = 'high'

    if (!capabilities.supportsIntersectionObserver || 
        !capabilities.supportsWebGL || 
        capabilities.devicePixelRatio > 2) {
      level = 'medium'
    }

    if (performanceMetrics.value.isLowEnd || 
        performanceMetrics.value.fps < 30) {
      level = 'low'
    }

    return level
  }

  // Configuration adaptative
  const getAdaptiveConfig = () => {
    const level = getOptimizationLevel()
    
    const configs = {
      high: {
        batchSize: 50,
        virtualScrollThreshold: 100,
        animationDuration: '300ms',
        transitionDuration: '150ms',
        enableShadows: true,
        enableGradients: true
      },
      medium: {
        batchSize: 30,
        virtualScrollThreshold: 50,
        animationDuration: '200ms',
        transitionDuration: '100ms',
        enableShadows: true,
        enableGradients: false
      },
      low: {
        batchSize: 20,
        virtualScrollThreshold: 30,
        animationDuration: '0ms',
        transitionDuration: '0ms',
        enableShadows: false,
        enableGradients: false
      }
    }

    return configs[level]
  }

  // Méthodes de contrôle
  const enablePerformanceMode = () => {
    isPerformanceMode.value = true
    animationsEnabled.value = false
    transitionsEnabled.value = false
  }

  const disablePerformanceMode = () => {
    isPerformanceMode.value = false
    animationsEnabled.value = enableAnimations
    transitionsEnabled.value = enableTransitions
  }

  const togglePerformanceMode = () => {
    if (isPerformanceMode.value) {
      disablePerformanceMode()
    } else {
      enablePerformanceMode()
    }
  }

  // Initialisation
  onMounted(() => {
    measurePerformance()
    requestAnimationFrame(measureFrameRate)
    
    // Mesurer les performances périodiquement
    const interval = setInterval(measurePerformance, 5000) // Toutes les 5 secondes
    
    onUnmounted(() => {
      clearInterval(interval)
    })
  })

  // Watchers
  watch(isPerformanceMode, (newValue) => {
    if (newValue) {
      document.documentElement.classList.add('performance-mode')
    } else {
      document.documentElement.classList.remove('performance-mode')
    }
  })

  return {
    // État
    isPerformanceMode: computed(() => isPerformanceMode.value),
    animationsEnabled: computed(() => animationsEnabled.value),
    transitionsEnabled: computed(() => transitionsEnabled.value),
    frameRate: computed(() => frameRate.value),
    performanceMetrics: computed(() => performanceMetrics.value),
    browserCapabilities: computed(() => browserCapabilities.value),

    // Utilitaires
    debounce,
    throttle,
    measurePerformance,
    getOptimizedStyles,
    getTransitionDuration,
    getAnimationDuration,
    requestOptimizedRender,
    cleanupUnusedData,
    createOptimizedEventHandler,
    getOptimizationLevel,
    getAdaptiveConfig,

    // Contrôles
    enablePerformanceMode,
    disablePerformanceMode,
    togglePerformanceMode,

    // Computed
    shouldSkipRender: computed(() => shouldSkipRender.value)
  }
}

export default usePerformanceOptimization