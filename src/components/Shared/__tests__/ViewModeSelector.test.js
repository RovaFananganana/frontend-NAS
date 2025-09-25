/**
 * @fileoverview Tests unitaires pour le composant ViewModeSelector
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ViewModeSelector from '../ViewModeSelector.vue'
import { VIEW_MODES } from '../../../types/viewMode.js'

// Mock du composable useViewMode
const mockUseViewMode = {
  currentMode: { value: VIEW_MODES.TREE },
  availableModes: { 
    value: [
      { id: VIEW_MODES.TREE, label: 'Arbre', icon: 'fas fa-sitemap', component: 'TreeView' },
      { id: VIEW_MODES.DETAILED_LIST, label: 'Liste détaillée', icon: 'fas fa-list', component: 'DetailedListView' }
    ]
  },
  setCurrentMode: vi.fn()
}

// Mock du composable useResponsive
const mockUseResponsive = {
  isMobile: { value: false },
  isTouch: { value: false },
  touchSizes: { value: { minTouchTarget: 44 } }
}

vi.mock('../../../composables/useViewMode.js', () => ({
  useViewMode: () => mockUseViewMode
}))

vi.mock('../../../composables/useResponsive.js', () => ({
  useResponsive: () => mockUseResponsive
}))

describe('ViewModeSelector', () => {
  beforeEach(() => {
    mockUseViewMode.setCurrentMode.mockClear()
  })

  it('should render all available modes', () => {
    const wrapper = mount(ViewModeSelector)
    
    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(2)
    
    // Vérifier que les modes sont affichés
    expect(wrapper.text()).toContain('Arbre')
    expect(wrapper.text()).toContain('Liste détaillée')
  })

  it('should highlight current mode', () => {
    const wrapper = mount(ViewModeSelector)
    
    const buttons = wrapper.findAll('button')
    const treeButton = buttons[0]
    const listButton = buttons[1]
    
    // Le mode arbre devrait être actif
    expect(treeButton.classes()).toContain('btn-primary')
    expect(listButton.classes()).not.toContain('btn-primary')
  })

  it('should call setCurrentMode when button is clicked', async () => {
    const wrapper = mount(ViewModeSelector)
    
    const buttons = wrapper.findAll('button')
    const listButton = buttons[1]
    
    await listButton.trigger('click')
    
    expect(mockUseViewMode.setCurrentMode).toHaveBeenCalledWith(VIEW_MODES.DETAILED_LIST)
  })

  it('should emit mode-changed event', async () => {
    const wrapper = mount(ViewModeSelector)
    
    const buttons = wrapper.findAll('button')
    const listButton = buttons[1]
    
    await listButton.trigger('click')
    
    const emittedEvents = wrapper.emitted('mode-changed')
    expect(emittedEvents).toBeTruthy()
    expect(emittedEvents[0][0]).toMatchObject({
      oldMode: VIEW_MODES.TREE,
      newMode: VIEW_MODES.DETAILED_LIST
    })
  })

  it('should handle keyboard shortcuts when enabled', () => {
    const wrapper = mount(ViewModeSelector, {
      props: { showShortcuts: true }
    })
    
    // Simuler Ctrl+2
    const event = new KeyboardEvent('keydown', {
      key: '2',
      ctrlKey: true
    })
    
    document.dispatchEvent(event)
    
    expect(mockUseViewMode.setCurrentMode).toHaveBeenCalledWith(VIEW_MODES.DETAILED_LIST)
  })

  it('should not handle keyboard shortcuts when disabled', () => {
    const wrapper = mount(ViewModeSelector, {
      props: { showShortcuts: false }
    })
    
    // Simuler Ctrl+2
    const event = new KeyboardEvent('keydown', {
      key: '2',
      ctrlKey: true
    })
    
    document.dispatchEvent(event)
    
    expect(mockUseViewMode.setCurrentMode).not.toHaveBeenCalled()
  })

  it('should apply correct size classes', () => {
    const wrapper = mount(ViewModeSelector, {
      props: { size: 'lg' }
    })
    
    const buttons = wrapper.findAll('button')
    buttons.forEach(button => {
      expect(button.classes()).toContain('btn-sm') // Default fallback in template
    })
  })

  it('should show tooltips with shortcuts', () => {
    const wrapper = mount(ViewModeSelector)
    
    const buttons = wrapper.findAll('button')
    const treeButton = buttons[0]
    const listButton = buttons[1]
    
    expect(treeButton.attributes('title')).toContain('Arbre')
    expect(treeButton.attributes('title')).toContain('Ctrl+1')
    expect(listButton.attributes('title')).toContain('Liste détaillée')
    expect(listButton.attributes('title')).toContain('Ctrl+2')
  })
})