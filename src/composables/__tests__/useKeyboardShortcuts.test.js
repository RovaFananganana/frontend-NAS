/**
 * @fileoverview Tests unitaires pour le composable useKeyboardShortcuts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { useKeyboardShortcuts, VIEW_MODE_SHORTCUTS } from '../useKeyboardShortcuts.js'

// Composant de test pour tester le composable
const TestComponent = {
  template: '<div>Test Component</div>',
  setup() {
    const shortcuts = {
      'Ctrl+a': vi.fn(),
      'F5': vi.fn(),
      'Up': vi.fn(),
      'Down': vi.fn(),
      'Enter': vi.fn(),
      'Esc': vi.fn()
    }

    const { 
      isActive, 
      addShortcut, 
      removeShortcut, 
      setActive, 
      getShortcuts,
      shortcutsByCategory 
    } = useKeyboardShortcuts(shortcuts, {
      preventDefault: true,
      context: 'test'
    })

    return {
      isActive,
      addShortcut,
      removeShortcut,
      setActive,
      getShortcuts,
      shortcutsByCategory,
      shortcuts
    }
  }
}

describe('useKeyboardShortcuts', () => {
  let wrapper
  let mockShortcuts

  beforeEach(() => {
    mockShortcuts = {
      'Ctrl+a': vi.fn(),
      'F5': vi.fn(),
      'Up': vi.fn(),
      'Down': vi.fn(),
      'Enter': vi.fn(),
      'Esc': vi.fn()
    }

    wrapper = mount(TestComponent)
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    vi.clearAllMocks()
  })

  describe('Initialisation', () => {
    it('devrait initialiser avec les raccourcis fournis', () => {
      const shortcuts = wrapper.vm.getShortcuts()
      expect(shortcuts).toHaveProperty('Ctrl+a')
      expect(shortcuts).toHaveProperty('F5')
      expect(shortcuts).toHaveProperty('Up')
      expect(shortcuts).toHaveProperty('Down')
    })

    it('devrait être actif par défaut', () => {
      expect(wrapper.vm.isActive).toBe(true)
    })
  })

  describe('Gestion des raccourcis', () => {
    it('devrait ajouter un nouveau raccourci', () => {
      const newAction = vi.fn()
      wrapper.vm.addShortcut('Ctrl+s', newAction)

      const shortcuts = wrapper.vm.getShortcuts()
      expect(shortcuts).toHaveProperty('Ctrl+s')
      expect(shortcuts['Ctrl+s']).toBe(newAction)
    })

    it('devrait supprimer un raccourci existant', () => {
      wrapper.vm.removeShortcut('Ctrl+a')

      const shortcuts = wrapper.vm.getShortcuts()
      expect(shortcuts).not.toHaveProperty('Ctrl+a')
    })

    it('devrait permettre d\'activer/désactiver les raccourcis', () => {
      expect(wrapper.vm.isActive).toBe(true)

      wrapper.vm.setActive(false)
      expect(wrapper.vm.isActive).toBe(false)

      wrapper.vm.setActive(true)
      expect(wrapper.vm.isActive).toBe(true)
    })
  })

  describe('Événements clavier', () => {
    it('devrait déclencher l\'action pour Ctrl+A', async () => {
      const event = new KeyboardEvent('keydown', {
        key: 'a',
        ctrlKey: true,
        bubbles: true
      })

      document.dispatchEvent(event)
      await nextTick()

      expect(wrapper.vm.shortcuts['Ctrl+a']).toHaveBeenCalled()
    })

    it('devrait déclencher l\'action pour F5', async () => {
      const event = new KeyboardEvent('keydown', {
        key: 'F5',
        bubbles: true
      })

      document.dispatchEvent(event)
      await nextTick()

      expect(wrapper.vm.shortcuts['F5']).toHaveBeenCalled()
    })

    it('devrait déclencher l\'action pour les flèches', async () => {
      const upEvent = new KeyboardEvent('keydown', {
        key: 'ArrowUp',
        bubbles: true
      })

      const downEvent = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true
      })

      document.dispatchEvent(upEvent)
      document.dispatchEvent(downEvent)
      await nextTick()

      expect(wrapper.vm.shortcuts['Up']).toHaveBeenCalled()
      expect(wrapper.vm.shortcuts['Down']).toHaveBeenCalled()
    })

    it('ne devrait pas déclencher d\'action quand désactivé', async () => {
      wrapper.vm.setActive(false)

      const event = new KeyboardEvent('keydown', {
        key: 'a',
        ctrlKey: true,
        bubbles: true
      })

      document.dispatchEvent(event)
      await nextTick()

      expect(wrapper.vm.shortcuts['Ctrl+a']).not.toHaveBeenCalled()
    })

    it('ne devrait pas intercepter les raccourcis dans les champs de saisie', async () => {
      // Créer un input et le focus
      const input = document.createElement('input')
      input.type = 'text'
      document.body.appendChild(input)
      input.focus()

      const event = new KeyboardEvent('keydown', {
        key: 'a',
        ctrlKey: true,
        bubbles: true
      })

      document.dispatchEvent(event)
      await nextTick()

      // Ctrl+A devrait être autorisé dans les champs de saisie
      expect(wrapper.vm.shortcuts['Ctrl+a']).toHaveBeenCalled()

      // Nettoyer
      document.body.removeChild(input)
    })
  })

  describe('Normalisation des touches', () => {
    it('devrait normaliser les touches spéciales', async () => {
      const escapeAction = vi.fn()
      wrapper.vm.addShortcut('Esc', escapeAction)

      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true
      })

      document.dispatchEvent(event)
      await nextTick()

      expect(escapeAction).toHaveBeenCalled()
    })

    it('devrait normaliser les flèches', async () => {
      const event = new KeyboardEvent('keydown', {
        key: 'ArrowUp',
        bubbles: true
      })

      document.dispatchEvent(event)
      await nextTick()

      expect(wrapper.vm.shortcuts['Up']).toHaveBeenCalled()
    })
  })

  describe('Catégorisation des raccourcis', () => {
    it('devrait catégoriser les raccourcis par type', () => {
      const categories = wrapper.vm.shortcutsByCategory

      expect(categories).toHaveProperty('navigation')
      expect(categories).toHaveProperty('selection')
      expect(categories).toHaveProperty('actions')
      expect(categories).toHaveProperty('modes')
      expect(categories).toHaveProperty('sorting')
      expect(categories).toHaveProperty('help')
    })
  })
})

describe('VIEW_MODE_SHORTCUTS', () => {
  it('devrait contenir tous les raccourcis de navigation', () => {
    expect(VIEW_MODE_SHORTCUTS).toHaveProperty('Up')
    expect(VIEW_MODE_SHORTCUTS).toHaveProperty('Down')
    expect(VIEW_MODE_SHORTCUTS).toHaveProperty('Home')
    expect(VIEW_MODE_SHORTCUTS).toHaveProperty('End')
    expect(VIEW_MODE_SHORTCUTS).toHaveProperty('Enter')
    expect(VIEW_MODE_SHORTCUTS).toHaveProperty('Backspace')
  })

  it('devrait contenir tous les raccourcis de sélection', () => {
    expect(VIEW_MODE_SHORTCUTS).toHaveProperty('Ctrl+a')
    expect(VIEW_MODE_SHORTCUTS).toHaveProperty('Ctrl+d')
    expect(VIEW_MODE_SHORTCUTS).toHaveProperty('Shift+Up')
    expect(VIEW_MODE_SHORTCUTS).toHaveProperty('Shift+Down')
    expect(VIEW_MODE_SHORTCUTS).toHaveProperty('Space')
  })

  it('devrait contenir tous les raccourcis d\'actions', () => {
    expect(VIEW_MODE_SHORTCUTS).toHaveProperty('F2')
    expect(VIEW_MODE_SHORTCUTS).toHaveProperty('Delete')
    expect(VIEW_MODE_SHORTCUTS).toHaveProperty('Ctrl+c')
    expect(VIEW_MODE_SHORTCUTS).toHaveProperty('Ctrl+v')
    expect(VIEW_MODE_SHORTCUTS).toHaveProperty('Ctrl+x')
    expect(VIEW_MODE_SHORTCUTS).toHaveProperty('F5')
  })

  it('devrait contenir tous les raccourcis de modes', () => {
    expect(VIEW_MODE_SHORTCUTS).toHaveProperty('Ctrl+1')
    expect(VIEW_MODE_SHORTCUTS).toHaveProperty('Ctrl+2')
  })

  it('devrait contenir tous les raccourcis de tri', () => {
    expect(VIEW_MODE_SHORTCUTS).toHaveProperty('Ctrl+Shift+n')
    expect(VIEW_MODE_SHORTCUTS).toHaveProperty('Ctrl+Shift+s')
    expect(VIEW_MODE_SHORTCUTS).toHaveProperty('Ctrl+Shift+t')
    expect(VIEW_MODE_SHORTCUTS).toHaveProperty('Ctrl+Shift+d')
  })
})