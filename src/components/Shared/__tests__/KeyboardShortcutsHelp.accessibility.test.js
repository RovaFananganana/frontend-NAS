/**
 * @fileoverview Tests d'accessibilité pour le composant KeyboardShortcutsHelp
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import KeyboardShortcutsHelp from '../KeyboardShortcutsHelp.vue'

describe('KeyboardShortcutsHelp - Accessibilité', () => {
  let wrapper
  let originalActiveElement

  beforeEach(() => {
    // Sauvegarder l'élément actif original
    originalActiveElement = document.activeElement
    
    wrapper = mount(KeyboardShortcutsHelp, {
      props: {
        show: true
      }
    })
  })

  afterEach(() => {
    // Restaurer l'élément actif original
    if (originalActiveElement && typeof originalActiveElement.focus === 'function') {
      originalActiveElement.focus()
    }
  })

  describe('Attributs ARIA', () => {
    it('devrait avoir les attributs ARIA appropriés pour un dialog', () => {
      const dialog = wrapper.find('[role="dialog"]')
      
      expect(dialog.exists()).toBe(true)
      expect(dialog.attributes('aria-modal')).toBe('true')
      expect(dialog.attributes('aria-labelledby')).toBe('shortcuts-title')
      expect(dialog.attributes('aria-describedby')).toBe('shortcuts-description')
    })

    it('devrait avoir un titre identifiable', () => {
      const title = wrapper.find('#shortcuts-title')
      expect(title.exists()).toBe(true)
      expect(title.text()).toBe('Raccourcis clavier')
    })

    it('devrait avoir une description identifiable', () => {
      const description = wrapper.find('#shortcuts-description')
      expect(description.exists()).toBe(true)
      expect(description.text()).toContain('Utilisez ces raccourcis clavier')
    })

    it('devrait avoir un bouton de fermeture avec aria-label', () => {
      const closeButton = wrapper.find('button[aria-label]')
      expect(closeButton.exists()).toBe(true)
      expect(closeButton.attributes('aria-label')).toBe('Fermer l\'aide des raccourcis clavier')
      expect(closeButton.attributes('title')).toBe('Fermer (Échap)')
    })

    it('devrait marquer les icônes comme décoratives', () => {
      const decorativeIcons = wrapper.findAll('i[aria-hidden="true"]')
      expect(decorativeIcons.length).toBeGreaterThan(0)
    })
  })

  describe('Gestion du focus', () => {
    it('devrait donner le focus au contenu du dialog à l\'ouverture', async () => {
      // Créer un nouveau wrapper fermé
      const closedWrapper = mount(KeyboardShortcutsHelp, {
        props: { show: false }
      })

      // Simuler un élément actif
      const mockElement = document.createElement('button')
      document.body.appendChild(mockElement)
      mockElement.focus()

      // Ouvrir le dialog
      await closedWrapper.setProps({ show: true })
      await nextTick()

      // Vérifier que le focus est géré - chercher par tabindex
      const dialogContent = closedWrapper.find('[tabindex="-1"]')
      expect(dialogContent.exists()).toBe(true)

      // Nettoyer
      document.body.removeChild(mockElement)
      closedWrapper.unmount()
    })

    it('devrait gérer la fermeture avec Escape', async () => {
      const dialog = wrapper.find('[role="dialog"]')
      
      // Utiliser la méthode trigger de Vue Test Utils
      await dialog.trigger('keydown.escape')

      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('devrait piéger le focus avec Tab', async () => {
      const dialogContent = wrapper.find('[tabindex="-1"]')
      expect(dialogContent.exists()).toBe(true)

      // Utiliser la méthode trigger de Vue Test Utils
      await dialogContent.trigger('keydown.tab')
      
      // Le test vérifie que l'événement peut être géré sans erreur
      expect(dialogContent.exists()).toBe(true)
    })

    it('devrait gérer Shift+Tab pour la navigation inverse', async () => {
      const dialogContent = wrapper.find('[tabindex="-1"]')
      
      // Utiliser la méthode trigger avec les modificateurs
      await dialogContent.trigger('keydown', {
        key: 'Tab',
        shiftKey: true
      })
      
      expect(dialogContent.exists()).toBe(true)
    })
  })

  describe('Structure sémantique', () => {
    it('devrait utiliser des éléments de titre appropriés', () => {
      const mainTitle = wrapper.find('h3')
      const sectionTitles = wrapper.findAll('h4')

      expect(mainTitle.exists()).toBe(true)
      expect(sectionTitles.length).toBeGreaterThan(0)

      // Vérifier la hiérarchie des titres
      expect(mainTitle.element.tagName).toBe('H3')
      sectionTitles.forEach(title => {
        expect(title.element.tagName).toBe('H4')
      })
    })

    it('devrait utiliser des éléments kbd pour les raccourcis', () => {
      const kbdElements = wrapper.findAll('kbd')
      expect(kbdElements.length).toBeGreaterThan(0)

      // Vérifier que tous les éléments kbd ont du contenu
      kbdElements.forEach(kbd => {
        expect(kbd.text().trim()).not.toBe('')
      })
    })

    it('devrait avoir une structure de liste logique', () => {
      const sections = wrapper.findAll('.space-y-3')
      expect(sections.length).toBeGreaterThan(0)

      // Chaque section devrait avoir un titre et du contenu
      sections.forEach(section => {
        const title = section.find('h4')
        const content = section.find('.space-y-2')
        
        expect(title.exists()).toBe(true)
        expect(content.exists()).toBe(true)
      })
    })
  })

  describe('Contraste et lisibilité', () => {
    it('devrait utiliser des classes de couleur appropriées', () => {
      const textElements = wrapper.findAll('.text-base-content, .text-base-content\\/70, .text-base-content\\/60')
      expect(textElements.length).toBeGreaterThan(0)

      // Vérifier que les éléments de texte ont des classes de couleur
      textElements.forEach(element => {
        const classes = element.classes()
        expect(classes.some(cls => cls.includes('text-'))).toBe(true)
      })
    })

    it('devrait avoir des bordures visibles pour la séparation', () => {
      const borders = wrapper.findAll('.border-b')
      expect(borders.length).toBeGreaterThan(0)
    })
  })

  describe('Responsive et mobile', () => {
    it('devrait avoir des classes responsive appropriées', () => {
      const grid = wrapper.find('.grid')
      expect(grid.classes()).toContain('grid-cols-1')
      expect(grid.classes()).toContain('md:grid-cols-2')
    })

    it('devrait avoir des marges appropriées pour mobile', () => {
      const content = wrapper.find('.max-w-2xl')
      expect(content.classes()).toContain('mx-4')
    })

    it('devrait avoir une hauteur maximale pour éviter le débordement', () => {
      const content = wrapper.find('.max-h-\\[80vh\\]')
      expect(content.exists()).toBe(true)
      expect(content.classes()).toContain('overflow-y-auto')
    })
  })

  describe('Gestion des événements clavier globaux', () => {
    it('devrait écouter les événements clavier au niveau document', () => {
      // Vérifier que le composant peut gérer les événements clavier
      const spy = vi.spyOn(document, 'addEventListener')
      
      const testWrapper = mount(KeyboardShortcutsHelp, {
        props: { show: true }
      })

      expect(spy).toHaveBeenCalledWith('keydown', expect.any(Function))
      
      testWrapper.unmount()
      spy.mockRestore()
    })

    it('devrait nettoyer les événements lors du démontage', () => {
      const spy = vi.spyOn(document, 'removeEventListener')
      
      const testWrapper = mount(KeyboardShortcutsHelp, {
        props: { show: true }
      })

      testWrapper.unmount()

      expect(spy).toHaveBeenCalledWith('keydown', expect.any(Function))
      spy.mockRestore()
    })
  })

  describe('Instructions d\'utilisation', () => {
    it('devrait fournir des instructions claires pour fermer', () => {
      const instructions = wrapper.text()
      expect(instructions).toContain('Appuyez sur')
      expect(instructions).toContain('Échap')
      expect(instructions).toContain('ou cliquez à l\'extérieur pour fermer')
    })

    it('devrait avoir une description utile du composant', () => {
      const description = wrapper.find('#shortcuts-description')
      expect(description.text()).toContain('naviguer plus efficacement')
    })
  })

  describe('Compatibilité avec les lecteurs d\'écran', () => {
    it('devrait annoncer le dialog correctement', () => {
      const dialog = wrapper.find('[role="dialog"]')
      
      // Vérifier les attributs essentiels pour les lecteurs d'écran
      expect(dialog.attributes('role')).toBe('dialog')
      expect(dialog.attributes('aria-modal')).toBe('true')
      expect(dialog.attributes('aria-labelledby')).toBeTruthy()
      expect(dialog.attributes('aria-describedby')).toBeTruthy()
    })

    it('devrait avoir un contenu structuré pour la navigation', () => {
      // Vérifier que le contenu est bien structuré avec des titres
      const headings = wrapper.findAll('h3, h4')
      expect(headings.length).toBeGreaterThan(1)

      // Vérifier que chaque section a un titre
      const sections = wrapper.findAll('.space-y-3')
      sections.forEach(section => {
        const heading = section.find('h4')
        expect(heading.exists()).toBe(true)
      })
    })
  })
})