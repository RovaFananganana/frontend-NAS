/**
 * Utilitaire de test pour les modes d'affichage
 * À utiliser dans la console du navigateur
 */

// Test des modes d'affichage disponibles
export function testViewModes() {
  console.log('🧪 Test des modes d\'affichage')
  
  const modes = ['DETAILED_LIST', 'TREE', 'MOSAIC']
  
  modes.forEach(mode => {
    console.log(`📋 Mode: ${mode}`)
    
    // Simuler un changement de mode
    window.dispatchEvent(new CustomEvent('view-mode-test', {
      detail: { mode, timestamp: Date.now() }
    }))
  })
}

// Écouter les changements de mode
export function listenToViewModeChanges() {
  console.log('👂 Écoute des changements de mode d\'affichage...')
  
  window.addEventListener('view-mode-test', (event) => {
    console.log('🔄 Mode d\'affichage testé:', event.detail)
  })
}

// Vérifier les composants disponibles
export function checkViewModeComponents() {
  console.log('🔍 Vérification des composants de modes d\'affichage')
  
  const components = [
    'DetailedListView',
    'OptimizedDetailedListView', 
    'TreeFileView',
    'MosaicView'
  ]
  
  components.forEach(component => {
    // Vérifier si le composant existe dans le DOM
    const elements = document.querySelectorAll(`[data-component="${component}"]`)
    console.log(`📦 ${component}: ${elements.length > 0 ? '✅ Trouvé' : '❌ Non trouvé'}`)
  })
}

// Instructions d'utilisation
console.log(`
🧪 Utilitaires de test des modes d'affichage chargés !

Utilisation dans la console:
1. testViewModes() - Teste tous les modes
2. listenToViewModeChanges() - Écoute les changements
3. checkViewModeComponents() - Vérifie les composants

Exemple:
> testViewModes()
> checkViewModeComponents()
`)