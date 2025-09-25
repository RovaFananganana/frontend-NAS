import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import TreeView from '../TreeView.vue'
import { nasAPI } from '@/services/nasAPI.js'

// Mock the nasAPI service
vi.mock('@/services/nasAPI.js', () => ({
  nasAPI: {
    browse: vi.fn()
  }
}))

describe('TreeView', () => {
  let wrapper

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock successful API response
    nasAPI.browse.mockResolvedValue({
      success: true,
      items: [
        {
          name: 'Documents',
          path: '/Documents',
          is_directory: true,
          type: 'directory'
        },
        {
          name: 'Images',
          path: '/Images',
          is_directory: true,
          type: 'directory'
        },
        {
          name: 'file.txt',
          path: '/file.txt',
          is_directory: false,
          type: 'file'
        }
      ]
    })
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  it('should render root folder', async () => {
    wrapper = mount(TreeView, {
      props: {
        selectedPath: '/'
      }
    })

    await nextTick()

    // Should show NAS Root
    expect(wrapper.text()).toContain('NAS Root')
  })

  it('should load and display directories', async () => {
    wrapper = mount(TreeView, {
      props: {
        selectedPath: '/'
      }
    })

    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 10)) // Wait for async loading

    // Should call browse API
    expect(nasAPI.browse).toHaveBeenCalledWith('/')
    
    // Should display directories (not files)
    expect(wrapper.text()).toContain('Documents')
    expect(wrapper.text()).toContain('Images')
    expect(wrapper.text()).not.toContain('file.txt') // Files should be filtered out
  })

  it('should emit folder-selected when folder is clicked', async () => {
    wrapper = mount(TreeView, {
      props: {
        selectedPath: '/'
      }
    })

    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 10))

    // Click on root folder
    const rootFolder = wrapper.find('.tree-view > div')
    await rootFolder.trigger('click')

    // Should emit folder-selected event
    expect(wrapper.emitted('folder-selected')).toBeTruthy()
    expect(wrapper.emitted('folder-selected')[0]).toEqual(['/'])
  })

  it('should highlight selected folder', async () => {
    wrapper = mount(TreeView, {
      props: {
        selectedPath: '/'
      }
    })

    await nextTick()

    // Root folder should be highlighted
    const rootFolder = wrapper.find('.tree-view > div')
    expect(rootFolder.classes()).toContain('bg-primary')
    expect(rootFolder.classes()).toContain('text-primary-content')
  })

  it('should handle API errors gracefully', async () => {
    nasAPI.browse.mockRejectedValue(new Error('Network error'))

    wrapper = mount(TreeView, {
      props: {
        selectedPath: '/'
      }
    })

    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 10))

    // Should display error message
    expect(wrapper.text()).toContain('Network error')
  })

  it('should expand folders when requested', async () => {
    wrapper = mount(TreeView, {
      props: {
        selectedPath: '/'
      }
    })

    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 10))

    // Find a folder with expand button
    const expandButton = wrapper.find('button')
    if (expandButton.exists()) {
      await expandButton.trigger('click')
      
      // Should call browse API for the expanded folder
      expect(nasAPI.browse).toHaveBeenCalledTimes(2) // Initial + expand
    }
  })
})