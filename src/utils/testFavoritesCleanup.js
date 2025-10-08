/**
 * Script de test pour vérifier le nettoyage des favoris
 * À utiliser dans la console du navigateur pour tester
 */

// Fonction pour ajouter des favoris de test dans localStorage
export function addTestFavorites() {
  const testFavorites = [
    { path: '/AIMtest', name: 'AIMtest', addedAt: Date.now() },
    { path: '/echange IL', name: 'echange IL', addedAt: Date.now() },
    { path: '/administration', name: 'administration', addedAt: Date.now() },
    { path: '/finance', name: 'finance', addedAt: Date.now() },
    { path: '/TWR', name: 'TWR', addedAt: Date.now() },
    { path: '/Documents', name: 'Documents', addedAt: Date.now() }, // Favori valide
  ]
  
  localStorage.setItem('file-favorites', JSON.stringify(testFavorites))
  console.log('✅ Favoris de test ajoutés:', testFavorites)
  return testFavorites
}

// Fonction pour vérifier le contenu actuel du localStorage
export function checkLocalStorageFavorites() {
  const stored = localStorage.getItem('file-favorites')
  const favorites = stored ? JSON.parse(stored) : []
  
  console.log('📋 Favoris actuels dans localStorage:')
  favorites.forEach((fav, index) => {
    console.log(`  ${index + 1}. ${fav.name} (${fav.path})`)
  })
  
  return favorites
}

// Fonction pour tester le nettoyage
export function testCleanup() {
  console.log('🧪 Test de nettoyage des favoris')
  
  // 1. Ajouter des favoris de test
  console.log('1. Ajout des favoris de test...')
  addTestFavorites()
  
  // 2. Vérifier avant nettoyage
  console.log('2. État avant nettoyage:')
  const beforeCleanup = checkLocalStorageFavorites()
  
  // 3. Importer et utiliser la fonction de nettoyage
  import('./favoritesCleanup.js').then(({ cleanupProblematicFavorites }) => {
    console.log('3. Nettoyage en cours...')
    const removedCount = cleanupProblematicFavorites()
    
    console.log('4. État après nettoyage:')
    const afterCleanup = checkLocalStorageFavorites()
    
    console.log(`✅ Test terminé: ${removedCount} favoris supprimés`)
    console.log(`📊 Avant: ${beforeCleanup.length} favoris, Après: ${afterCleanup.length} favoris`)
  })
}

// Instructions pour utiliser dans la console
console.log(`
🧪 Script de test des favoris chargé !

Utilisation dans la console du navigateur:
1. addTestFavorites() - Ajoute des favoris de test
2. checkLocalStorageFavorites() - Affiche les favoris actuels
3. testCleanup() - Test complet de nettoyage

Exemple:
> addTestFavorites()
> checkLocalStorageFavorites()
> testCleanup()
`)