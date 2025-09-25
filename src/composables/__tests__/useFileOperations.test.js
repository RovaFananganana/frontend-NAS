/**
 * Test file for useFileOperations composable
 * This is a manual test file to verify the functionality
 */

import { useFileOperations } from '../useFileOperations.js'

// Mock data for testing
const mockFiles = [
  { name: 'document.pdf', path: '/folder1/document.pdf', type: 'file' },
  { name: 'image.jpg', path: '/folder1/image.jpg', type: 'file' },
  { name: 'subfolder', path: '/folder1/subfolder', type: 'folder' }
]

// Test the composable
function testFileOperations() {
  console.log('Testing useFileOperations composable...')
  
  const {
    hasOperation,
    isCopyOperation,
    isCutOperation,
    operationItems,
    operationCount,
    copy,
    cut,
    clear,
    isItemInOperation,
    getItemIndicatorClass,
    getOperationDescription,
    canPasteToDestination
  } = useFileOperations()

  // Test initial state
  console.log('Initial state:')
  console.log('- hasOperation:', hasOperation.value)
  console.log('- operationCount:', operationCount.value)
  console.log('- operationDescription:', getOperationDescription())

  // Test copy operation
  console.log('\nTesting copy operation...')
  copy([mockFiles[0]], '/folder1')
  console.log('- hasOperation:', hasOperation.value)
  console.log('- isCopyOperation:', isCopyOperation.value)
  console.log('- operationCount:', operationCount.value)
  console.log('- operationDescription:', getOperationDescription())
  console.log('- isItemInOperation(mockFiles[0]):', isItemInOperation(mockFiles[0]))
  console.log('- getItemIndicatorClass(mockFiles[0]):', getItemIndicatorClass(mockFiles[0]))
  console.log('- canPasteToDestination("/folder2"):', canPasteToDestination('/folder2'))

  // Test cut operation
  console.log('\nTesting cut operation...')
  cut(mockFiles.slice(1), '/folder1')
  console.log('- hasOperation:', hasOperation.value)
  console.log('- isCutOperation:', isCutOperation.value)
  console.log('- operationCount:', operationCount.value)
  console.log('- operationDescription:', getOperationDescription())
  console.log('- isItemInOperation(mockFiles[1]):', isItemInOperation(mockFiles[1]))
  console.log('- getItemIndicatorClass(mockFiles[1]):', getItemIndicatorClass(mockFiles[1]))

  // Test clear operation
  console.log('\nTesting clear operation...')
  clear()
  console.log('- hasOperation:', hasOperation.value)
  console.log('- operationCount:', operationCount.value)
  console.log('- operationDescription:', getOperationDescription())

  console.log('\nAll tests completed!')
}

// Export for manual testing
export { testFileOperations }

// Auto-run if in browser environment
if (typeof window !== 'undefined') {
  console.log('useFileOperations test file loaded. Call testFileOperations() to run tests.')
}