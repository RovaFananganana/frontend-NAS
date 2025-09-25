/**
 * @fileoverview Tests unitaires pour le composable useFileExplorerNavigation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { mount } from '@vue/test-utils'
import { useFileExplorerNavigation } from '../useFileExplorerNavigation.js'

// Mock du composable useKeyboardShortcuts
vi.mock('../useKeyboardShortcuts.js', () => ({
  useKeyboardShortcuts: vi.fn(() => ({
    setActive: vi.fn()
  })),
  VIEW_MODE_SHORTCUTS: {}
}))

// Composant de test
const TestComponent = {
  template: '<div>Navigation Test</div>',
  setup() {
    const files = ref([
      { name: 'folder1', path: '/folder1', is_directory: true },
      { name: 'file1.txt', path: '/file1.txt', is_directory: false },
      { name: 'file2.pdf', path: '/file2.pdf', is_directory: false },
      { name: 'folder2', path: '/folder2', is_directory: true }
    ])

    const selectedFiles = ref([])
    const currentPath = ref('/')

    const mockCallbacks = {
      onFileSelect: vi.fn(),
      onFileOpen: vi.fn(),
      onPathChange: vi.fn(),
      onSort: vi.fn(),
      onRefresh: vi.fn(),
      onShowHelp: vi.fn()
    }

    const navigation = useFileExplorerNavigation({
      files,
      selectedFiles,
      currentPath,
      ...mockCallbacks
    })

    return {
      files,
      selectedFiles,
      currentPath,
      mockCallbacks,
      ...navigation
    }
  }
}

describe('useFileExplorerNavigation', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(TestComponent)
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    vi.clearAllMocks()
  })

  describe('État initial', () => {
    it('devrait initialiser avec les bonnes valeurs par défaut', () => {
      expect(wrapper.vm.focusedIndex).toBe(-1)
      expect(wrapper.vm.focusedFile).toBeNull()
      expect(wrapper.vm.hasSelection).toBe(false)
      expect(wrapper.vm.canGoUp).toBe(false) // currentPath est '/'
    })
  })

  describe('Navigation au clavier', () => {
    it('devrait définir l\'index de focus correctement', () => {
      wrapper.vm.setFocusedIndex(1)
      expect(wrapper.vm.focusedIndex).toBe(1)
      expect(wrapper.vm.focusedFile.name).toBe('file1.txt')
    })

    it('devrait limiter l\'index de focus aux bornes valides', () => {
      // Index négatif
      wrapper.vm.setFocusedIndex(-5)
      expect(wrapper.vm.focusedIndex).toBe(0)

      // Index trop grand
      wrapper.vm.setFocusedIndex(10)
      expect(wrapper.vm.focusedIndex).toBe(3) // Dernier index valide
    })

    it('devrait déplacer le focus vers le haut', () => {
      wrapper.vm.setFocusedIndex(2)
      wrapper.vm.moveFocus('up')
      expect(wrapper.vm.focusedIndex).toBe(1)
    })

    it('devrait déplacer le focus vers le bas', () => {
      wrapper.vm.setFocusedIndex(1)
      wrapper.vm.moveFocus('down')
      expect(wrapper.vm.focusedIndex).toBe(2)
    })

    it('devrait aller au premier élément', () => {
      wrapper.vm.setFocusedIndex(2)
      wrapper.vm.moveFocus('first')
      expect(wrapper.vm.focusedIndex).toBe(0)
    })

    it('devrait aller au dernier élément', () => {
      wrapper.vm.setFocusedIndex(0)
      wrapper.vm.moveFocus('last')
      expect(wrapper.vm.focusedIndex).toBe(3)
    })

    it('devrait gérer la navigation circulaire', () => {
      // Du dernier au premier
      wrapper.vm.setFocusedIndex(3)
      wrapper.vm.moveFocus('down')
      expect(wrapper.vm.focusedIndex).toBe(0)

      // Du premier au dernier
      wrapper.vm.setFocusedIndex(0)
      wrapper.vm.moveFocus('up')
      expect(wrapper.vm.focusedIndex).toBe(3)
    })
  })

  describe('Sélection de fichiers', () => {
    it('devrait sélectionner un fichier simple', () => {
      wrapper.vm.selectFile(1, false, false)

      expect(wrapper.vm.selectedFiles).toEqual(['/file1.txt'])
      expect(wrapper.vm.mockCallbacks.onFileSelect).toHaveBeenCalledWith({
        file: wrapper.vm.files[1],
        selectedFiles: ['/file1.txt'],
        multiSelect: false,
        rangeSelect: false
      })
    })

    it('devrait gérer la sélection multiple', () => {
      // Sélectionner le premier fichier
      wrapper.vm.selectFile(1, false, false)
      expect(wrapper.vm.selectedFiles).toEqual(['/file1.txt'])

      // Ajouter un deuxième fichier avec Ctrl
      wrapper.vm.selectFile(2, true, false)
      expect(wrapper.vm.selectedFiles).toEqual(['/file1.txt', '/file2.pdf'])

      // Désélectionner le premier avec Ctrl
      wrapper.vm.selectFile(1, true, false)
      expect(wrapper.vm.selectedFiles).toEqual(['/file2.pdf'])
    })

    it('devrait gérer la sélection par plage', () => {
      // Sélectionner le premier fichier
      wrapper.vm.selectFile(1, false, false)
      
      // Sélectionner par plage jusqu'au troisième
      wrapper.vm.selectFile(3, false, true)
      
      expect(wrapper.vm.selectedFiles).toEqual(['/file1.txt', '/file2.pdf', '/folder2'])
    })

    it('devrait tout sélectionner', () => {
      wrapper.vm.selectAll()

      expect(wrapper.vm.selectedFiles).toEqual([
        '/folder1',
        '/file1.txt', 
        '/file2.pdf',
        '/folder2'
      ])
      expect(wrapper.vm.mockCallbacks.onFileSelect).toHaveBeenCalledWith({
        selectedFiles: wrapper.vm.selectedFiles,
        action: 'selectAll'
      })
    })

    it('devrait tout désélectionner', () => {
      // D'abord sélectionner quelque chose
      wrapper.vm.selectFile(1, false, false)
      expect(wrapper.vm.selectedFiles).toEqual(['/file1.txt'])

      // Puis tout désélectionner
      wrapper.vm.clearSelection()
      expect(wrapper.vm.selectedFiles).toEqual([])
      expect(wrapper.vm.mockCallbacks.onFileSelect).toHaveBeenCalledWith({
        selectedFiles: [],
        action: 'clear'
      })
    })
  })

  describe('Extension de sélection', () => {
    it('devrait étendre la sélection vers le haut', () => {
      wrapper.vm.setFocusedIndex(2)
      wrapper.vm.extendSelection('up')

      expect(wrapper.vm.focusedIndex).toBe(1)
      expect(wrapper.vm.selectedFiles).toContain('/file1.txt')
      expect(wrapper.vm.selectedFiles).toContain('/file2.pdf')
    })

    it('devrait étendre la sélection vers le bas', () => {
      wrapper.vm.setFocusedIndex(1)
      wrapper.vm.extendSelection('down')

      expect(wrapper.vm.focusedIndex).toBe(2)
      expect(wrapper.vm.selectedFiles).toContain('/file1.txt')
      expect(wrapper.vm.selectedFiles).toContain('/file2.pdf')
    })
  })

  describe('Actions clavier', () => {
    it('devrait exécuter l\'action selectPrevious', () => {
      wrapper.vm.setFocusedIndex(2)
      wrapper.vm.keyboardActions.selectPrevious()
      expect(wrapper.vm.focusedIndex).toBe(1)
    })

    it('devrait exécuter l\'action selectNext', () => {
      wrapper.vm.setFocusedIndex(1)
      wrapper.vm.keyboardActions.selectNext()
      expect(wrapper.vm.focusedIndex).toBe(2)
    })

    it('devrait exécuter l\'action openSelected', () => {
      wrapper.vm.setFocusedIndex(1)
      wrapper.vm.keyboardActions.openSelected()

      expect(wrapper.vm.mockCallbacks.onFileOpen).toHaveBeenCalledWith({
        file: wrapper.vm.files[1]
      })
    })

    it('devrait exécuter l\'action selectAll', () => {
      wrapper.vm.keyboardActions.selectAll()

      expect(wrapper.vm.selectedFiles.length).toBe(4)
      expect(wrapper.vm.mockCallbacks.onFileSelect).toHaveBeenCalled()
    })

    it('devrait exécuter l\'action refresh', () => {
      wrapper.vm.keyboardActions.refresh()
      expect(wrapper.vm.mockCallbacks.onRefresh).toHaveBeenCalled()
    })

    it('devrait exécuter l\'action showHelp', () => {
      wrapper.vm.keyboardActions.showHelp()
      expect(wrapper.vm.mockCallbacks.onShowHelp).toHaveBeenCalled()
    })
  })

  describe('Gestionnaires d\'événements', () => {
    it('devrait gérer le clic sur un fichier', () => {
      const file = wrapper.vm.files[1]
      const event = { ctrlKey: false, metaKey: false, shiftKey: false }

      wrapper.vm.handleClick(file, event)

      expect(wrapper.vm.focusedIndex).toBe(1)
      expect(wrapper.vm.selectedFiles).toEqual(['/file1.txt'])
    })

    it('devrait gérer le double-clic sur un fichier', () => {
      const file = wrapper.vm.files[1]
      const event = {}

      wrapper.vm.handleDoubleClick(file, event)

      expect(wrapper.vm.focusedIndex).toBe(1)
      expect(wrapper.vm.mockCallbacks.onFileOpen).toHaveBeenCalledWith({
        file,
        event
      })
    })
  })

  describe('Utilitaires', () => {
    it('devrait trouver l\'index d\'un fichier', () => {
      const index = wrapper.vm.findFileIndex('/file2.pdf')
      expect(index).toBe(2)
    })

    it('devrait retourner -1 pour un fichier inexistant', () => {
      const index = wrapper.vm.findFileIndex('/inexistant.txt')
      expect(index).toBe(-1)
    })

    it('devrait focuser un fichier par nom', () => {
      wrapper.vm.focusFile('/file2.pdf')
      expect(wrapper.vm.focusedIndex).toBe(2)
    })

    it('devrait calculer le chemin parent', () => {
      expect(wrapper.vm.getParentPath('/folder/subfolder')).toBe('/folder')
      expect(wrapper.vm.getParentPath('/folder')).toBe('/')
      expect(wrapper.vm.getParentPath('/')).toBe('/')
    })
  })

  describe('Contrôle d\'activation', () => {
    it('devrait avoir des méthodes d\'activation et désactivation', () => {
      expect(typeof wrapper.vm.activate).toBe('function')
      expect(typeof wrapper.vm.deactivate).toBe('function')
    })

    it('devrait initialiser le focus lors de l\'activation', () => {
      wrapper.vm.focusedIndex = -1
      wrapper.vm.activate()
      expect(wrapper.vm.focusedIndex).toBe(0)
    })
  })
})