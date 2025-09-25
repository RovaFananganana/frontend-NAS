/**
 * @fileoverview Utilitaires pour tester les performances avec de gros volumes de données
 */

/**
 * Génère des données de test pour simuler de gros dossiers
 * @param {number} count - Nombre de fichiers à générer
 * @param {Object} options - Options de génération
 * @returns {Array} Tableau de fichiers simulés
 */
export function generateTestFiles(count = 1000, options = {}) {
  const {
    includeDirectories = true,
    directoryRatio = 0.2, // 20% de dossiers
    fileTypes = ['txt', 'pdf', 'jpg', 'mp4', 'doc', 'zip', 'js', 'css', 'html', 'json'],
    sizeRange = { min: 1024, max: 100 * 1024 * 1024 }, // 1KB à 100MB
    nameLength = { min: 5, max: 30 }
  } = options

  const files = []
  const now = new Date()

  for (let i = 0; i < count; i++) {
    const isDirectory = includeDirectories && Math.random() < directoryRatio
    const nameLen = Math.floor(Math.random() * (nameLength.max - nameLength.min + 1)) + nameLength.min
    const baseName = generateRandomString(nameLen)
    
    let name = baseName
    let fileType = null
    let size = 0

    if (isDirectory) {
      name = `${baseName}_folder`
    } else {
      const extension = fileTypes[Math.floor(Math.random() * fileTypes.length)]
      name = `${baseName}.${extension}`
      fileType = extension
      size = Math.floor(Math.random() * (sizeRange.max - sizeRange.min + 1)) + sizeRange.min
    }

    // Générer des dates aléaoires dans les 2 dernières années
    const randomDate = new Date(now.getTime() - Math.random() * 2 * 365 * 24 * 60 * 60 * 1000)

    files.push({
      name,
      path: `/test/${name}`,
      is_directory: isDirectory,
      size: isDirectory ? null : size,
      file_type: fileType,
      modified_time: randomDate.toISOString(),
      created_time: randomDate.toISOString(),
      permissions: 'rwxr-xr-x'
    })
  }

  return files
}

/**
 * Génère une chaîne aléatoire
 * @param {number} length - Longueur de la chaîne
 * @returns {string} Chaîne aléatoire
 */
function generateRandomString(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Mesure les performances d'une fonction
 * @param {Function} fn - Fonction à mesurer
 * @param {string} name - Nom de la mesure
 * @returns {Promise<any>} Résultat de la fonction avec métriques
 */
export async function measurePerformance(fn, name = 'operation') {
  const startTime = performance.now()
  const startMemory = performance.memory ? performance.memory.usedJSHeapSize : 0
  
  let result
  try {
    result = await fn()
  } catch (error) {
    console.error(`Erreur lors de l'exécution de ${name}:`, error)
    throw error
  }
  
  const endTime = performance.now()
  const endMemory = performance.memory ? performance.memory.usedJSHeapSize : 0
  
  const metrics = {
    name,
    duration: endTime - startTime,
    memoryDelta: endMemory - startMemory,
    timestamp: new Date().toISOString()
  }
  
  console.log(`Performance ${name}:`, {
    duration: `${metrics.duration.toFixed(2)}ms`,
    memory: `${(metrics.memoryDelta / 1024 / 1024).toFixed(2)}MB`,
    result: result
  })
  
  return { result, metrics }
}

/**
 * Teste les performances de rendu avec différents volumes de données
 * @param {Function} renderFn - Fonction de rendu à tester
 * @param {Array} testSizes - Tailles à tester
 * @returns {Promise<Array>} Résultats des tests
 */
export async function benchmarkRendering(renderFn, testSizes = [100, 500, 1000, 2000, 5000]) {
  const results = []
  
  for (const size of testSizes) {
    console.log(`Test de performance avec ${size} éléments...`)
    
    const testData = generateTestFiles(size)
    
    const { metrics } = await measurePerformance(
      () => renderFn(testData),
      `render-${size}-items`
    )
    
    results.push({
      size,
      ...metrics
    })
    
    // Petite pause pour laisser le navigateur respirer
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  return results
}

/**
 * Teste les performances de tri avec différents volumes
 * @param {Function} sortFn - Fonction de tri à tester
 * @param {Array} testSizes - Tailles à tester
 * @returns {Promise<Array>} Résultats des tests
 */
export async function benchmarkSorting(sortFn, testSizes = [100, 500, 1000, 2000, 5000]) {
  const results = []
  
  for (const size of testSizes) {
    console.log(`Test de tri avec ${size} éléments...`)
    
    const testData = generateTestFiles(size)
    
    // Tester différents types de tri
    const sortTypes = ['name', 'size', 'type', 'modified']
    const sortResults = {}
    
    for (const sortType of sortTypes) {
      const { metrics } = await measurePerformance(
        () => sortFn(testData, sortType),
        `sort-${sortType}-${size}-items`
      )
      
      sortResults[sortType] = metrics
    }
    
    results.push({
      size,
      sorts: sortResults
    })
  }
  
  return results
}

/**
 * Teste les performances de virtualisation
 * @param {Function} virtualScrollFn - Fonction de scroll virtuel
 * @param {number} totalItems - Nombre total d'éléments
 * @param {number} visibleItems - Nombre d'éléments visibles
 * @returns {Promise<Object>} Résultats du test
 */
export async function benchmarkVirtualization(virtualScrollFn, totalItems = 10000, visibleItems = 20) {
  console.log(`Test de virtualisation avec ${totalItems} éléments (${visibleItems} visibles)...`)
  
  const testData = generateTestFiles(totalItems)
  
  // Simuler différentes positions de scroll
  const scrollPositions = [0, 0.25, 0.5, 0.75, 1.0]
  const results = []
  
  for (const position of scrollPositions) {
    const scrollIndex = Math.floor(position * (totalItems - visibleItems))
    
    const { metrics } = await measurePerformance(
      () => virtualScrollFn(testData, scrollIndex, visibleItems),
      `virtual-scroll-${Math.round(position * 100)}%`
    )
    
    results.push({
      position: Math.round(position * 100),
      scrollIndex,
      ...metrics
    })
  }
  
  return {
    totalItems,
    visibleItems,
    results
  }
}

/**
 * Génère un rapport de performance complet
 * @param {Object} testResults - Résultats des tests
 * @returns {string} Rapport formaté
 */
export function generatePerformanceReport(testResults) {
  let report = '# Rapport de Performance\n\n'
  report += `Généré le: ${new Date().toLocaleString()}\n\n`
  
  if (testResults.rendering) {
    report += '## Tests de Rendu\n\n'
    report += '| Éléments | Durée (ms) | Mémoire (MB) |\n'
    report += '|----------|------------|-------------|\n'
    
    testResults.rendering.forEach(result => {
      report += `| ${result.size} | ${result.duration.toFixed(2)} | ${(result.memoryDelta / 1024 / 1024).toFixed(2)} |\n`
    })
    report += '\n'
  }
  
  if (testResults.sorting) {
    report += '## Tests de Tri\n\n'
    testResults.sorting.forEach(sizeResult => {
      report += `### ${sizeResult.size} éléments\n\n`
      report += '| Type de tri | Durée (ms) | Mémoire (MB) |\n'
      report += '|-------------|------------|-------------|\n'
      
      Object.entries(sizeResult.sorts).forEach(([sortType, metrics]) => {
        report += `| ${sortType} | ${metrics.duration.toFixed(2)} | ${(metrics.memoryDelta / 1024 / 1024).toFixed(2)} |\n`
      })
      report += '\n'
    })
  }
  
  if (testResults.virtualization) {
    report += '## Tests de Virtualisation\n\n'
    report += `Total: ${testResults.virtualization.totalItems} éléments, Visibles: ${testResults.virtualization.visibleItems}\n\n`
    report += '| Position | Index | Durée (ms) | Mémoire (MB) |\n'
    report += '|----------|-------|------------|-------------|\n'
    
    testResults.virtualization.results.forEach(result => {
      report += `| ${result.position}% | ${result.scrollIndex} | ${result.duration.toFixed(2)} | ${(result.memoryDelta / 1024 / 1024).toFixed(2)} |\n`
    })
    report += '\n'
  }
  
  return report
}

/**
 * Exécute une suite complète de tests de performance
 * @param {Object} components - Composants à tester
 * @param {Object} options - Options de test
 * @returns {Promise<Object>} Résultats complets
 */
export async function runPerformanceTestSuite(components, options = {}) {
  const {
    testSizes = [100, 500, 1000, 2000],
    includeVirtualization = true,
    includeSorting = true,
    includeRendering = true
  } = options
  
  console.log('🚀 Début de la suite de tests de performance...')
  
  const results = {}
  
  if (includeRendering && components.render) {
    console.log('📊 Tests de rendu...')
    results.rendering = await benchmarkRendering(components.render, testSizes)
  }
  
  if (includeSorting && components.sort) {
    console.log('🔄 Tests de tri...')
    results.sorting = await benchmarkSorting(components.sort, testSizes)
  }
  
  if (includeVirtualization && components.virtualScroll) {
    console.log('📜 Tests de virtualisation...')
    results.virtualization = await benchmarkVirtualization(
      components.virtualScroll,
      Math.max(...testSizes) * 5, // 5x le plus gros test
      20
    )
  }
  
  console.log('✅ Suite de tests terminée!')
  
  // Générer et afficher le rapport
  const report = generatePerformanceReport(results)
  console.log('\n' + report)
  
  return {
    results,
    report,
    timestamp: new Date().toISOString()
  }
}

export default {
  generateTestFiles,
  measurePerformance,
  benchmarkRendering,
  benchmarkSorting,
  benchmarkVirtualization,
  generatePerformanceReport,
  runPerformanceTestSuite
}