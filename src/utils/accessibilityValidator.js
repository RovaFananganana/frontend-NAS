/**
 * @fileoverview Utilitaire de validation d'accessibilité
 */

/**
 * Valide l'accessibilité d'un élément ou d'une page
 * @param {Element} element - Élément à valider (par défaut document)
 * @returns {Object} Résultat de la validation
 */
export function validateAccessibility(element = document) {
  const issues = []
  const warnings = []
  const suggestions = []

  // 1. Vérifier les images sans alt
  const images = element.querySelectorAll('img')
  images.forEach((img, index) => {
    if (!img.hasAttribute('alt')) {
      issues.push({
        type: 'missing-alt',
        element: img,
        message: `Image ${index + 1} sans attribut alt`,
        wcag: '1.1.1',
        severity: 'error'
      })
    } else if (img.alt === '') {
      // Alt vide est OK pour les images décoratives
      suggestions.push({
        type: 'empty-alt',
        element: img,
        message: `Image ${index + 1} avec alt vide - vérifier si c'est intentionnel`,
        severity: 'info'
      })
    }
  })

  // 2. Vérifier les boutons sans label
  const buttons = element.querySelectorAll('button')
  buttons.forEach((button, index) => {
    const hasText = button.textContent.trim().length > 0
    const hasAriaLabel = button.hasAttribute('aria-label')
    const hasAriaLabelledby = button.hasAttribute('aria-labelledby')
    const hasTitle = button.hasAttribute('title')
    
    if (!hasText && !hasAriaLabel && !hasAriaLabelledby) {
      issues.push({
        type: 'missing-button-label',
        element: button,
        message: `Bouton ${index + 1} sans label accessible`,
        wcag: '4.1.2',
        severity: 'error'
      })
    } else if (!hasText && hasTitle && !hasAriaLabel) {
      warnings.push({
        type: 'title-only-button',
        element: button,
        message: `Bouton ${index + 1} utilise seulement title - préférer aria-label`,
        severity: 'warning'
      })
    }
  })

  // 3. Vérifier les liens sans texte
  const links = element.querySelectorAll('a')
  links.forEach((link, index) => {
    const hasText = link.textContent.trim().length > 0
    const hasAriaLabel = link.hasAttribute('aria-label')
    const hasAriaLabelledby = link.hasAttribute('aria-labelledby')
    
    if (!hasText && !hasAriaLabel && !hasAriaLabelledby) {
      issues.push({
        type: 'missing-link-text',
        element: link,
        message: `Lien ${index + 1} sans texte accessible`,
        wcag: '2.4.4',
        severity: 'error'
      })
    }

    // Vérifier les liens qui ouvrent dans un nouvel onglet
    if (link.target === '_blank' && !link.textContent.includes('nouvelle fenêtre') && !link.hasAttribute('aria-label')) {
      warnings.push({
        type: 'new-window-link',
        element: link,
        message: `Lien ${index + 1} ouvre dans un nouvel onglet sans indication`,
        wcag: '3.2.1',
        severity: 'warning'
      })
    }
  })

  // 4. Vérifier les champs de formulaire
  const inputs = element.querySelectorAll('input, select, textarea')
  inputs.forEach((input, index) => {
    const hasLabel = input.hasAttribute('aria-label') || 
                    input.hasAttribute('aria-labelledby') ||
                    element.querySelector(`label[for="${input.id}"]`) ||
                    input.closest('label')
    
    if (!hasLabel && input.type !== 'hidden' && input.type !== 'submit' && input.type !== 'button') {
      issues.push({
        type: 'missing-form-label',
        element: input,
        message: `Champ ${index + 1} sans label accessible`,
        wcag: '3.3.2',
        severity: 'error'
      })
    }

    // Vérifier les champs requis
    if (input.required && !input.hasAttribute('aria-required')) {
      suggestions.push({
        type: 'missing-aria-required',
        element: input,
        message: `Champ requis ${index + 1} devrait avoir aria-required="true"`,
        severity: 'info'
      })
    }
  })

  // 5. Vérifier la hiérarchie des titres
  const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6')
  let previousLevel = 0
  headings.forEach((heading, index) => {
    const level = parseInt(heading.tagName.charAt(1))
    
    if (index === 0 && level !== 1) {
      warnings.push({
        type: 'no-h1',
        element: heading,
        message: 'La page devrait commencer par un h1',
        wcag: '1.3.1',
        severity: 'warning'
      })
    }
    
    if (level > previousLevel + 1) {
      warnings.push({
        type: 'heading-skip',
        element: heading,
        message: `Saut de niveau de titre : h${previousLevel} vers h${level}`,
        wcag: '1.3.1',
        severity: 'warning'
      })
    }
    
    previousLevel = level
  })

  // 6. Vérifier les éléments focalisables
  const focusableElements = element.querySelectorAll(
    'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  
  focusableElements.forEach((el, index) => {
    // Vérifier si l'élément est visible
    const style = window.getComputedStyle(el)
    const isVisible = style.display !== 'none' && 
                     style.visibility !== 'hidden' && 
                     el.offsetParent !== null

    if (isVisible) {
      // Vérifier la taille des zones de touch sur mobile
      const rect = el.getBoundingClientRect()
      if (rect.width < 44 || rect.height < 44) {
        warnings.push({
          type: 'small-touch-target',
          element: el,
          message: `Élément ${index + 1} trop petit pour le tactile (${Math.round(rect.width)}x${Math.round(rect.height)}px)`,
          wcag: '2.5.5',
          severity: 'warning'
        })
      }
    }
  })

  // 7. Vérifier les contrastes (approximatif)
  const textElements = element.querySelectorAll('*')
  textElements.forEach((el, index) => {
    const style = window.getComputedStyle(el)
    const color = style.color
    const backgroundColor = style.backgroundColor
    
    // Vérification basique - dans un vrai projet, utiliser une bibliothèque de calcul de contraste
    if (color && backgroundColor && 
        color !== 'rgba(0, 0, 0, 0)' && 
        backgroundColor !== 'rgba(0, 0, 0, 0)') {
      
      // Ici on devrait calculer le vrai ratio de contraste
      // Pour l'instant, on ajoute juste une suggestion de vérification manuelle
      if (el.textContent.trim().length > 0) {
        suggestions.push({
          type: 'check-contrast',
          element: el,
          message: `Vérifier manuellement le contraste de l'élément ${index + 1}`,
          severity: 'info'
        })
      }
    }
  })

  // 8. Vérifier les attributs ARIA
  const ariaElements = element.querySelectorAll('[role], [aria-label], [aria-labelledby], [aria-describedby]')
  ariaElements.forEach((el, index) => {
    // Vérifier les références aria-labelledby et aria-describedby
    const labelledby = el.getAttribute('aria-labelledby')
    const describedby = el.getAttribute('aria-describedby')
    
    if (labelledby) {
      const labelIds = labelledby.split(' ')
      labelIds.forEach(id => {
        if (!element.getElementById(id)) {
          issues.push({
            type: 'missing-aria-reference',
            element: el,
            message: `aria-labelledby référence un ID inexistant: ${id}`,
            wcag: '4.1.2',
            severity: 'error'
          })
        }
      })
    }
    
    if (describedby) {
      const descIds = describedby.split(' ')
      descIds.forEach(id => {
        if (!element.getElementById(id)) {
          issues.push({
            type: 'missing-aria-reference',
            element: el,
            message: `aria-describedby référence un ID inexistant: ${id}`,
            wcag: '4.1.2',
            severity: 'error'
          })
        }
      })
    }
  })

  // 9. Vérifier les landmarks
  const landmarks = element.querySelectorAll('main, nav, aside, header, footer, [role="main"], [role="navigation"], [role="complementary"], [role="banner"], [role="contentinfo"]')
  if (landmarks.length === 0) {
    warnings.push({
      type: 'no-landmarks',
      element: element,
      message: 'Aucun landmark trouvé - ajouter des éléments sémantiques',
      wcag: '1.3.1',
      severity: 'warning'
    })
  }

  // 10. Vérifier les skip links
  const skipLinks = element.querySelectorAll('.skip-link, [href^="#"]')
  if (skipLinks.length === 0) {
    suggestions.push({
      type: 'no-skip-links',
      element: element,
      message: 'Considérer l\'ajout de liens de saut pour la navigation',
      wcag: '2.4.1',
      severity: 'info'
    })
  }

  // Calculer le score d'accessibilité
  const totalChecks = issues.length + warnings.length + suggestions.length
  const errorWeight = 3
  const warningWeight = 2
  const suggestionWeight = 1
  
  const totalWeight = (issues.length * errorWeight) + 
                     (warnings.length * warningWeight) + 
                     (suggestions.length * suggestionWeight)
  
  const maxPossibleWeight = totalChecks * errorWeight
  const score = maxPossibleWeight > 0 ? Math.max(0, 100 - (totalWeight / maxPossibleWeight * 100)) : 100

  return {
    score: Math.round(score),
    issues,
    warnings,
    suggestions,
    summary: {
      total: totalChecks,
      errors: issues.length,
      warnings: warnings.length,
      suggestions: suggestions.length
    },
    isAccessible: issues.length === 0,
    recommendations: generateRecommendations(issues, warnings, suggestions)
  }
}

/**
 * Génère des recommandations basées sur les problèmes trouvés
 * @param {Array} issues - Problèmes critiques
 * @param {Array} warnings - Avertissements
 * @param {Array} suggestions - Suggestions
 * @returns {Array} Liste de recommandations
 */
function generateRecommendations(issues, warnings, suggestions) {
  const recommendations = []

  // Recommandations basées sur les erreurs
  if (issues.some(issue => issue.type === 'missing-alt')) {
    recommendations.push({
      priority: 'high',
      title: 'Ajouter des attributs alt aux images',
      description: 'Toutes les images doivent avoir un attribut alt descriptif ou vide pour les images décoratives.',
      action: 'Ajouter alt="description" ou alt="" selon le contexte'
    })
  }

  if (issues.some(issue => issue.type === 'missing-button-label')) {
    recommendations.push({
      priority: 'high',
      title: 'Ajouter des labels aux boutons',
      description: 'Tous les boutons doivent avoir un texte visible ou un aria-label.',
      action: 'Ajouter du texte ou aria-label="description de l\'action"'
    })
  }

  if (issues.some(issue => issue.type === 'missing-form-label')) {
    recommendations.push({
      priority: 'high',
      title: 'Associer des labels aux champs de formulaire',
      description: 'Tous les champs doivent être associés à un label.',
      action: 'Utiliser <label for="id"> ou aria-label'
    })
  }

  // Recommandations basées sur les avertissements
  if (warnings.some(warning => warning.type === 'small-touch-target')) {
    recommendations.push({
      priority: 'medium',
      title: 'Agrandir les zones de touch',
      description: 'Les éléments interactifs doivent faire au moins 44x44px.',
      action: 'Augmenter la taille ou le padding des éléments'
    })
  }

  if (warnings.some(warning => warning.type === 'heading-skip')) {
    recommendations.push({
      priority: 'medium',
      title: 'Corriger la hiérarchie des titres',
      description: 'Les niveaux de titres ne doivent pas être sautés.',
      action: 'Utiliser h1, h2, h3... dans l\'ordre'
    })
  }

  // Recommandations générales
  if (suggestions.length > 0) {
    recommendations.push({
      priority: 'low',
      title: 'Améliorations suggérées',
      description: 'Plusieurs améliorations mineures peuvent être apportées.',
      action: 'Consulter la liste détaillée des suggestions'
    })
  }

  return recommendations
}

/**
 * Génère un rapport d'accessibilité formaté
 * @param {Object} results - Résultats de la validation
 * @returns {string} Rapport formaté
 */
export function generateAccessibilityReport(results) {
  let report = `# Rapport d'Accessibilité\n\n`
  
  report += `**Score:** ${results.score}/100\n`
  report += `**Statut:** ${results.isAccessible ? '✅ Accessible' : '❌ Problèmes détectés'}\n\n`
  
  report += `## Résumé\n`
  report += `- **Erreurs:** ${results.summary.errors}\n`
  report += `- **Avertissements:** ${results.summary.warnings}\n`
  report += `- **Suggestions:** ${results.summary.suggestions}\n\n`

  if (results.issues.length > 0) {
    report += `## ❌ Erreurs Critiques\n\n`
    results.issues.forEach((issue, index) => {
      report += `### ${index + 1}. ${issue.message}\n`
      report += `- **Type:** ${issue.type}\n`
      report += `- **WCAG:** ${issue.wcag || 'N/A'}\n`
      report += `- **Élément:** ${issue.element.tagName.toLowerCase()}\n\n`
    })
  }

  if (results.warnings.length > 0) {
    report += `## ⚠️ Avertissements\n\n`
    results.warnings.forEach((warning, index) => {
      report += `### ${index + 1}. ${warning.message}\n`
      report += `- **Type:** ${warning.type}\n`
      report += `- **WCAG:** ${warning.wcag || 'N/A'}\n\n`
    })
  }

  if (results.recommendations.length > 0) {
    report += `## 💡 Recommandations\n\n`
    results.recommendations.forEach((rec, index) => {
      const priority = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢'
      report += `### ${priority} ${index + 1}. ${rec.title}\n`
      report += `${rec.description}\n\n`
      report += `**Action:** ${rec.action}\n\n`
    })
  }

  return report
}

/**
 * Teste l'accessibilité d'un composant spécifique
 * @param {string} selector - Sélecteur CSS du composant
 * @returns {Object} Résultats de validation
 */
export function testComponentAccessibility(selector) {
  const component = document.querySelector(selector)
  if (!component) {
    throw new Error(`Composant non trouvé: ${selector}`)
  }
  
  return validateAccessibility(component)
}

/**
 * Teste l'accessibilité de toute la page
 * @returns {Object} Résultats de validation
 */
export function testPageAccessibility() {
  return validateAccessibility(document)
}

/**
 * Utilitaires pour les tests automatisés
 */
export const AccessibilityTestUtils = {
  /**
   * Vérifie si un élément a un label accessible
   */
  hasAccessibleLabel(element) {
    return element.hasAttribute('aria-label') ||
           element.hasAttribute('aria-labelledby') ||
           element.textContent.trim().length > 0 ||
           document.querySelector(`label[for="${element.id}"]`) ||
           element.closest('label')
  },

  /**
   * Vérifie si un élément est focalisable
   */
  isFocusable(element) {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ]
    
    return focusableSelectors.some(selector => element.matches(selector))
  },

  /**
   * Vérifie si un élément est visible
   */
  isVisible(element) {
    const style = window.getComputedStyle(element)
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           element.offsetParent !== null
  },

  /**
   * Obtient tous les éléments focalisables dans un conteneur
   */
  getFocusableElements(container = document) {
    const selector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    return Array.from(container.querySelectorAll(selector))
      .filter(el => this.isVisible(el))
  }
}

export default {
  validateAccessibility,
  generateAccessibilityReport,
  testComponentAccessibility,
  testPageAccessibility,
  AccessibilityTestUtils
}