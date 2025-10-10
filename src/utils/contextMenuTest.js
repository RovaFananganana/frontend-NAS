/**
 * Utilitaire de test pour le menu contextuel
 * À utiliser dans la console du navigateur
 */

// Test des clics dans le sous-menu
export function testContextMenuClicks() {
  console.log('🧪 Test des clics dans le menu contextuel')
  
  // Simuler un clic droit pour ouvrir le menu
  const explorerContent = document.querySelector('.file-explorer-content')
  if (explorerContent) {
    const event = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX: 200,
      clientY: 200
    })
    
    explorerContent.dispatchEvent(event)
    console.log('✅ Menu contextuel ouvert')
    
    // Attendre un peu puis tester le sous-menu
    setTimeout(() => {
      testViewModeSubmenu()
    }, 500)
  } else {
    console.error('❌ Élément .file-explorer-content non trouvé')
  }
}

// Test du sous-menu d'affichage
export function testViewModeSubmenu() {
  console.log('🔍 Test du sous-menu d\'affichage')
  
  // Chercher le bouton "Affichage"
  const affichageButton = Array.from(document.querySelectorAll('button'))
    .find(btn => btn.textContent.includes('Affichage'))
  
  if (affichageButton) {
    console.log('✅ Bouton "Affichage" trouvé')
    
    // Simuler un survol
    const mouseEnterEvent = new MouseEvent('mouseenter', { bubbles: true })
    affichageButton.parentElement.dispatchEvent(mouseEnterEvent)
    
    console.log('🖱️ Survol simulé')
    
    // Attendre un peu puis chercher les boutons du sous-menu
    setTimeout(() => {
      testSubmenuButtons()
    }, 200)
  } else {
    console.error('❌ Bouton "Affichage" non trouvé')
  }
}

// Test des boutons du sous-menu
export function testSubmenuButtons() {
  console.log('🔍 Test des boutons du sous-menu')
  
  const modes = ['Liste', 'Arbre', 'Mosaïque']
  
  modes.forEach(mode => {
    const button = Array.from(document.querySelectorAll('button'))
      .find(btn => btn.textContent.trim() === mode)
    
    if (button) {
      console.log(`✅ Bouton "${mode}" trouvé`)
      
      // Tester le clic
      button.addEventListener('click', () => {
        console.log(`🎯 Clic détecté sur "${mode}"`)
      })
    } else {
      console.log(`❌ Bouton "${mode}" non trouvé`)
    }
  })
}

// Écouter les événements de changement de mode
export function listenToViewModeEvents() {
  console.log('👂 Écoute des événements de changement de mode...')
  
  // Écouter les événements personnalisés
  window.addEventListener('view-mode-changed', (event) => {
    console.log('🔄 Événement view-mode-changed détecté:', event.detail)
  })
  
  // Écouter les clics sur les boutons du sous-menu
  document.addEventListener('click', (event) => {
    if (event.target.closest('.absolute')) {
      console.log('🎯 Clic dans le sous-menu détecté:', event.target.textContent)
    }
  })
}

// Instructions d'utilisation
console.log(`
🧪 Utilitaires de test du menu contextuel chargés !

Utilisation dans la console:
1. testContextMenuClicks() - Ouvre le menu et teste les clics
2. testViewModeSubmenu() - Teste spécifiquement le sous-menu
3. listenToViewModeEvents() - Écoute les événements

Exemple:
> listenToViewModeEvents()
> testContextMenuClicks()
`)