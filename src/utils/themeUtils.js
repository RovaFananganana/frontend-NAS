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
    console.warn(`Theme "${theme}" invalide, fallback sur "light"`);
    theme = "light";
  }

  // Appliquer le thème
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  
  // Forcer le recalcul des styles CSS
  document.documentElement.style.display = 'none';
  document.documentElement.offsetHeight; // Trigger reflow
  document.documentElement.style.display = '';
  
  // Émettre un événement pour notifier les composants
  window.dispatchEvent(new CustomEvent('theme-changed', { detail: theme }));
  
  console.log(`Theme "${theme}" appliqué avec succès`);
}


/**
 * Get current theme from localStorage or default
 * @returns {string} Current theme
 */
export function getCurrentTheme() {
  return localStorage.getItem('theme') || 'light'
}

/**
 * Initialize theme on app startup
 */
export function initializeTheme() {
  const savedTheme = getCurrentTheme()
  
  // Check theme support first
  setTimeout(() => {
    const themeSupport = checkThemeSupport()
    console.log('Theme support check completed:', themeSupport)
    
    // Check if any themes are actually supported
    const supportedThemes = Object.entries(themeSupport)
      .filter(([_, support]) => support.supported)
      .map(([theme, _]) => theme)
    
    if (supportedThemes.length === 0) {
      console.error('Aucun thème DaisyUI détecté! Vérifiez la configuration Tailwind.')
    } else {
      console.log('Thèmes supportés:', supportedThemes)
    }
  }, 500)
  
  // Ensure theme is valid before applying
  if (!isValidTheme(savedTheme)) {
    console.warn(`Theme sauvegardé "${savedTheme}" invalide, utilisation du thème par défaut`)
    applyTheme('light')
    return 'light'
  }
  
  applyTheme(savedTheme)

  // Test theme application after DOM is ready
  setTimeout(() => {
    console.log(`Thème initialisé: ${savedTheme}`)
    console.log('Variables CSS actuelles:', getCurrentThemeVariables())
    
    // Test all available themes to verify they work
    availableThemes.forEach(async (theme) => {
      const isWorking = await testThemeApplication(theme.value)
      console.log(`Theme ${theme.value} working:`, isWorking)
    })
    
    const existingButton = document.querySelector('.btn-primary')
    if (existingButton) {
      console.log('Primary color appliqué:', getComputedStyle(existingButton).backgroundColor)
    } else {
      console.log('Aucun bouton .btn-primary trouvé - thème appliqué au niveau document')
    }
  }, 300) // délai pour que le DOM soit rendu

  return savedTheme
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
 * Test theme application by checking computed styles
 * @param {string} theme - Theme to test
 * @returns {Promise<boolean>} Theme is working correctly
 */
export function testThemeApplication(theme) {
  return new Promise((resolve) => {
    try {
      const oldTheme = getCurrentTheme()
      applyTheme(theme)
      
      // Wait for styles to apply
      setTimeout(() => {
        const testElement = document.createElement('div')
        testElement.className = 'btn btn-primary'
        testElement.style.position = 'absolute'
        testElement.style.visibility = 'hidden'
        document.body.appendChild(testElement)
        
        const computedStyle = getComputedStyle(testElement)
        const backgroundColor = computedStyle.backgroundColor
        
        // Also check CSS variables
        const rootStyles = getComputedStyle(document.documentElement)
        const primaryColor = rootStyles.getPropertyValue('--color-primary')
        
        document.body.removeChild(testElement)
        
        console.log(`Theme "${theme}" test:`, {
          backgroundColor,
          primaryColor,
          dataTheme: document.documentElement.getAttribute('data-theme')
        })
        
        // Restore original theme
        applyTheme(oldTheme)
        
        const isWorking = backgroundColor !== 'rgba(0, 0, 0, 0)' && 
                         backgroundColor !== 'transparent' &&
                         primaryColor !== ''
        
        resolve(isWorking)
      }, 200)
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
    // Fallback sur le thème par défaut
    applyTheme('light')
  }
}

/**
 * Check if DaisyUI themes are properly loaded
 * @returns {Object} Theme loading status
 */
export function checkThemeSupport() {
  const results = {}
  
  availableThemes.forEach(theme => {
    // Set theme temporarily
    document.documentElement.setAttribute('data-theme', theme.value)
    
    // Check if CSS variables are defined (DaisyUI 4.x uses short variables)
    const rootStyles = getComputedStyle(document.documentElement)
    const primaryColor = rootStyles.getPropertyValue('--p') || rootStyles.getPropertyValue('--color-primary')
    const baseColor = rootStyles.getPropertyValue('--b1') || rootStyles.getPropertyValue('--color-base-100')
    
    results[theme.value] = {
      supported: primaryColor !== '' && baseColor !== '',
      primaryColor,
      baseColor,
      variables: {
        '--p': rootStyles.getPropertyValue('--p'),
        '--s': rootStyles.getPropertyValue('--s'),
        '--a': rootStyles.getPropertyValue('--a'),
        '--b1': rootStyles.getPropertyValue('--b1'),
        '--b2': rootStyles.getPropertyValue('--b2'),
        '--b3': rootStyles.getPropertyValue('--b3'),
      }
    }
  })
  
  // Reset to light theme
  document.documentElement.setAttribute('data-theme', 'light')
  
  console.log('Theme support check:', results)
  return results
}

/**
 * Get all CSS custom properties for current theme
 * @returns {Object} CSS custom properties
 */
export function getCurrentThemeVariables() {
  const rootStyles = getComputedStyle(document.documentElement)
  const variables = {}
  
  // DaisyUI 5.x variables (without --color- prefix)
  const daisyUIVars = [
    '--p', '--pc', // primary
    '--s', '--sc', // secondary
    '--a', '--ac', // accent
    '--n', '--nc', // neutral
    '--b1', '--b2', '--b3', '--bc', // base colors
    '--in', '--su', '--wa', '--er', // info, success, warning, error
    // Legacy variables for compatibility
    '--color-primary',
    '--color-secondary', 
    '--color-accent',
    '--color-neutral',
    '--color-base-100',
    '--color-base-200',
    '--color-base-300',
    '--color-base-content'
  ]
  
  daisyUIVars.forEach(varName => {
    const value = rootStyles.getPropertyValue(varName)
    if (value) {
      variables[varName] = value
    }
  })
  
  return variables
}

/**
 * Force rebuild CSS and check theme application
 */
export function forceThemeRefresh() {
  const currentTheme = getCurrentTheme()
  
  // Remove and re-add data-theme attribute
  document.documentElement.removeAttribute('data-theme')
  
  // Force reflow
  document.documentElement.offsetHeight
  
  // Re-apply theme
  document.documentElement.setAttribute('data-theme', currentTheme)
  
  // Force another reflow
  document.documentElement.offsetHeight
  
  console.log('Theme refresh forcé pour:', currentTheme)
  
  // Log current variables
  setTimeout(() => {
    console.log('Variables après refresh:', getCurrentThemeVariables())
  }, 100)
}
