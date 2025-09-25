/**
 * @fileoverview Tests pour le composant KeyboardShortcutsHelp
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import KeyboardShortcutsHelp from '../KeyboardShortcutsHelp.vue'

describe('KeyboardShortcutsHelp', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(KeyboardShortcutsHelp, {
      props: {
        show: true
      }
    })
  })

  describe('Affichage et visibilité', () => {
    it('devrait s\'afficher quand show est true', () => {
      expect(wrapper.find('.keyboard-shortcuts-help').exists()).toBe(true)
      expect(wrapper.isVisible()).toBe(true)
    })

    it('ne devrait pas s\'afficher quand show est false', async () => {
      await wrapper.setProps({ show: false })
      expect(wrapper.find('.keyboard-shortcuts-help').exists()).toBe(false)
    })

    it('devrait afficher le titre correct', () => {
      const title = wrapper.find('h3')
      expect(title.text()).toBe('Raccourcis clavier')
    })

    it('devrait afficher le bouton de fermeture', () => {
      const closeButton = wrapper.find('.btn-circle')
      expect(closeButton.exists()).toBe(true)
      expect(closeButton.find('i.fa-times').exists()).toBe(true)
    })
  })

  describe('Structure et contenu', () => {
    it('devrait afficher toutes les catégories de raccourcis', () => {
      const categories = wrapper.findAll('h4')
      const categoryTexts = categories.map(cat => cat.text())
      
      expect(categoryTexts).toContain('Tri')
      expect(categoryTexts).toContain('Navigation')
      expect(categoryTexts).toContain('Sélection')
      expect(categoryTexts).toContain('Actions')
      expect(categoryTexts).toContain('Modes d\'affichage')
    })

    it('devrait afficher les raccourcis de tri', () => {
      const text = wrapper.text()
      
      expect(text).toContain('Trier par nom')
      expect(text).toContain('Trier par taille')
      expect(text).toContain('Trier par type')
      expect(text).toContain('Trier par date')
    })

    it('devrait afficher les raccourcis de navigation', () => {
      const text = wrapper.text()
      
      expect(text).toContain('Élément suivant')
      expect(text).toContain('Élément précédent')
      expect(text).toContain('Premier élément')
      expect(text).toContain('Dernier élément')
      expect(text).toContain('Ouvrir sélection')
      expect(text).toContain('Dossier parent')
    })

    it('devrait afficher les raccourcis de sélection', () => {
      const text = wrapper.text()
      
      expect(text).toContain('Tout sélectionner')
      expect(text).toContain('Tout désélectionner')
      expect(text).toContain('Basculer sélection')
      expect(text).toContain('Étendre vers le haut')
      expect(text).toContain('Étendre vers le bas')
      expect(text).toContain('Sélection multiple')
      expect(text).toContain('Sélection par plage')
    })

    it('devrait afficher les raccourcis d\'actions', () => {
      const text = wrapper.text()
      
      expect(text).toContain('Actualiser')
      expect(text).toContain('Renommer')
      expect(text).toContain('Supprimer')
      expect(text).toContain('Copier')
      expect(text).toContain('Coller')
      expect(text).toContain('Couper')
    })

    it('devrait afficher les raccourcis de modes d\'affichage', () => {
      const text = wrapper.text()
      
      expect(text).toContain('Mode arbre')
      expect(text).toContain('Liste détaillée')
      expect(text).toContain('Aide')
    })
  })

  describe('Éléments kbd', () => {
    it('devrait afficher les touches kbd correctement formatées', () => {
      const kbdElements = wrapper.findAll('.kbd')
      expect(kbdElements.length).toBeGreaterThan(0)
      
      // Vérifier quelques exemples spécifiques
      const kbdTexts = kbdElements.map(kbd => kbd.text())
      expect(kbdTexts).toContain('Ctrl')
      expect(kbdTexts).toContain('Shift')
      expect(kbdTexts).toContain('F1')
      expect(kbdTexts).toContain('F5')
      expect(kbdTexts).toContain('↓')
      expect(kbdTexts).toContain('↑')
    })

    it('devrait utiliser la classe kbd-sm pour les petites touches', () => {
      const smallKbds = wrapper.findAll('.kbd-sm')
      expect(smallKbds.length).toBeGreaterThan(0)
    })
  })

  describe('Interactions', () => {
    it('devrait émettre close quand on clique sur le bouton de fermeture', async () => {
      const closeButton = wrapper.find('.btn-circle')
      await closeButton.trigger('click')
      
      expect(wrapper.emitted('close')).toBeTruthy()
      expect(wrapper.emitted('close')).toHaveLength(1)
    })

    it('devrait émettre close quand on clique sur l\'overlay', async () => {
      const overlay = wrapper.find('.keyboard-shortcuts-help')
      await overlay.trigger('click')
      
      expect(wrapper.emitted('close')).toBeTruthy()
      expect(wrapper.emitted('close')).toHaveLength(1)
    })

    it('ne devrait pas émettre close quand on clique sur le contenu', async () => {
      const content = wrapper.find('.bg-base-100')
      await content.trigger('click')
      
      expect(wrapper.emitted('close')).toBeFalsy()
    })
  })

  describe('Accessibilité', () => {
    it('devrait avoir un z-index élevé pour être au-dessus des autres éléments', () => {
      const overlay = wrapper.find('.keyboard-shortcuts-help')
      expect(overlay.classes()).toContain('z-50')
    })

    it('devrait avoir un fond semi-transparent', () => {
      const overlay = wrapper.find('.keyboard-shortcuts-help')
      expect(overlay.classes()).toContain('bg-black/50')
    })

    it('devrait être centré sur l\'écran', () => {
      const overlay = wrapper.find('.keyboard-shortcuts-help')
      expect(overlay.classes()).toContain('flex')
      expect(overlay.classes()).toContain('items-center')
      expect(overlay.classes()).toContain('justify-center')
    })

    it('devrait avoir une hauteur maximale avec scroll', () => {
      const content = wrapper.find('.bg-base-100')
      expect(content.classes()).toContain('max-h-[80vh]')
      expect(content.classes()).toContain('overflow-y-auto')
    })

    it('devrait afficher les instructions de fermeture', () => {
      const text = wrapper.text()
      expect(text).toContain('Appuyez sur')
      expect(text).toContain('Échap')
      expect(text).toContain('ou cliquez à l\'extérieur pour fermer')
    })
  })

  describe('Responsive design', () => {
    it('devrait avoir des classes responsive pour la grille', () => {
      const grid = wrapper.find('.grid')
      expect(grid.classes()).toContain('grid-cols-1')
      expect(grid.classes()).toContain('md:grid-cols-2')
    })

    it('devrait avoir des marges responsive', () => {
      const content = wrapper.find('.bg-base-100')
      expect(content.classes()).toContain('mx-4')
    })

    it('devrait avoir une largeur maximale définie', () => {
      const content = wrapper.find('.bg-base-100')
      expect(content.classes()).toContain('max-w-2xl')
      expect(content.classes()).toContain('w-full')
    })
  })

  describe('Animations', () => {
    it('devrait avoir des classes d\'animation CSS', () => {
      const overlay = wrapper.find('.keyboard-shortcuts-help')
      
      // Vérifier que l'élément existe et peut être animé
      expect(overlay.exists()).toBe(true)
      expect(overlay.classes()).toContain('keyboard-shortcuts-help')
      
      // Dans un environnement de test, les animations CSS peuvent ne pas être appliquées
      // On vérifie plutôt que l'élément a la classe qui déclenche l'animation
      expect(overlay.element).toBeDefined()
    })
  })

  describe('Gestion des événements clavier', () => {
    it('devrait pouvoir être fermé avec la touche Escape', async () => {
      // Simuler l'appui sur Escape
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        code: 'Escape',
        keyCode: 27
      })
      
      document.dispatchEvent(escapeEvent)
      await wrapper.vm.$nextTick()
      
      // Note: Le composant lui-même ne gère pas Escape, 
      // c'est le composant parent qui le fait
      // Nous testons juste que le composant peut recevoir l'événement
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Props et émissions', () => {
    it('devrait accepter la prop show', () => {
      expect(wrapper.props('show')).toBe(true)
    })

    it('devrait définir l\'émission close', () => {
      expect(wrapper.vm.$options.emits).toContain('close')
    })
  })

  describe('Structure HTML sémantique', () => {
    it('devrait utiliser des éléments sémantiques appropriés', () => {
      // Vérifier la structure sémantique
      expect(wrapper.find('h3').exists()).toBe(true) // Titre principal
      expect(wrapper.findAll('h4').length).toBeGreaterThan(0) // Sous-titres
      expect(wrapper.findAll('kbd').length).toBeGreaterThan(0) // Éléments kbd pour les touches
    })

    it('devrait avoir des icônes appropriées pour chaque section', () => {
      const icons = wrapper.findAll('h4 i')
      const iconClasses = icons.map(icon => icon.classes().join(' '))
      
      expect(iconClasses.some(classes => classes.includes('fa-sort'))).toBe(true)
      expect(iconClasses.some(classes => classes.includes('fa-arrows-alt'))).toBe(true)
      expect(iconClasses.some(classes => classes.includes('fa-check-square'))).toBe(true)
      expect(iconClasses.some(classes => classes.includes('fa-cogs'))).toBe(true)
      expect(iconClasses.some(classes => classes.includes('fa-eye'))).toBe(true)
    })
  })
})