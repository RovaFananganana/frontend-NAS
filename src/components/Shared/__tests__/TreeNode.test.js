import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TreeNode from '../TreeNode.vue'

describe('TreeNode', () => {
  const mockNode = {
    name: 'Documents',
    path: '/Documents',
    type: 'directory',
    is_directory: true,
    children: [],
    loaded: false,
    loading: false,
    hasChildren: true
  }

  it('should render node name and folder icon', () => {
    const wrapper = mount(TreeNode, {
      props: {
        node: mockNode,
        selectedPath: '/',
        expandedPaths: new Set(),
        level: 0
      }
    })

    expect(wrapper.text()).toContain('Documents')
    expect(wrapper.find('.fa-folder').exists()).toBe(true)
  })

  it('should highlight selected node', () => {
    const wrapper = mount(TreeNode, {
      props: {
        node: mockNode,
        selectedPath: '/Documents',
        expandedPaths: new Set(),
        level: 0
      }
    })

    const nodeDiv = wrapper.find('.flex.items-center')
    expect(nodeDiv.classes()).toContain('bg-primary')
    expect(nodeDiv.classes()).toContain('text-primary-content')
  })

  it('should emit select event when clicked', async () => {
    const wrapper = mount(TreeNode, {
      props: {
        node: mockNode,
        selectedPath: '/',
        expandedPaths: new Set(),
        level: 0
      }
    })

    await wrapper.find('.flex.items-center').trigger('click')

    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')[0]).toEqual(['/Documents'])
  })

  it('should show expand button for nodes with children', () => {
    const wrapper = mount(TreeNode, {
      props: {
        node: mockNode,
        selectedPath: '/',
        expandedPaths: new Set(),
        level: 0
      }
    })

    expect(wrapper.find('button').exists()).toBe(true)
    expect(wrapper.find('.fa-chevron-right').exists()).toBe(true)
  })

  it('should emit expand event when expand button is clicked', async () => {
    const wrapper = mount(TreeNode, {
      props: {
        node: mockNode,
        selectedPath: '/',
        expandedPaths: new Set(),
        level: 0
      }
    })

    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('expand')).toBeTruthy()
    expect(wrapper.emitted('expand')[0]).toEqual(['/Documents', true])
  })

  it('should show loading spinner when node is loading', () => {
    const loadingNode = { ...mockNode, loading: true }
    
    const wrapper = mount(TreeNode, {
      props: {
        node: loadingNode,
        selectedPath: '/',
        expandedPaths: new Set(),
        level: 0
      }
    })

    expect(wrapper.find('.loading-spinner').exists()).toBe(true)
  })

  it('should apply correct indentation based on level', () => {
    const wrapper = mount(TreeNode, {
      props: {
        node: mockNode,
        selectedPath: '/',
        expandedPaths: new Set(),
        level: 2
      }
    })

    const nodeDiv = wrapper.find('.flex.items-center')
    expect(nodeDiv.attributes('style')).toContain('padding-left: 40px') // (2 * 16 + 8)px
  })

  it('should show expanded state correctly', () => {
    const expandedPaths = new Set(['/Documents'])
    
    const wrapper = mount(TreeNode, {
      props: {
        node: mockNode,
        selectedPath: '/',
        expandedPaths,
        level: 0
      }
    })

    expect(wrapper.find('.fa-chevron-down').exists()).toBe(true)
  })
})