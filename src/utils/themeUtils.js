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

  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
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
  applyTheme(savedTheme)

  // 🔍 Test debug : attend que le DOM soit prêt et cherche un bouton existant
  setTimeout(() => {
    const existingButton = document.querySelector('.btn-primary')
    if (existingButton) {
      console.log('Primary color appliqué:', getComputedStyle(existingButton).backgroundColor)
    } else {
      console.warn('Aucun bouton .btn-primary trouvé pour tester le thème')
    }
  }, 100) // délai léger pour que le DOM soit rendu

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
