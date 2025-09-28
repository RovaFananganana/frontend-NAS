// utils/themeUtils.js

/**
 * Theme utility functions for DaisyUI theme management
 */

export const availableThemes = [
  { name: 'Clair', value: 'light', icon: 'fas fa-sun' },
  { name: 'Sombre', value: 'dark', icon: 'fas fa-moon' },
  { name: 'Valentine', value: 'valentine', icon: 'fas fa-heart' },
  { name: 'Retro', value: 'retro', icon: 'fas fa-building' },
  { name: 'Aqua', value: 'aqua', icon: 'fas fa-water' },
]

/**
 * Apply theme to document
 * @param {string} theme - Theme name
 */
export function applyTheme(theme) {
  if (!isValidTheme(theme)) {
    console.warn(`Theme "${theme}" invalide, fallback sur "light"`)
    theme = 'light'
  }

  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('theme', theme)

  // Forcer reflow CSS
  document.documentElement.style.display = 'none'
  document.documentElement.offsetHeight
  document.documentElement.style.display = ''

  // Émettre un événement pour les composants
  window.dispatchEvent(new CustomEvent('theme-changed', { detail: theme }))

  console.log(`Theme "${theme}" appliqué avec succès`)
}

/**
 * Get current theme from localStorage or default
 * @returns {string} Current theme
 */
export function getCurrentTheme() {
  return localStorage.getItem('theme') || 'light'
}

/**
 * Check if theme is valid
 * @param {string} theme - Theme to validate
 * @returns {boolean} Is valid theme
 */
export function isValidTheme(theme) {
  return availableThemes.some(t => t.value === theme)
}

/**
 * Initialize theme on app startup
 */
export function initializeTheme() {
  const savedTheme = getCurrentTheme()
  
  // Appliquer uniquement le thème sauvegardé
  if (!isValidTheme(savedTheme)) {
    console.warn(`Theme sauvegardé "${savedTheme}" invalide, utilisation du thème par défaut`)
    applyTheme('light')
    return 'light'
  }

  applyTheme(savedTheme)
  console.log(`Thème initialisé: ${savedTheme}`)
  console.log('Variables CSS actuelles:', getCurrentThemeVariables())

  // Vérification des thèmes disponibles sans toucher au DOM
  setTimeout(() => {
    const themeSupport = checkThemeSupport()
    console.log('Theme support check completed:', themeSupport)

    const supportedThemes = Object.entries(themeSupport)
      .filter(([_, support]) => support.supported)
      .map(([theme, _]) => theme)

    if (supportedThemes.length === 0) {
      console.error('Aucun thème DaisyUI détecté! Vérifiez la configuration Tailwind.')
    } else {
      console.log('Thèmes supportés:', supportedThemes)
    }
  }, 500)

  return savedTheme
}

/**
 * Test theme application by creating a temporary element
 * @param {string} theme - Theme to test
 * @returns {Promise<boolean>} Theme is working correctly
 */
export function testThemeApplication(theme) {
  return new Promise(resolve => {
    try {
      const testElement = document.createElement('div')
      testElement.className = 'btn btn-primary'
      testElement.style.position = 'absolute'
      testElement.style.visibility = 'hidden'

      // Ajouter l'attribut temporaire data-theme pour le test
      testElement.setAttribute('data-theme', theme)
      document.body.appendChild(testElement)

      const computedStyle = getComputedStyle(testElement)
      const backgroundColor = computedStyle.backgroundColor

      document.body.removeChild(testElement)

      const isWorking = backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'transparent'
      resolve(isWorking)
    } catch (error) {
      console.error(`Erreur lors du test du thème "${theme}":`, error)
      resolve(false)
    }
  })
}

/**
 * Safe theme application with fallback
 * @param {string} theme - Theme to apply
 */
export function safeApplyTheme(theme) {
  try {
    applyTheme(theme)
  } catch (error) {
    console.error('Erreur application thème:', error)
    applyTheme('light')
  }
}

/**
 * Check if DaisyUI themes are properly loaded (without modifier le DOM)
 * @returns {Object} Theme loading status
 */
export function checkThemeSupport() {
  const results = {}

  availableThemes.forEach(theme => {
    // Créer un élément temporaire pour tester les variables CSS
    const testEl = document.createElement('div')
    testEl.setAttribute('data-theme', theme.value)
    document.body.appendChild(testEl)

    const rootStyles = getComputedStyle(testEl)
    const primaryColor = rootStyles.getPropertyValue('--p') || rootStyles.getPropertyValue('--color-primary')
    const baseColor = rootStyles.getPropertyValue('--b1') || rootStyles.getPropertyValue('--color-base-100')

    results[theme.value] = {
      supported: primaryColor !== '' && baseColor !== '',
      primaryColor,
      baseColor
    }

    document.body.removeChild(testEl)
  })

  return results
}

/**
 * Get all CSS custom properties for current theme
 * @returns {Object} CSS custom properties
 */
export function getCurrentThemeVariables() {
  const rootStyles = getComputedStyle(document.documentElement)
  const variables = {}
  
  const daisyUIVars = [
    '--p', '--pc',
    '--s', '--sc',
    '--a', '--ac',
    '--n', '--nc',
    '--b1', '--b2', '--b3', '--bc',
    '--in', '--su', '--wa', '--er',
    '--color-primary', '--color-secondary', '--color-accent',
    '--color-neutral', '--color-base-100', '--color-base-200', '--color-base-300',
    '--color-base-content'
  ]

  daisyUIVars.forEach(varName => {
    const value = rootStyles.getPropertyValue(varName)
    if (value) variables[varName] = value
  })

  return variables
}

/**
 * Force rebuild CSS and refresh theme
 */
export function forceThemeRefresh() {
  const currentTheme = getCurrentTheme()
  document.documentElement.removeAttribute('data-theme')
  document.documentElement.offsetHeight
  document.documentElement.setAttribute('data-theme', currentTheme)
  document.documentElement.offsetHeight
  console.log('Theme refresh forcé pour:', currentTheme)
  setTimeout(() => console.log('Variables après refresh:', getCurrentThemeVariables()), 100)
}
