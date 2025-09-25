import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import DeleteConfirmModal from '../DeleteConfirmModal.vue'

// Mock fetch
global.fetch = vi.fn()

describe('DeleteConfirmModal', () => {
  let wrapper
  let store
  let mockItems

  beforeEach(() => {
    // Reset fetch mock
    fetch.mockClear()

    // Create mock store
    store = createStore({
      state: {
        user: { role: 'USER' }
      },
      getters: {
        isAdmin: (state) => state.user?.role === 'ADMIN'
      }
    })

    // Mock items to delete
    mockItems = [
      {
        name: 'test-file.txt',
        path: '/test/test-file.txt',
        is_directory: false,
        size: 1024
      }
    ]
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  it('should render correctly with items', () => {
    wrapper = mount(DeleteConfirmModal, {
      props: {
        items: mockItems
      },
      global: {
        plugins: [store]
      }
    })

    expect(wrapper.find('h3').text()).toContain('Confirmer la suppression')
    expect(wrapper.text()).toContain('test-file.txt')
  })

  it('should show confirmation checkbox for multiple items', () => {
    const multipleItems = [
      ...mockItems,
      {
        name: 'test-file2.txt',
        path: '/test/test-file2.txt',
        is_directory: false,
        size: 2048
      }
    ]

    wrapper = mount(DeleteConfirmModal, {
      props: {
        items: multipleItems
      },
      global: {
        plugins: [store]
      }
    })

    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Je confirme vouloir supprimer ces 2 éléments')
  })

  it('should call correct delete endpoint', async () => {
    // Mock successful response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    })

    wrapper = mount(DeleteConfirmModal, {
      props: {
        items: mockItems
      },
      global: {
        plugins: [store]
      }
    })

    // Click delete button
    await wrapper.find('.btn-error').trigger('click')

    expect(fetch).toHaveBeenCalledWith('/nas/delete', {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer null',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        path: '/test/test-file.txt'
      })
    })
  })

  it('should handle permission errors correctly', async () => {
    // Mock permission denied response
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: 'Forbidden'
    })

    wrapper = mount(DeleteConfirmModal, {
      props: {
        items: mockItems
      },
      global: {
        plugins: [store]
      }
    })

    // Click delete button
    await wrapper.find('.btn-error').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Permission de suppression refusée')
  })

  it('should emit confirmed event on successful deletion', async () => {
    // Mock successful response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    })

    wrapper = mount(DeleteConfirmModal, {
      props: {
        items: mockItems
      },
      global: {
        plugins: [store]
      }
    })

    // Click delete button
    await wrapper.find('.btn-error').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('confirmed')).toBeTruthy()
    expect(wrapper.emitted('confirmed')[0][0]).toEqual(mockItems)
  })

  it('should emit close event when cancel is clicked', async () => {
    wrapper = mount(DeleteConfirmModal, {
      props: {
        items: mockItems
      },
      global: {
        plugins: [store]
      }
    })

    await wrapper.find('.btn-outline').trigger('click')

    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('should disable delete button when loading', async () => {
    // Mock a slow response
    fetch.mockImplementationOnce(() => new Promise(resolve => {
      setTimeout(() => resolve({
        ok: true,
        json: async () => ({ success: true })
      }), 100)
    }))

    wrapper = mount(DeleteConfirmModal, {
      props: {
        items: mockItems
      },
      global: {
        plugins: [store]
      }
    })

    const deleteButton = wrapper.find('.btn-error')
    
    // Click delete button
    await deleteButton.trigger('click')
    await wrapper.vm.$nextTick()

    // Button should be disabled while loading
    expect(deleteButton.attributes('disabled')).toBeDefined()
    expect(wrapper.find('.loading-spinner').exists()).toBe(true)
  })
})