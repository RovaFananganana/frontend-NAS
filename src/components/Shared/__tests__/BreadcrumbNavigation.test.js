import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import BreadcrumbNavigation from '../BreadcrumbNavigation.vue'

describe('BreadcrumbNavigation', () => {
  const createWrapper = (props = {}) => {
    return mount(BreadcrumbNavigation, {
      props: {
        currentPath: '/',
        ...props
      }
    })
  }

  describe('Root path rendering', () => {
    it('renders root breadcrumb correctly', () => {
      const wrapper = createWrapper({ currentPath: '/' })
      
      const homeButton = wrapper.find('[title="Aller à la racine"]')
      expect(homeButton.exists()).toBe(true)
      expect(homeButton.text()).toContain('Racine')
      expect(homeButton.attributes('aria-current')).toBe('page')
    })

    it('shows only root when path is "/"', () => {
      const wrapper = createWrapper({ currentPath: '/' })
      
      const breadcrumbItems = wrapper.findAll('.breadcrumb-item')
      expect(breadcrumbItems).toHaveLength(1)
      
      const separators = wrapper.findAll('.separator')
      expect(separators).toHaveLength(0)
    })
  })

  describe('Path segments rendering', () => {
    it('renders single level path correctly', () => {
      const wrapper = createWrapper({ currentPath: '/documents' })
      
      const breadcrumbItems = wrapper.findAll('.breadcrumb-item')
      expect(breadcrumbItems).toHaveLength(2) // Root + documents
      
      const separators = wrapper.findAll('.separator')
      expect(separators).toHaveLength(1)
      
      const documentsButton = breadcrumbItems[1].find('button')
      expect(documentsButton.text()).toBe('documents')
      expect(documentsButton.attributes('aria-current')).toBe('page')
    })

    it('renders multi-level path correctly', () => {
      const wrapper = createWrapper({ currentPath: '/documents/projects/2024' })
      
      const breadcrumbItems = wrapper.findAll('.breadcrumb-item')
      expect(breadcrumbItems).toHaveLength(4) // Root + documents + projects + 2024
      
      const separators = wrapper.findAll('.separator')
      expect(separators).toHaveLength(3)
      
      // Check each segment
      const buttons = breadcrumbItems.map(item => item.find('button'))
      expect(buttons[0].text()).toContain('Racine')
      expect(buttons[1].text()).toBe('documents')
      expect(buttons[2].text()).toBe('projects')
      expect(buttons[3].text()).toBe('2024')
      
      // Only the last item should have aria-current="page"
      expect(buttons[0].attributes('aria-current')).toBeUndefined()
      expect(buttons[1].attributes('aria-current')).toBeUndefined()
      expect(buttons[2].attributes('aria-current')).toBeUndefined()
      expect(buttons[3].attributes('aria-current')).toBe('page')
    })
  })

  describe('Navigation functionality', () => {
    it('emits navigate event when root is clicked', async () => {
      const wrapper = createWrapper({ currentPath: '/documents' })
      
      const rootButton = wrapper.find('[title="Aller à la racine"]')
      await rootButton.trigger('click')
      
      expect(wrapper.emitted('navigate')).toBeTruthy()
      expect(wrapper.emitted('navigate')[0]).toEqual(['/'])
    })

    it('emits navigate event when segment is clicked', async () => {
      const wrapper = createWrapper({ currentPath: '/documents/projects/2024' })
      
      const breadcrumbItems = wrapper.findAll('.breadcrumb-item')
      const documentsButton = breadcrumbItems[1].find('button')
      
      await documentsButton.trigger('click')
      
      expect(wrapper.emitted('navigate')).toBeTruthy()
      expect(wrapper.emitted('navigate')[0]).toEqual(['/documents'])
    })

    it('does not emit navigate event when current path is clicked', async () => {
      const wrapper = createWrapper({ currentPath: '/documents' })
      
      const breadcrumbItems = wrapper.findAll('.breadcrumb-item')
      const currentButton = breadcrumbItems[1].find('button')
      
      await currentButton.trigger('click')
      
      expect(wrapper.emitted('navigate')).toBeFalsy()
    })

    it('emits correct path for intermediate segments', async () => {
      const wrapper = createWrapper({ currentPath: '/documents/projects/2024/january' })
      
      const breadcrumbItems = wrapper.findAll('.breadcrumb-item')
      const projectsButton = breadcrumbItems[2].find('button')
      
      await projectsButton.trigger('click')
      
      expect(wrapper.emitted('navigate')).toBeTruthy()
      expect(wrapper.emitted('navigate')[0]).toEqual(['/documents/projects'])
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      const wrapper = createWrapper({ currentPath: '/documents/projects' })
      
      const nav = wrapper.find('nav')
      expect(nav.attributes('aria-label')).toBe('Navigation par chemin')
      expect(nav.attributes('role')).toBe('navigation')
    })

    it('has proper button titles', () => {
      const wrapper = createWrapper({ currentPath: '/documents/projects' })
      
      const breadcrumbItems = wrapper.findAll('.breadcrumb-item')
      const buttons = breadcrumbItems.map(item => item.find('button'))
      
      expect(buttons[0].attributes('title')).toBe('Aller à la racine')
      expect(buttons[1].attributes('title')).toBe('Aller à documents')
      expect(buttons[2].attributes('title')).toBe('Aller à projects')
    })

    it('marks current page with aria-current', () => {
      const wrapper = createWrapper({ currentPath: '/documents/projects' })
      
      const breadcrumbItems = wrapper.findAll('.breadcrumb-item')
      const buttons = breadcrumbItems.map(item => item.find('button'))
      
      // Only the last button should have aria-current="page"
      expect(buttons[0].attributes('aria-current')).toBeUndefined()
      expect(buttons[1].attributes('aria-current')).toBeUndefined()
      expect(buttons[2].attributes('aria-current')).toBe('page')
    })

    it('has proper focus management', () => {
      const wrapper = createWrapper({ currentPath: '/documents' })
      
      const buttons = wrapper.findAll('button')
      buttons.forEach(button => {
        expect(button.classes()).toContain('focus:outline-none')
        expect(button.classes()).toContain('focus:ring-2')
        expect(button.classes()).toContain('focus:ring-primary')
      })
    })
  })

  describe('Path parsing', () => {
    it('handles paths with trailing slashes', () => {
      const wrapper = createWrapper({ currentPath: '/documents/projects/' })
      
      const breadcrumbItems = wrapper.findAll('.breadcrumb-item')
      expect(breadcrumbItems).toHaveLength(3) // Root + documents + projects
      
      const buttons = breadcrumbItems.map(item => item.find('button'))
      expect(buttons[2].text()).toBe('projects')
    })

    it('handles empty segments correctly', () => {
      const wrapper = createWrapper({ currentPath: '/documents//projects' })
      
      const breadcrumbItems = wrapper.findAll('.breadcrumb-item')
      expect(breadcrumbItems).toHaveLength(3) // Root + documents + projects (empty segment filtered out)
    })

    it('generates correct paths for segments', () => {
      const wrapper = createWrapper({ currentPath: '/documents/projects/2024' })
      
      // Test the computed pathSegments by triggering clicks and checking emitted paths
      const breadcrumbItems = wrapper.findAll('.breadcrumb-item')
      
      // Click on documents
      breadcrumbItems[1].find('button').trigger('click')
      expect(wrapper.emitted('navigate')[0]).toEqual(['/documents'])
      
      // Click on projects
      breadcrumbItems[2].find('button').trigger('click')
      expect(wrapper.emitted('navigate')[1]).toEqual(['/documents/projects'])
    })
  })

  describe('Styling and responsive behavior', () => {
    it('applies correct CSS classes', () => {
      const wrapper = createWrapper({ currentPath: '/documents' })
      
      const nav = wrapper.find('.breadcrumb-nav')
      expect(nav.exists()).toBe(true)
      
      const list = wrapper.find('.breadcrumb-list')
      expect(list.exists()).toBe(true)
      expect(list.classes()).toContain('flex')
      expect(list.classes()).toContain('items-center')
    })

    it('applies current item styling', () => {
      const wrapper = createWrapper({ currentPath: '/documents' })
      
      const breadcrumbItems = wrapper.findAll('.breadcrumb-item')
      const currentButton = breadcrumbItems[1].find('button')
      
      expect(currentButton.classes()).toContain('text-primary')
      expect(currentButton.classes()).toContain('font-medium')
    })

    it('applies non-current item styling', () => {
      const wrapper = createWrapper({ currentPath: '/documents/projects' })
      
      const breadcrumbItems = wrapper.findAll('.breadcrumb-item')
      const nonCurrentButton = breadcrumbItems[1].find('button')
      
      expect(nonCurrentButton.classes()).toContain('text-base-content/70')
      expect(nonCurrentButton.classes()).toContain('hover:text-base-content')
    })
  })

  describe('Edge cases', () => {
    it('handles undefined currentPath gracefully', () => {
      const wrapper = createWrapper({ currentPath: undefined })
      
      // Should default to root behavior
      const breadcrumbItems = wrapper.findAll('.breadcrumb-item')
      expect(breadcrumbItems).toHaveLength(1)
    })

    it('handles empty currentPath gracefully', () => {
      const wrapper = createWrapper({ currentPath: '' })
      
      // Should default to root behavior
      const breadcrumbItems = wrapper.findAll('.breadcrumb-item')
      expect(breadcrumbItems).toHaveLength(1)
    })

    it('handles very long paths', () => {
      const longPath = '/very/long/path/with/many/segments/that/could/cause/issues/in/the/ui'
      const wrapper = createWrapper({ currentPath: longPath })
      
      const breadcrumbItems = wrapper.findAll('.breadcrumb-item')
      expect(breadcrumbItems.length).toBeGreaterThan(10)
      
      // Check that buttons exist and have proper structure
      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBeGreaterThan(10)
      
      // Check that the component renders without errors
      expect(wrapper.find('.breadcrumb-nav').exists()).toBe(true)
      expect(wrapper.find('.breadcrumb-list').exists()).toBe(true)
    })
  })

  describe('Component reactivity', () => {
    it('updates when currentPath prop changes', async () => {
      const wrapper = createWrapper({ currentPath: '/documents' })
      
      let breadcrumbItems = wrapper.findAll('.breadcrumb-item')
      expect(breadcrumbItems).toHaveLength(2)
      
      await wrapper.setProps({ currentPath: '/documents/projects/2024' })
      
      breadcrumbItems = wrapper.findAll('.breadcrumb-item')
      expect(breadcrumbItems).toHaveLength(4)
    })

    it('updates aria-current when path changes', async () => {
      const wrapper = createWrapper({ currentPath: '/documents' })
      
      let breadcrumbItems = wrapper.findAll('.breadcrumb-item')
      let currentButton = breadcrumbItems[1].find('button')
      expect(currentButton.attributes('aria-current')).toBe('page')
      
      await wrapper.setProps({ currentPath: '/documents/projects' })
      
      breadcrumbItems = wrapper.findAll('.breadcrumb-item')
      const oldButton = breadcrumbItems[1].find('button')
      const newCurrentButton = breadcrumbItems[2].find('button')
      
      expect(oldButton.attributes('aria-current')).toBeUndefined()
      expect(newCurrentButton.attributes('aria-current')).toBe('page')
    })
  })
})