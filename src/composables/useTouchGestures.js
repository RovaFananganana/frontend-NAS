/**
 * Composable pour la gestion des gestes tactiles
 */
import { ref, onMounted, onUnmounted } from 'vue'

export function useTouchGestures(element, options = {}) {
  const {
    enableSwipe = true,
    enablePinch = true,
    swipeThreshold = 50,
    pinchThreshold = 0.1,
    preventScroll = false
  } = options

  // État des gestes
  const isGesturing = ref(false)
  const gestureType = ref(null)
  
  // État du swipe
  const swipeDirection = ref(null)
  const swipeDistance = ref(0)
  
  // État du pinch
  const pinchScale = ref(1)
  const pinchCenter = ref({ x: 0, y: 0 })
  
  // Variables internes pour le tracking
  let startTouches = []
  let currentTouches = []
  let initialDistance = 0
  let initialScale = 1
  let startTime = 0

  /**
   * Calcule la distance entre deux points
   */
  const getDistance = (touch1, touch2) => {
    const dx = touch1.clientX - touch2.clientX
    const dy = touch1.clientY - touch2.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  /**
   * Calcule le centre entre deux points
   */
  const getCenter = (touch1, touch2) => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    }
  }

  /**
   * Détermine la direction du swipe
   */
  const getSwipeDirection = (startTouch, endTouch) => {
    const dx = endTouch.clientX - startTouch.clientX
    const dy = endTouch.clientY - startTouch.clientY
    
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left'
    } else {
      return dy > 0 ? 'down' : 'up'
    }
  }

  /**
   * Gestionnaire de début de touch
   */
  const handleTouchStart = (event) => {
    if (preventScroll) {
      event.preventDefault()
    }

    startTouches = Array.from(event.touches)
    currentTouches = Array.from(event.touches)
    startTime = Date.now()
    isGesturing.value = true

    if (event.touches.length === 2 && enablePinch) {
      // Début du pinch
      gestureType.value = 'pinch'
      initialDistance = getDistance(event.touches[0], event.touches[1])
      pinchCenter.value = getCenter(event.touches[0], event.touches[1])
      initialScale = pinchScale.value
    } else if (event.touches.length === 1 && enableSwipe) {
      // Début du swipe
      gestureType.value = 'swipe'
      swipeDirection.value = null
      swipeDistance.value = 0
    }
  }

  /**
   * Gestionnaire de mouvement de touch
   */
  const handleTouchMove = (event) => {
    if (!isGesturing.value) return

    if (preventScroll) {
      event.preventDefault()
    }

    currentTouches = Array.from(event.touches)

    if (gestureType.value === 'pinch' && event.touches.length === 2) {
      // Gestion du pinch
      const currentDistance = getDistance(event.touches[0], event.touches[1])
      const scale = currentDistance / initialDistance
      pinchScale.value = initialScale * scale
      pinchCenter.value = getCenter(event.touches[0], event.touches[1])

      // Émettre l'événement pinch
      if (Math.abs(scale - 1) > pinchThreshold) {
        emit('pinch', {
          scale: pinchScale.value,
          center: pinchCenter.value,
          delta: scale - 1
        })
      }
    } else if (gestureType.value === 'swipe' && event.touches.length === 1) {
      // Gestion du swipe
      const startTouch = startTouches[0]
      const currentTouch = event.touches[0]
      
      const dx = currentTouch.clientX - startTouch.clientX
      const dy = currentTouch.clientY - startTouch.clientY
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      swipeDistance.value = distance
      
      if (distance > swipeThreshold) {
        const direction = getSwipeDirection(startTouch, currentTouch)
        if (swipeDirection.value !== direction) {
          swipeDirection.value = direction
          
          // Émettre l'événement swipe
          emit('swipe', {
            direction,
            distance,
            startPoint: { x: startTouch.clientX, y: startTouch.clientY },
            currentPoint: { x: currentTouch.clientX, y: currentTouch.clientY },
            velocity: distance / (Date.now() - startTime)
          })
        }
      }
    }
  }

  /**
   * Gestionnaire de fin de touch
   */
  const handleTouchEnd = (event) => {
    if (preventScroll) {
      event.preventDefault()
    }

    const duration = Date.now() - startTime

    if (gestureType.value === 'swipe' && swipeDistance.value > swipeThreshold) {
      // Swipe terminé
      emit('swipeEnd', {
        direction: swipeDirection.value,
        distance: swipeDistance.value,
        duration,
        velocity: swipeDistance.value / duration
      })
    } else if (gestureType.value === 'pinch') {
      // Pinch terminé
      emit('pinchEnd', {
        scale: pinchScale.value,
        center: pinchCenter.value,
        duration
      })
    }

    // Reset de l'état
    isGesturing.value = false
    gestureType.value = null
    swipeDirection.value = null
    swipeDistance.value = 0
    startTouches = []
    currentTouches = []
  }

  /**
   * Gestionnaire d'annulation de touch
   */
  const handleTouchCancel = (event) => {
    handleTouchEnd(event)
  }

  // Émissions d'événements
  const emit = (eventName, data) => {
    if (element.value) {
      element.value.dispatchEvent(new CustomEvent(eventName, { detail: data }))
    }
  }

  /**
   * Active les gestionnaires d'événements
   */
  const activate = () => {
    if (!element.value) return

    element.value.addEventListener('touchstart', handleTouchStart, { passive: !preventScroll })
    element.value.addEventListener('touchmove', handleTouchMove, { passive: !preventScroll })
    element.value.addEventListener('touchend', handleTouchEnd, { passive: !preventScroll })
    element.value.addEventListener('touchcancel', handleTouchCancel, { passive: !preventScroll })
  }

  /**
   * Désactive les gestionnaires d'événements
   */
  const deactivate = () => {
    if (!element.value) return

    element.value.removeEventListener('touchstart', handleTouchStart)
    element.value.removeEventListener('touchmove', handleTouchMove)
    element.value.removeEventListener('touchend', handleTouchEnd)
    element.value.removeEventListener('touchcancel', handleTouchCancel)
  }

  /**
   * Reset l'état des gestes
   */
  const reset = () => {
    isGesturing.value = false
    gestureType.value = null
    swipeDirection.value = null
    swipeDistance.value = 0
    pinchScale.value = 1
    pinchCenter.value = { x: 0, y: 0 }
    startTouches = []
    currentTouches = []
  }

  // Lifecycle
  onMounted(() => {
    if (element.value) {
      activate()
    }
  })

  onUnmounted(() => {
    deactivate()
  })

  return {
    // État
    isGesturing,
    gestureType,
    swipeDirection,
    swipeDistance,
    pinchScale,
    pinchCenter,
    
    // Méthodes
    activate,
    deactivate,
    reset
  }
}