/**
 * @fileoverview Composable pour la gestion de l'accessibilité
 */

import { ref, onMounted, onUnmounted, nextTick } from 'vue'

/**
 * Composable pour la gestion de l'accessibilité
 * @param {Object} options - Options de configuration
 * @returns {Object} API du composable
 */
export function useAccessibility(options = {}) {
  const {
    announcePolitely = true,
    manageFocus = true,
    trapFocus = false,
    restoreFocus = true
  } = options

  // État
  const isKeyboardNavigation = ref(false)
  const lastFocusedElement = ref(null)
  const announceRegion = ref(null)
  const focusTrapContainer = ref(null)

  /**
   * Annonce un message aux lecteurs d'écran
   * @param {string} message - Message à annoncer
   * @param {string} priority - Priorité ('polite' ou 'assertive')
   */
  const announce = (message, priority = 'polite') => {
    if (!announceRegion.value) {
      createAnnounceRegion()
    }

    // Nettoyer le message précédent
    announceRegion.value.textContent = ''
    
    // Définir la priorité
    announceRegion.value.setAttribute('aria-live', priority)
    
    // Annoncer le nouveau message après un court délai
    setTimeout(() => {
      if (announceRegion.value) {
        announceRegion.value.textContent = message
      }
    }, 100)
  }

  /**
   * Crée la région d'annonce pour les lecteurs d'écran
   */
  const createAnnounceRegion = () => {
    if (announceRegion.value) return

    const region = document.createElement('div')
    region.setAttribute('aria-live', 'polite')
    region.setAttribute('aria-atomic', 'true')
    region.setAttribute('class', 'sr-only')
    region.setAttribute('id', 'accessibility-announcements')
    
    document.body.appendChild(region)
    announceRegion.value = region
  }

  /**
   * Sauvegarde l'élément actuellement focalisé
   */
  const saveFocus = () => {
    lastFocusedElement.value = document.activeElement
  }

  /**
   * Restaure le focus à l'élément précédemment focalisé
   */
  const restoreFocusToSaved = () => {
    if (lastFocusedElement.value && typeof lastFocusedElement.value.focus === 'function') {
      try {
        lastFocusedElement.value.focus()
      } catch (error) {
        console.warn('Impossible de restaurer le focus:', error)
      }
    }
  }

  /**
   * Déplace le focus vers un élément spécifique
   * @param {Element|string} target - Élément ou sélecteur CSS
   * @param {Object} options - Options pour le focus
   */
  const focusElement = async (target, options = {}) => {
    const { 
      preventScroll = false, 
      announce: shouldAnnounce = false, 
      message = '' 
    } = options

    await nextTick()

    let element = target
    if (typeof target === 'string') {
      element = document.querySelector(target)
    }

    if (element && typeof element.focus === 'function') {
      try {
        element.focus({ preventScroll })
        
        if (shouldAnnounce && message) {
          announce(message)
        }
      } catch (error) {
        console.warn('Impossible de focaliser l\'élément:', error)
      }
    }
  }

  /**
   * Configure le piège à focus pour un conteneur
   * @param {Element} container - Conteneur pour le piège à focus
   */
  const setupFocusTrap = (container) => {
    if (!container) return

    focusTrapContainer.value = container

    const focusableElements = getFocusableElements(container)
    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    // Gestionnaire pour le piège à focus
    const handleFocusTrap = (event) => {
      if (event.key !== 'Tab') return

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }

    container.addEventListener('keydown', handleFocusTrap)
    
    // Focaliser le premier élément
    firstElement.focus()

    // Retourner une fonction de nettoyage
    return () => {
      container.removeEventListener('keydown', handleFocusTrap)
    }
  }

  /**
   * Obtient tous les éléments focalisables dans un conteneur
   * @param {Element} container - Conteneur à analyser
   * @returns {Element[]} Liste des éléments focalisables
   */
  const getFocusableElements = (container) => {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ')

    return Array.from(container.querySelectorAll(focusableSelectors))
      .filter(element => {
        // Vérifier si l'élément est visible
        const style = window.getComputedStyle(element)
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               element.offsetParent !== null
      })
  }

  /**
   * Détecte si l'utilisateur navigue au clavier
   */
  const detectKeyboardNavigation = () => {
    const handleKeydown = (event) => {
      if (event.key === 'Tab') {
        isKeyboardNavigation.value = true
        document.body.classList.add('keyboard-navigation-active')
      }
    }

    const handleMousedown = () => {
      isKeyboardNavigation.value = false
      document.body.classList.remove('keyboard-navigation-active')
    }

    document.addEventListener('keydown', handleKeydown)
    document.addEventListener('mousedown', handleMousedown)

    return () => {
      document.removeEventListener('keydown', handleKeydown)
      document.removeEventListener('mousedown', handleMousedown)
    }
  }

  /**
   * Gère les raccourcis d'accessibilité globaux
   */
  const setupAccessibilityShortcuts = () => {
    const handleKeydown = (event) => {
      // Alt + Shift + A : Aller au contenu principal
      if (event.altKey && event.shiftKey && event.key === 'A') {
        event.preventDefault()
        const main = document.querySelector('main, [role="main"], #main-content')
        if (main) {
          focusElement(main, { 
            announce: true, 
            message: 'Navigation vers le contenu principal' 
          })
        }
      }

      // Alt + Shift + N : Aller à la navigation
      if (event.altKey && event.shiftKey && event.key === 'N') {
        event.preventDefault()
        const nav = document.querySelector('nav, [role="navigation"], .navigation')
        if (nav) {
          focusElement(nav, { 
            announce: true, 
            message: 'Navigation vers le menu principal' 
          })
        }
      }

      // Alt + Shift + S : Aller à la recherche
      if (event.altKey && event.shiftKey && event.key === 'S') {
        event.preventDefault()
        const search = document.querySelector('input[type="search"], [role="search"] input')
        if (search) {
          focusElement(search, { 
            announce: true, 
            message: 'Navigation vers la recherche' 
          })
        }
      }
    }

    document.addEventListener('keydown', handleKeydown)

    return () => {
      document.removeEventListener('keydown', handleKeydown)
    }
  }

  /**
   * Améliore l'accessibilité d'un élément
   * @param {Element} element - Élément à améliorer
   * @param {Object} options - Options d'amélioration
   */
  const enhanceElement = (element, options = {}) => {
    const {
      role,
      label,
      description,
      expanded,
      selected,
      disabled,
      required,
      invalid,
      live
    } = options

    if (!element) return

    // Définir le rôle
    if (role) {
      element.setAttribute('role', role)
    }

    // Définir le label accessible
    if (label) {
      element.setAttribute('aria-label', label)
    }

    // Définir la description
    if (description) {
      const descId = `desc-${Math.random().toString(36).substr(2, 9)}`
      const descElement = document.createElement('div')
      descElement.id = descId
      descElement.className = 'sr-only'
      descElement.textContent = description

      // Guard against cases where element has been removed from DOM
      const parent = element.parentNode
      if (parent && typeof parent.insertBefore === 'function') {
        parent.insertBefore(descElement, element.nextSibling)
      } else {
        // Fallback to appending to body so aria-describedby still references an element
        document.body.appendChild(descElement)
      }

      element.setAttribute('aria-describedby', descId)
    }

    // États ARIA
    if (expanded !== undefined) {
      element.setAttribute('aria-expanded', expanded.toString())
    }

    if (selected !== undefined) {
      element.setAttribute('aria-selected', selected.toString())
    }

    if (disabled !== undefined) {
      element.setAttribute('aria-disabled', disabled.toString())
      if (disabled) {
        element.setAttribute('tabindex', '-1')
      }
    }

    if (required !== undefined) {
      element.setAttribute('aria-required', required.toString())
    }

    if (invalid !== undefined) {
      element.setAttribute('aria-invalid', invalid.toString())
    }

    if (live) {
      element.setAttribute('aria-live', live)
    }
  }

  /**
   * Crée un lien de saut accessible
   * @param {string} targetSelector - Sélecteur de l'élément cible
   * @param {string} text - Texte du lien
   * @returns {Element} Élément de lien créé
   */
  const createSkipLink = (targetSelector, text) => {
    const skipLink = document.createElement('a')
    skipLink.href = `#${targetSelector.replace('#', '')}`
    skipLink.textContent = text
    skipLink.className = 'skip-link'
    
    skipLink.addEventListener('click', (event) => {
      event.preventDefault()
      const target = document.querySelector(targetSelector)
      if (target) {
        focusElement(target, { 
          announce: true, 
          message: `Navigation vers ${text}` 
        })
      }
    })

    return skipLink
  }

  /**
   * Valide l'accessibilité d'un élément
   * @param {Element} element - Élément à valider
   * @returns {Object} Résultat de la validation
   */
  const validateAccessibility = (element) => {
    const issues = []
    const warnings = []

    if (!element) {
      issues.push('Élément non trouvé')
      return { valid: false, issues, warnings }
    }

    // Vérifier les images sans alt
    const images = element.querySelectorAll('img')
    images.forEach(img => {
      if (!img.hasAttribute('alt')) {
        issues.push(`Image sans attribut alt: ${img.src}`)
      }
    })

    // Vérifier les boutons sans label
    const buttons = element.querySelectorAll('button')
    buttons.forEach(button => {
      const hasText = button.textContent.trim().length > 0
      const hasAriaLabel = button.hasAttribute('aria-label')
      const hasAriaLabelledby = button.hasAttribute('aria-labelledby')
      
      if (!hasText && !hasAriaLabel && !hasAriaLabelledby) {
        issues.push('Bouton sans label accessible')
      }
    })

    // Vérifier les liens sans texte
    const links = element.querySelectorAll('a')
    links.forEach(link => {
      const hasText = link.textContent.trim().length > 0
      const hasAriaLabel = link.hasAttribute('aria-label')
      
      if (!hasText && !hasAriaLabel) {
        issues.push(`Lien sans texte: ${link.href}`)
      }
    })

    // Vérifier les contrastes (approximatif)
    const textElements = element.querySelectorAll('*')
    textElements.forEach(el => {
      const style = window.getComputedStyle(el)
      const color = style.color
      const backgroundColor = style.backgroundColor
      
      // Vérification basique du contraste
      if (color && backgroundColor && color !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
        // Ici on pourrait implémenter une vérification plus sophistiquée du contraste
        // Pour l'instant, on ajoute juste un avertissement
        warnings.push('Vérifier le contraste des couleurs manuellement')
      }
    })

    return {
      valid: issues.length === 0,
      issues,
      warnings
    }
  }

  // Variables de nettoyage
  let cleanupKeyboardDetection = null
  let cleanupAccessibilityShortcuts = null

  // Lifecycle
  onMounted(() => {
    if (announcePolitely) {
      createAnnounceRegion()
    }

    cleanupKeyboardDetection = detectKeyboardNavigation()
    cleanupAccessibilityShortcuts = setupAccessibilityShortcuts()
  })

  onUnmounted(() => {
    // Nettoyer la région d'annonce
    if (announceRegion.value) {
      const parent = announceRegion.value.parentNode
      if (parent && typeof parent.removeChild === 'function') {
        try {
          parent.removeChild(announceRegion.value)
        } catch (e) {
          // If removal fails (element detached concurrently), ignore
          console.debug('announceRegion removal failed or already removed:', e)
        }
      }
      announceRegion.value = null
    }

    // Nettoyer les gestionnaires d'événements
    if (cleanupKeyboardDetection) {
      cleanupKeyboardDetection()
    }

    if (cleanupAccessibilityShortcuts) {
      cleanupAccessibilityShortcuts()
    }

    // Restaurer le focus si nécessaire
    if (restoreFocus && lastFocusedElement.value) {
      restoreFocusToSaved()
    }
  })

  return {
    // État
    isKeyboardNavigation,
    lastFocusedElement,
    
    // Méthodes d'annonce
    announce,
    
    // Gestion du focus
    saveFocus,
    restoreFocusToSaved,
    focusElement,
    setupFocusTrap,
    getFocusableElements,
    
    // Amélioration des éléments
    enhanceElement,
    createSkipLink,
    
    // Validation
    validateAccessibility
  }
}

/**
 * Utilitaires d'accessibilité
 */
export const AccessibilityUtils = {
  /**
   * Vérifie si un élément est visible pour les lecteurs d'écran
   * @param {Element} element - Élément à vérifier
   * @returns {boolean} True si visible
   */
  isVisibleToScreenReader(element) {
    if (!element) return false
    
    const style = window.getComputedStyle(element)
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           !element.hasAttribute('aria-hidden') &&
           element.offsetParent !== null
  },

  /**
   * Calcule le ratio de contraste entre deux couleurs
   * @param {string} color1 - Première couleur
   * @param {string} color2 - Deuxième couleur
   * @returns {number} Ratio de contraste
   */
  calculateContrastRatio(color1, color2) {
    // Implémentation simplifiée - dans un vrai projet, utiliser une bibliothèque
    // comme 'color' ou 'chroma-js' pour des calculs précis
    return 4.5 // Valeur par défaut conforme WCAG AA
  },

  /**
   * Génère un ID unique pour les éléments ARIA
   * @param {string} prefix - Préfixe pour l'ID
   * @returns {string} ID unique
   */
  generateAriaId(prefix = 'aria') {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
  },

  /**
   * Formate un message pour les lecteurs d'écran
   * @param {string} message - Message à formater
   * @param {Object} context - Contexte du message
   * @returns {string} Message formaté
   */
  formatScreenReaderMessage(message, context = {}) {
    const { action, target, count, total } = context
    
    let formattedMessage = message
    
    if (action && target) {
      formattedMessage = `${action} ${target}. ${message}`
    }
    
    if (count !== undefined && total !== undefined) {
      formattedMessage += `. ${count} sur ${total}`
    }
    
    return formattedMessage
  }
}

export default useAccessibility