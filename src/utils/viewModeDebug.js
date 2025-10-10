/**
 * Utilitaire de debug pour les modes d'affichage
 * À utiliser dans la console du navigateur
 */

// Observer les changements de composants
export function observeViewModeChanges() {
  console.log('👀 Observation des changements de modes d\'affichage...')
  
  // Observer les changements dans le DOM
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        const addedNodes = Array.from(mutation.addedNodes)
        const removedNodes = Array.from(mutation.removedNodes)
        
        addedNodes.forEach(node => {
          if (node.nodeType === 1) { // Element node
            const componentName = getComponentName(node)
            if (componentName) {
              console.log('➕ Composant ajouté:', componentName)
            }
          }
        })
        
        removedNodes.forEach(node => {
          if (node.nodeType === 1) { // Element node
            const componentName = getComponentName(node)
            if (componentName) {
              console.log('➖ Composant supprimé:', componentName)
            }
          }
        })
      }
    })
  })
  
  // Observer le conteneur principal
  const explorerContent = document.querySelector('.file-explorer-content')
  if (explorerContent) {
    observer.observe(explorerContent, {
      childList: true,
      subtree: true
    })
    console.log('✅ Observer configuré sur .file-explorer-content')
  } else {
    console.error('❌ .file-explorer-content non trouvé')
  }
  
  return observer
}

// Identifier le nom du composant
function getComponentName(element) {
  const classList = Array.from(element.classList || [])
  
  // Chercher des classes qui indiquent le type de vue
  if (classList.some(cls => cls.includes('detailed-list') || cls.includes('list-view'))) {
    return 'DetailedListView'
  }
  if (classList.some(cls => cls.includes('tree') || cls.includes('tree-view'))) {
    return 'TreeFileView'
  }
  if (classList.some(cls => cls.includes('mosaic') || cls.includes('grid'))) {
    return 'MosaicView'
  }
  
  // Chercher par tag ou attributs
  if (element.tagName === 'TABLE') {
    return 'DetailedListView (Table)'
  }
  if (element.querySelector('.tree-node')) {
    return 'TreeFileView (Tree)'
  }
  if (element.classList.contains('grid')) {
    return 'MosaicView (Grid)'
  }
  
  return null
}

// Vérifier le mode actuel
export function checkCurrentViewMode() {
  console.log('🔍 Vérification du mode d\'affichage actuel...')
  
  const explorerContent = document.querySelector('.file-explorer-content')
  if (!explorerContent) {
    console.error('❌ .file-explorer-content non trouvé')
    return
  }
  
  // Chercher les différents types de vues
  const table = explorerContent.querySelector('table')
  const treeNodes = explorerContent.querySelectorAll('.tree-node')
  const gridItems = explorerContent.querySelectorAll('.grid > div')
  
  console.log('📊 Éléments trouvés:')
  console.log('  - Tables:', table ? 1 : 0)
  console.log('  - Nœuds d\'arbre:', treeNodes.length)
  console.log('  - Éléments de grille:', gridItems.length)
  
  // Déterminer le mode actuel
  if (table) {
    console.log('✅ Mode actuel: Liste (DetailedListView)')
  } else if (treeNodes.length > 0) {
    console.log('✅ Mode actuel: Arbre (TreeFileView)')
  } else if (gridItems.length > 0) {
    console.log('✅ Mode actuel: Mosaïque (MosaicView)')
  } else {
    console.log('❓ Mode actuel: Indéterminé')
  }
}

// Tester tous les modes
export function testAllViewModes() {
  console.log('🧪 Test de tous les modes d\'affichage...')
  
  const modes = [
    { name: 'Liste', value: 'DETAILED_LIST' },
    { name: 'Arbre', value: 'TREE' },
    { name: 'Mosaïque', value: 'MOSAIC' }
  ]
  
  let currentIndex = 0
  
  function testNextMode() {
    if (currentIndex >= modes.length) {
      console.log('✅ Test de tous les modes terminé')
      return
    }
    
    const mode = modes[currentIndex]
    console.log(`🔄 Test du mode: ${mode.name} (${mode.value})`)
    
    // Simuler un changement de mode
    window.dispatchEvent(new CustomEvent('test-view-mode-change', {
      detail: { mode: mode.value, name: mode.name }
    }))
    
    // Vérifier après un délai
    setTimeout(() => {
      checkCurrentViewMode()
      currentIndex++
      setTimeout(testNextMode, 1000)
    }, 500)
  }
  
  testNextMode()
}

// Instructions d'utilisation
console.log(`
🧪 Utilitaires de debug des modes d'affichage chargés !

Utilisation dans la console:
1. observeViewModeChanges() - Observer les changements de composants
2. checkCurrentViewMode() - Vérifier le mode actuel
3. testAllViewModes() - Tester tous les modes

Exemple:
> const observer = observeViewModeChanges()
> checkCurrentViewMode()
> testAllViewModes()
`)