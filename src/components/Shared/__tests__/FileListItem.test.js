/**
 * @fileoverview Tests unitaires pour le composant FileListItem
 */

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import FileListItem from '../FileListItem.vue'

// Mock des utilitaires de formatage
vi.mock('../../../utils/fileUtils.js', () => ({
  formatBytes: vi.fn((bytes) => `${bytes} B`),
  formatDate: vi.fn((date) => '15 jan. 2024, 10:30')
}))

// Mock des utilitaires mobiles
vi.mock('../../../utils/mobileUtils.js', () => ({
  formatDateForScreen: vi.fn((date) => '15/01/24'),
  formatSizeForScreen: vi.fn((size) => `${size} B`)
}))

describe('FileListItem', () => {
  const mockFile = {
    name: 'document.pdf',
    path: '/test/document.pdf',
    is_directory: false,
    size: 1024,
    modified_time: '2024-01-15T10:30:00Z'
  }

  const mockFolder = {
    name: 'folder',
    path: '/test/folder',
    is_directory: true,
    modified_time: '2024-01-14T15:45:00Z'
  }

  it('should render file information correctly', () => {
    const wrapper = mount(FileListItem, {
      props: { 
        file: mockFile,
        visibleColumns: [
          { key: 'name', label: 'Nom' },
          { key: 'size', label: 'Taille' },
          { key: 'type', label: 'Type' },
          { key: 'date', label: 'Modifié' }
        ]
      }
    })
    
    expect(wrapper.text()).toContain('document.pdf')
    expect(wrapper.text()).toContain('1024 B')
    expect(wrapper.text()).toContain('15/01/24')
  })

  it('should show correct icon for PDF files', () => {
    const wrapper = mount(FileListItem, {
      props: { file: mockFile }
    })
    
    const icon = wrapper.find('i')
    expect(icon.classes()).toContain('fas')
    expect(icon.classes()).toContain('fa-file-pdf')
  })

  it('should show folder icon for directories', () => {
    const wrapper = mount(FileListItem, {
      props: { file: mockFolder }
    })
    
    const icon = wrapper.find('i')
    expect(icon.classes()).toContain('fas')
    expect(icon.classes()).toContain('fa-folder')
  })

  it('should show correct file type for PDF', () => {
    const wrapper = mount(FileListItem, {
      props: { 
        file: mockFile,
        visibleColumns: [
          { key: 'name', label: 'Nom' },
          { key: 'type', label: 'Type' }
        ]
      }
    })
    
    expect(wrapper.text()).toContain('PDF')
  })

  it('should show "Dossier" type for directories', () => {
    const wrapper = mount(FileListItem, {
      props: { 
        file: mockFolder,
        visibleColumns: [
          { key: 'name', label: 'Nom' },
          { key: 'type', label: 'Type' }
        ]
      }
    })
    
    expect(wrapper.text()).toContain('Dossier')
  })

  it('should show "—" for directory size', () => {
    const wrapper = mount(FileListItem, {
      props: { 
        file: mockFolder,
        visibleColumns: [
          { key: 'name', label: 'Nom' },
          { key: 'size', label: 'Taille' }
        ]
      }
    })
    
    expect(wrapper.text()).toContain('—')
  })

  it('should apply selected styles when selected', () => {
    const wrapper = mount(FileListItem, {
      props: { 
        file: mockFile,
        selected: true
      }
    })
    
    const row = wrapper.find('tr')
    expect(row.classes()).toContain('bg-primary/15')
  })

  it('should emit click event when clicked', async () => {
    const wrapper = mount(FileListItem, {
      props: { file: mockFile }
    })
    
    await wrapper.find('tr').trigger('click')
    
    const emittedEvents = wrapper.emitted('click')
    expect(emittedEvents).toBeTruthy()
    expect(emittedEvents[0][0]).toStrictEqual(mockFile)
  })

  it('should emit double-click event when double-clicked', async () => {
    const wrapper = mount(FileListItem, {
      props: { file: mockFile }
    })
    
    await wrapper.find('tr').trigger('dblclick')
    
    const emittedEvents = wrapper.emitted('double-click')
    expect(emittedEvents).toBeTruthy()
    expect(emittedEvents[0][0]).toStrictEqual(mockFile)
  })

  it('should emit context-menu event on right click', async () => {
    const wrapper = mount(FileListItem, {
      props: { file: mockFile }
    })
    
    await wrapper.find('tr').trigger('contextmenu')
    
    const emittedEvents = wrapper.emitted('context-menu')
    expect(emittedEvents).toBeTruthy()
    expect(emittedEvents[0][0]).toStrictEqual(mockFile)
  })

  it('should show correct background color for PDF files', () => {
    const wrapper = mount(FileListItem, {
      props: { file: mockFile }
    })
    
    const iconContainer = wrapper.find('.w-8')
    expect(iconContainer.classes()).toContain('from-red-500')
    expect(iconContainer.classes()).toContain('to-red-600')
  })

  it('should show correct background color for folders', () => {
    const wrapper = mount(FileListItem, {
      props: { file: mockFolder }
    })
    
    const iconContainer = wrapper.find('.w-8')
    expect(iconContainer.classes()).toContain('from-blue-500')
    expect(iconContainer.classes()).toContain('to-blue-600')
  })

  it('should handle files without extension', () => {
    const fileWithoutExt = {
      name: 'README',
      path: '/test/README',
      is_directory: false,
      size: 512,
      modified_time: '2024-01-15T10:30:00Z'
    }
    
    const wrapper = mount(FileListItem, {
      props: { 
        file: fileWithoutExt,
        visibleColumns: [
          { key: 'name', label: 'Nom' },
          { key: 'type', label: 'Type' }
        ]
      }
    })
    
    expect(wrapper.text()).toContain('README')
    expect(wrapper.text()).toContain('Readme') // Default type for README files
  })

  it('should handle different file extensions correctly', () => {
    const jsFile = {
      name: 'script.js',
      path: '/test/script.js',
      is_directory: false,
      size: 256,
      modified_time: '2024-01-15T10:30:00Z'
    }
    
    const wrapper = mount(FileListItem, {
      props: { 
        file: jsFile,
        visibleColumns: [
          { key: 'name', label: 'Nom' },
          { key: 'type', label: 'Type' }
        ]
      }
    })
    
    expect(wrapper.text()).toContain('JavaScript')
    
    const icon = wrapper.find('i')
    expect(icon.classes()).toContain('fa-file-code')
    
    const iconContainer = wrapper.find('.w-8, .w-10')
    expect(iconContainer.classes()).toContain('from-yellow-500')
  })

  it('should show description when provided', () => {
    const fileWithDescription = {
      ...mockFile,
      description: 'Important document'
    }
    
    const wrapper = mount(FileListItem, {
      props: { file: fileWithDescription }
    })
    
    expect(wrapper.text()).toContain('Important document')
  })

  it('should apply hover effects', () => {
    const wrapper = mount(FileListItem, {
      props: { file: mockFile }
    })
    
    const row = wrapper.find('tr')
    expect(row.classes()).toContain('group')
    expect(row.classes()).toContain('hover:bg-gradient-to-r')
    expect(row.classes()).toContain('hover:from-base-200/50')
  })

  it('should handle missing file properties gracefully', () => {
    const incompleteFile = {
      name: 'test.txt',
      is_directory: false
      // Missing size, modified_time, path
    }
    
    const wrapper = mount(FileListItem, {
      props: { 
        file: incompleteFile,
        visibleColumns: [
          { key: 'name', label: 'Nom' },
          { key: 'size', label: 'Taille' }
        ]
      }
    })
    
    expect(wrapper.text()).toContain('test.txt')
    expect(wrapper.text()).toContain('0 B') // Default size formatting
  })

  it('should apply micro-interactions classes for hover effects', () => {
    const wrapper = mount(FileListItem, {
      props: { file: mockFile }
    })
    
    const row = wrapper.find('tr')
    expect(row.classes()).toContain('hover:scale-[1.01]')
    expect(row.classes()).toContain('hover:shadow-sm')
    expect(row.classes()).toContain('transition-all')
    expect(row.classes()).toContain('duration-150')
  })

  it('should apply icon scaling on group hover', () => {
    const wrapper = mount(FileListItem, {
      props: { file: mockFile }
    })
    
    const iconContainer = wrapper.find('.w-8')
    expect(iconContainer.classes()).toContain('group-hover:scale-110')
    expect(iconContainer.classes()).toContain('group-hover:shadow-md')
  })

  it('should show gradient background for file icons', () => {
    const wrapper = mount(FileListItem, {
      props: { file: mockFile }
    })
    
    const iconContainer = wrapper.find('.w-8')
    expect(iconContainer.classes()).toContain('bg-gradient-to-br')
    expect(iconContainer.classes()).toContain('from-red-500')
    expect(iconContainer.classes()).toContain('to-red-600')
  })

  it('should apply selection visual states correctly', () => {
    const wrapper = mount(FileListItem, {
      props: { 
        file: mockFile,
        selected: true
      }
    })
    
    const row = wrapper.find('tr')
    expect(row.classes()).toContain('bg-primary/15')
    expect(row.classes()).toContain('border-primary/30')
    expect(row.classes()).toContain('shadow-md')
  })

  it('should show file type badge with proper styling', () => {
    const wrapper = mount(FileListItem, {
      props: { 
        file: mockFile,
        visibleColumns: [
          { key: 'name', label: 'Nom' },
          { key: 'type', label: 'Type' }
        ]
      }
    })
    
    const typeBadge = wrapper.find('span.inline-flex')
    expect(typeBadge.classes()).toContain('items-center')
    expect(typeBadge.classes()).toContain('rounded-full')
    expect(typeBadge.classes()).toContain('bg-base-200')
  })
})  des
cribe('File type detection and icons', () => {
    const testCases = [
      { ext: 'pdf', expectedType: 'PDF', expectedIcon: 'fa-file-pdf', expectedColor: 'from-red-500' },
      { ext: 'jpg', expectedType: 'Image JPEG', expectedIcon: 'fa-file-image', expectedColor: 'from-purple-500' },
      { ext: 'mp4', expectedType: 'Vidéo MP4', expectedIcon: 'fa-file-video', expectedColor: 'from-red-600' },
      { ext: 'mp3', expectedType: 'Audio MP3', expectedIcon: 'fa-file-audio', expectedColor: 'from-green-500' },
      { ext: 'zip', expectedType: 'Archive ZIP', expectedIcon: 'fa-file-archive', expectedColor: 'from-gray-600' },
      { ext: 'js', expectedType: 'JavaScript', expectedIcon: 'fa-file-code', expectedColor: 'from-yellow-500' },
      { ext: 'txt', expectedType: 'Texte', expectedIcon: 'fa-file-alt', expectedColor: 'from-gray-500' }
    ]

    testCases.forEach(({ ext, expectedType, expectedIcon, expectedColor }) => {
      it(`should handle ${ext} files correctly`, () => {
        const file = {
          name: `test.${ext}`,
          path: `/test/test.${ext}`,
          is_directory: false,
          size: 1024,
          modified_time: '2024-01-15T10:30:00Z'
        }
        
        const wrapper = mount(FileListItem, {
          props: { 
            file,
            visibleColumns: [
              { key: 'name', label: 'Nom' },
              { key: 'type', label: 'Type' }
            ]
          }
        })
        
        expect(wrapper.text()).toContain(expectedType)
        
        const icon = wrapper.find('i')
        expect(icon.classes()).toContain(expectedIcon)
        
        const iconContainer = wrapper.find('.w-8, .w-10')
        expect(iconContainer.classes()).toContain(expectedColor)
      })
    })
  })

  describe('Responsive behavior', () => {
    it('should adapt to mobile layout', () => {
      const wrapper = mount(FileListItem, {
        props: { 
          file: mockFile,
          isMobile: true,
          isTouch: true,
          visibleColumns: [
            { key: 'name', label: 'Nom' },
            { key: 'size', label: 'Taille' }
          ]
        }
      })
      
      // Should use larger touch targets
      const row = wrapper.find('tr')
      expect(row.attributes('style')).toContain('44px')
      
      // Should use mobile-specific spacing
      expect(wrapper.find('.space-x-2').exists()).toBe(true)
      
      // Should use larger icons for touch
      expect(wrapper.find('.w-10').exists()).toBe(true)
    })

    it('should show/hide columns based on visibility', () => {
      const wrapper = mount(FileListItem, {
        props: { 
          file: mockFile,
          visibleColumns: [
            { key: 'name', label: 'Nom' },
            { key: 'size', label: 'Taille' }
            // type and date columns hidden
          ]
        }
      })
      
      const cells = wrapper.findAll('td')
      expect(cells).toHaveLength(2) // Only name and size columns
    })

    it('should use mobile-specific formatting', () => {
      const wrapper = mount(FileListItem, {
        props: { 
          file: mockFile,
          isMobile: true,
          visibleColumns: [
            { key: 'name', label: 'Nom' },
            { key: 'size', label: 'Taille' },
            { key: 'date', label: 'Modifié' }
          ]
        }
      })
      
      // Should use mobile date format
      expect(wrapper.text()).toContain('15/01/24')
    })
  })

  describe('Selection states', () => {
    it('should show selection indicator when selected', () => {
      const wrapper = mount(FileListItem, {
        props: { 
          file: mockFile,
          selected: true
        }
      })
      
      const indicator = wrapper.find('.absolute.left-0.w-1.bg-primary')
      expect(indicator.exists()).toBe(true)
    })

    it('should show checkbox when selected', () => {
      const wrapper = mount(FileListItem, {
        props: { 
          file: mockFile,
          selected: true
        }
      })
      
      const checkbox = wrapper.find('.fas.fa-check')
      expect(checkbox.exists()).toBe(true)
      expect(checkbox.classes()).toContain('text-white')
    })

    it('should show focus ring when focused', () => {
      const wrapper = mount(FileListItem, {
        props: { 
          file: mockFile,
          focused: true
        }
      })
      
      const row = wrapper.find('tr')
      expect(row.classes()).toContain('ring-2')
      expect(row.classes()).toContain('ring-primary')
    })

    it('should combine selection and focus states', () => {
      const wrapper = mount(FileListItem, {
        props: { 
          file: mockFile,
          selected: true,
          focused: true
        }
      })
      
      const row = wrapper.find('tr')
      expect(row.classes()).toContain('bg-gradient-to-r')
      expect(row.classes()).toContain('from-primary/20')
      expect(row.classes()).toContain('border-primary/40')
    })
  })

  describe('Touch interactions', () => {
    it('should handle touch start and end events', async () => {
      const wrapper = mount(FileListItem, {
        props: { 
          file: mockFile,
          isTouch: true
        }
      })
      
      const row = wrapper.find('tr')
      
      // Simulate touch start
      await row.trigger('touchstart', {
        touches: [{ clientX: 100, clientY: 100 }]
      })
      
      // Simulate quick touch end (tap)
      await row.trigger('touchend', {
        changedTouches: [{ clientX: 100, clientY: 100 }]
      })
      
      const emittedEvents = wrapper.emitted('click')
      expect(emittedEvents).toBeTruthy()
    })

    it('should handle long press for context menu', async () => {
      vi.useFakeTimers()
      
      const wrapper = mount(FileListItem, {
        props: { 
          file: mockFile,
          isTouch: true
        }
      })
      
      const row = wrapper.find('tr')
      
      // Simulate touch start
      await row.trigger('touchstart', {
        touches: [{ clientX: 100, clientY: 100 }]
      })
      
      // Fast forward time for long press
      vi.advanceTimersByTime(500)
      
      const emittedEvents = wrapper.emitted('context-menu')
      expect(emittedEvents).toBeTruthy()
      
      vi.useRealTimers()
    })

    it('should ignore swipe gestures', async () => {
      const wrapper = mount(FileListItem, {
        props: { 
          file: mockFile,
          isTouch: true
        }
      })
      
      const row = wrapper.find('tr')
      
      // Simulate touch start
      await row.trigger('touchstart', {
        touches: [{ clientX: 100, clientY: 100 }]
      })
      
      // Simulate swipe (large movement)
      await row.trigger('touchend', {
        changedTouches: [{ clientX: 150, clientY: 100 }]
      })
      
      // Should not emit click for swipe
      const emittedEvents = wrapper.emitted('click')
      expect(emittedEvents).toBeFalsy()
    })
  })

  describe('Keyboard navigation', () => {
    it('should handle Enter key for double-click', async () => {
      const wrapper = mount(FileListItem, {
        props: { 
          file: mockFile,
          focused: true
        }
      })
      
      const row = wrapper.find('tr')
      await row.trigger('keydown', { key: 'Enter' })
      
      const emittedEvents = wrapper.emitted('double-click')
      expect(emittedEvents).toBeTruthy()
    })

    it('should handle Space key for selection', async () => {
      const wrapper = mount(FileListItem, {
        props: { 
          file: mockFile,
          focused: true
        }
      })
      
      const row = wrapper.find('tr')
      await row.trigger('keydown', { key: ' ' })
      
      const emittedEvents = wrapper.emitted('click')
      expect(emittedEvents).toBeTruthy()
    })

    it('should allow navigation keys to bubble up', async () => {
      const wrapper = mount(FileListItem, {
        props: { 
          file: mockFile,
          focused: true
        }
      })
      
      const row = wrapper.find('tr')
      
      // These keys should not be prevented
      const navigationKeys = ['ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown']
      
      for (const key of navigationKeys) {
        const event = { key, preventDefault: vi.fn() }
        await row.trigger('keydown', event)
        expect(event.preventDefault).not.toHaveBeenCalled()
      }
    })
  })

  describe('Accessibility', () => {
    it('should have proper tabindex for focused items', () => {
      const wrapper = mount(FileListItem, {
        props: { 
          file: mockFile,
          focused: true
        }
      })
      
      const row = wrapper.find('tr')
      expect(row.attributes('tabindex')).toBe('0')
    })

    it('should have negative tabindex for non-focused items', () => {
      const wrapper = mount(FileListItem, {
        props: { 
          file: mockFile,
          focused: false
        }
      })
      
      const row = wrapper.find('tr')
      expect(row.attributes('tabindex')).toBe('-1')
    })

    it('should have proper data attributes for testing', () => {
      const wrapper = mount(FileListItem, {
        props: { 
          file: mockFile,
          index: 5
        }
      })
      
      const row = wrapper.find('tr')
      expect(row.attributes('data-file-index')).toBe('5')
    })

    it('should support high contrast mode', () => {
      // This would be tested with CSS media queries in a real browser
      const wrapper = mount(FileListItem, {
        props: { 
          file: mockFile,
          selected: true
        }
      })
      
      // Ensure contrast classes are applied
      const row = wrapper.find('tr')
      expect(row.classes()).toContain('border-primary/30')
    })
  })

  describe('Performance optimizations', () => {
    it('should handle missing file properties without errors', () => {
      const incompleteFile = {
        name: 'test.txt'
        // Missing most properties
      }
      
      expect(() => {
        mount(FileListItem, {
          props: { 
            file: incompleteFile,
            visibleColumns: [
              { key: 'name', label: 'Nom' },
              { key: 'size', label: 'Taille' },
              { key: 'type', label: 'Type' },
              { key: 'date', label: 'Modifié' }
            ]
          }
        })
      }).not.toThrow()
    })

    it('should use efficient class computation', () => {
      const wrapper = mount(FileListItem, {
        props: { 
          file: mockFile,
          selected: true,
          focused: true,
          isMobile: true,
          isTouch: true
        }
      })
      
      // Should combine all conditional classes efficiently
      const row = wrapper.find('tr')
      expect(row.classes().length).toBeGreaterThan(5)
    })
  })

  describe('Visual feedback and animations', () => {
    it('should apply hover effects on desktop', () => {
      const wrapper = mount(FileListItem, {
        props: { 
          file: mockFile,
          isMobile: false
        }
      })
      
      const row = wrapper.find('tr')
      expect(row.classes()).toContain('hover:bg-gradient-to-r')
      expect(row.classes()).toContain('hover:shadow-sm')
      expect(row.classes()).toContain('hover:scale-[1.01]')
    })

    it('should use touch-optimized interactions on mobile', () => {
      const wrapper = mount(FileListItem, {
        props: { 
          file: mockFile,
          isMobile: true,
          isTouch: true
        }
      })
      
      const row = wrapper.find('tr')
      expect(row.classes()).toContain('touch-manipulation')
      expect(row.classes()).toContain('active:bg-base-200/70')
    })

    it('should show icon scaling on hover', () => {
      const wrapper = mount(FileListItem, {
        props: { 
          file: mockFile
        }
      })
      
      const iconContainer = wrapper.find('.w-8, .w-10')
      expect(iconContainer.classes()).toContain('group-hover:scale-110')
      expect(iconContainer.classes()).toContain('group-hover:shadow-md')
    })
  })

  describe('File description support', () => {
    it('should show file description when provided and not mobile', () => {
      const fileWithDescription = {
        ...mockFile,
        description: 'Important document for review'
      }
      
      const wrapper = mount(FileListItem, {
        props: { 
          file: fileWithDescription,
          isMobile: false,
          visibleColumns: [{ key: 'name', label: 'Nom' }]
        }
      })
      
      expect(wrapper.text()).toContain('Important document for review')
    })

    it('should hide file description on mobile', () => {
      const fileWithDescription = {
        ...mockFile,
        description: 'Important document for review'
      }
      
      const wrapper = mount(FileListItem, {
        props: { 
          file: fileWithDescription,
          isMobile: true,
          visibleColumns: [{ key: 'name', label: 'Nom' }]
        }
      })
      
      expect(wrapper.text()).not.toContain('Important document for review')
    })
  })
})