/**
 * @fileoverview Accessibility Utilities
 * Provides accessibility features and utilities for the file viewer
 */

/**
 * ARIA roles and properties for different file types
 */
export const ARIA_ROLES = {
  FILE_VIEWER: 'dialog',
  TEXT_EDITOR: 'textbox',
  IMAGE_VIEWER: 'img',
  PDF_VIEWER: 'document',
  MEDIA_PLAYER: 'application',
  DOCUMENT_VIEWER: 'document',
  ERROR_MESSAGE: 'alert',
  STATUS_MESSAGE: 'status',
  TOOLBAR: 'toolbar',
  BUTTON_GROUP: 'group'
}

/**
 * Accessibility Manager class
 */
export class AccessibilityManager {
  constructor() {
    this.announcements = []
    this.focusHistory = []
    this.screenReaderEnabled = this.detectScreenReader()
    this.highContrastMode = this.detectHighContrast()
    this.reducedMotion = this.detectReducedMotion()
  }

  /**
   * Detect if screen reader is likely being used
   * @returns {boolean} True if screen reader is detected
   */
  detectScreenReader() {
    // Check for common screen reader indicators
    return (
      navigator.userAgent.includes('NVDA') ||
      navigator.userAgent.includes('JAWS') ||
      navigator.userAgent.includes('VoiceOver') ||
      window.speechSynthesis !== undefined ||
      document.querySelector('[aria-live]') !== null
    )
  }

  /**
   * Detect high contrast mode
   * @returns {boolean} True if high contrast mode is active
   */
  detectHighContrast() {
    // Create a test element to detect high contrast
    const testElement = document.createElement('div')
    testElement.style.cssText = 'border: 1px solid; border-color: red green'
    document.body.appendChild(testElement)
    
    const computedStyle = window.getComputedStyle(testElement)
    const isHighContrast = computedStyle.borderTopColor === computedStyle.borderRightColor
    
    document.body.removeChild(testElement)
    return isHighContrast
  }

  /**
   * Detect reduced motion preference
   * @returns {boolean} True if reduced motion is preferred
   */
  detectReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  /**
   * Announce text to screen readers
   * @param {string} text - Text to announce
   * @param {string} priority - Priority level ('polite' or 'assertive')
   */
  announce(text, priority = 'polite') {
    if (!text) return

    // Create or update live region
    let liveRegion = document.getElementById('file-viewer-announcements')
    if (!liveRegion) {
      liveRegion = document.createElement('div')
      liveRegion.id = 'file-viewer-announcements'
      liveRegion.setAttribute('aria-live', priority)
      liveRegion.setAttribute('aria-atomic', 'true')
      liveRegion.style.cssText = `
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      `
      document.body.appendChild(liveRegion)
    }

    // Update the live region
    liveRegion.textContent = text
    
    // Store announcement for history
    this.announcements.push({
      text,
      priority,
      timestamp: new Date().toISOString()
    })

    // Keep only last 10 announcements
    if (this.announcements.length > 10) {
      this.announcements.shift()
    }
  }

  /**
   * Set focus to an element with proper handling
   * @param {HTMLElement} element - Element to focus
   * @param {Object} options - Focus options
   */
  setFocus(element, options = {}) {
    if (!element) return

    // Store current focus for history
    const currentFocus = document.activeElement
    if (currentFocus && currentFocus !== document.body) {
      this.focusHistory.push(currentFocus)
    }

    // Set focus with options
    element.focus(options)

    // Announce focus change if needed
    if (options.announce) {
      const label = this.getElementLabel(element)
      if (label) {
        this.announce(`Focus sur ${label}`)
      }
    }
  }

  /**
   * Restore previous focus
   */
  restoreFocus() {
    if (this.focusHistory.length > 0) {
      const previousElement = this.focusHistory.pop()
      if (previousElement && document.contains(previousElement)) {
        previousElement.focus()
      }
    }
  }

  /**
   * Get accessible label for an element
   * @param {HTMLElement} element - Element to get label for
   * @returns {string} Accessible label
   */
  getElementLabel(element) {
    if (!element) return ''

    // Try aria-label first
    if (element.getAttribute('aria-label')) {
      return element.getAttribute('aria-label')
    }

    // Try aria-labelledby
    const labelledBy = element.getAttribute('aria-labelledby')
    if (labelledBy) {
      const labelElement = document.getElementById(labelledBy)
      if (labelElement) {
        return labelElement.textContent || labelElement.innerText
      }
    }

    // Try associated label
    if (element.id) {
      const label = document.querySelector(`label[for="${element.id}"]`)
      if (label) {
        return label.textContent || label.innerText
      }
    }

    // Try title attribute
    if (element.title) {
      return element.title
    }

    // Try text content for buttons and links
    if (['BUTTON', 'A'].includes(element.tagName)) {
      return element.textContent || element.innerText
    }

    // Try alt text for images
    if (element.tagName === 'IMG' && element.alt) {
      return element.alt
    }

    return element.tagName.toLowerCase()
  }

  /**
   * Create accessible description for file content
   * @param {Object} content - File content object
   * @param {Object} file - File object
   * @returns {string} Accessible description
   */
  createContentDescription(content, file) {
    if (!content || !file) return ''

    const filename = file.name || 'fichier sans nom'
    const fileSize = this.formatFileSize(file.size)
    const fileType = content.type || 'type inconnu'

    let description = `${filename}, ${fileType}, ${fileSize}`

    // Add type-specific information
    switch (content.type) {
      case 'text':
        if (content.metadata?.lineCount) {
          description += `, ${content.metadata.lineCount} lignes`
        }
        if (content.metadata?.language) {
          description += `, langage ${content.metadata.language}`
        }
        break

      case 'image':
        if (content.metadata?.width && content.metadata?.height) {
          description += `, ${content.metadata.width} par ${content.metadata.height} pixels`
        }
        if (content.metadata?.format) {
          description += `, format ${content.metadata.format}`
        }
        break

      case 'pdf':
        if (content.metadata?.pageCount) {
          description += `, ${content.metadata.pageCount} pages`
        }
        break

      case 'video':
      case 'audio':
        if (content.metadata?.duration) {
          description += `, durée ${this.formatDuration(content.metadata.duration)}`
        }
        break

      case 'document':
        if (content.metadata?.documentType) {
          description += `, document ${content.metadata.documentType}`
        }
        break
    }

    // Add edit capability info
    if (content.editable) {
      description += ', modifiable'
    } else {
      description += ', lecture seule'
    }

    return description
  }

  /**
   * Format file size for accessibility
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted size
   */
  formatFileSize(bytes) {
    if (!bytes) return '0 octets'
    
    const sizes = ['octets', 'Ko', 'Mo', 'Go']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    const size = (bytes / Math.pow(1024, i)).toFixed(1)
    
    return `${size} ${sizes[i]}`
  }

  /**
   * Format duration for accessibility
   * @param {number} seconds - Duration in seconds
   * @returns {string} Formatted duration
   */
  formatDuration(seconds) {
    if (!seconds) return '0 seconde'
    
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    const parts = []
    if (hours > 0) parts.push(`${hours} heure${hours > 1 ? 's' : ''}`)
    if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`)
    if (secs > 0 || parts.length === 0) parts.push(`${secs} seconde${secs > 1 ? 's' : ''}`)
    
    return parts.join(' et ')
  }

  /**
   * Create keyboard navigation instructions
   * @param {string} context - Current context
   * @returns {string} Navigation instructions
   */
  createNavigationInstructions(context) {
    const instructions = {
      'global': 'Utilisez Échap pour fermer, Ctrl+S pour sauvegarder, Tab pour changer de mode',
      'text': 'Utilisez Ctrl+F pour rechercher, Ctrl+G pour aller à une ligne',
      'image': 'Utilisez + et - pour zoomer, les flèches pour naviguer',
      'pdf': 'Utilisez Page Haut/Bas pour naviguer entre les pages, Ctrl+F pour rechercher',
      'media': 'Utilisez Espace pour lecture/pause, M pour couper le son',
      'document': 'Utilisez Ctrl+F pour rechercher, Ctrl+Page Haut/Bas pour changer d\'onglet'
    }
    
    return instructions[context] || instructions['global']
  }

  /**
   * Setup accessibility attributes for an element
   * @param {HTMLElement} element - Element to setup
   * @param {Object} options - Accessibility options
   */
  setupAccessibility(element, options = {}) {
    if (!element) return

    const {
      role,
      label,
      description,
      expanded,
      selected,
      disabled,
      required,
      invalid,
      live,
      atomic,
      controls,
      describedBy
    } = options

    // Set role
    if (role) {
      element.setAttribute('role', role)
    }

    // Set label
    if (label) {
      element.setAttribute('aria-label', label)
    }

    // Set description
    if (description) {
      // Create or update description element
      let descId = element.getAttribute('aria-describedby')
      if (!descId) {
        descId = `desc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        element.setAttribute('aria-describedby', descId)
      }
      
      let descElement = document.getElementById(descId)
      if (!descElement) {
        descElement = document.createElement('div')
        descElement.id = descId
        descElement.style.cssText = `
          position: absolute;
          left: -10000px;
          width: 1px;
          height: 1px;
          overflow: hidden;
        `
        document.body.appendChild(descElement)
      }
      
      descElement.textContent = description
    }

    // Set state attributes
    if (expanded !== undefined) element.setAttribute('aria-expanded', expanded)
    if (selected !== undefined) element.setAttribute('aria-selected', selected)
    if (disabled !== undefined) element.setAttribute('aria-disabled', disabled)
    if (required !== undefined) element.setAttribute('aria-required', required)
    if (invalid !== undefined) element.setAttribute('aria-invalid', invalid)

    // Set live region attributes
    if (live) element.setAttribute('aria-live', live)
    if (atomic !== undefined) element.setAttribute('aria-atomic', atomic)

    // Set relationship attributes
    if (controls) element.setAttribute('aria-controls', controls)
    if (describedBy) element.setAttribute('aria-describedby', describedBy)

    // Ensure element is focusable if it has interactive role
    const interactiveRoles = ['button', 'link', 'textbox', 'combobox', 'slider', 'tab']
    if (role && interactiveRoles.includes(role) && !element.hasAttribute('tabindex')) {
      element.setAttribute('tabindex', '0')
    }
  }

  /**
   * Create skip links for better navigation
   * @param {Array} links - Array of skip link objects
   */
  createSkipLinks(links) {
    const skipContainer = document.createElement('div')
    skipContainer.className = 'skip-links'
    skipContainer.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      z-index: 1000;
    `

    links.forEach(link => {
      const skipLink = document.createElement('a')
      skipLink.href = `#${link.target}`
      skipLink.textContent = link.text
      skipLink.className = 'skip-link'
      skipLink.style.cssText = `
        position: absolute;
        left: -10000px;
        top: auto;
        width: 1px;
        height: 1px;
        overflow: hidden;
        background: #000;
        color: #fff;
        padding: 8px 16px;
        text-decoration: none;
        border-radius: 4px;
      `

      // Show on focus
      skipLink.addEventListener('focus', () => {
        skipLink.style.cssText = `
          position: static;
          width: auto;
          height: auto;
          overflow: visible;
          background: #000;
          color: #fff;
          padding: 8px 16px;
          text-decoration: none;
          border-radius: 4px;
          margin-right: 8px;
        `
      })

      skipLink.addEventListener('blur', () => {
        skipLink.style.cssText = `
          position: absolute;
          left: -10000px;
          top: auto;
          width: 1px;
          height: 1px;
          overflow: hidden;
          background: #000;
          color: #fff;
          padding: 8px 16px;
          text-decoration: none;
          border-radius: 4px;
        `
      })

      skipContainer.appendChild(skipLink)
    })

    return skipContainer
  }

  /**
   * Get recent announcements
   * @returns {Array} Array of recent announcements
   */
  getRecentAnnouncements() {
    return [...this.announcements]
  }

  /**
   * Clear announcement history
   */
  clearAnnouncements() {
    this.announcements = []
  }
}

/**
 * Default accessibility manager instance
 */
export const accessibilityManager = new AccessibilityManager()

/**
 * Utility functions for common accessibility tasks
 */
export const a11yUtils = {
  /**
   * Make an element screen reader only
   * @param {HTMLElement} element - Element to hide visually
   */
  makeScreenReaderOnly(element) {
    if (!element) return
    
    element.style.cssText = `
      position: absolute !important;
      left: -10000px !important;
      width: 1px !important;
      height: 1px !important;
      overflow: hidden !important;
      clip: rect(1px, 1px, 1px, 1px) !important;
      white-space: nowrap !important;
    `
  },

  /**
   * Create accessible button
   * @param {string} text - Button text
   * @param {Function} onClick - Click handler
   * @param {Object} options - Additional options
   * @returns {HTMLElement} Button element
   */
  createAccessibleButton(text, onClick, options = {}) {
    const button = document.createElement('button')
    button.textContent = text
    button.addEventListener('click', onClick)
    
    accessibilityManager.setupAccessibility(button, {
      role: 'button',
      label: options.label || text,
      description: options.description,
      disabled: options.disabled
    })
    
    return button
  },

  /**
   * Create accessible heading
   * @param {string} text - Heading text
   * @param {number} level - Heading level (1-6)
   * @param {Object} options - Additional options
   * @returns {HTMLElement} Heading element
   */
  createAccessibleHeading(text, level = 2, options = {}) {
    const heading = document.createElement(`h${Math.max(1, Math.min(6, level))}`)
    heading.textContent = text
    
    if (options.id) {
      heading.id = options.id
    }
    
    if (options.className) {
      heading.className = options.className
    }
    
    return heading
  },

  /**
   * Create accessible status message
   * @param {string} message - Status message
   * @param {string} type - Message type ('info', 'success', 'warning', 'error')
   * @returns {HTMLElement} Status element
   */
  createStatusMessage(message, type = 'info') {
    const status = document.createElement('div')
    status.textContent = message
    status.className = `status-message status-${type}`
    
    accessibilityManager.setupAccessibility(status, {
      role: type === 'error' ? 'alert' : 'status',
      live: type === 'error' ? 'assertive' : 'polite',
      atomic: true
    })
    
    return status
  }
}