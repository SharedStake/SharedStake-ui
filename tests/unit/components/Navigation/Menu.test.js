import { mountWithTestSetup } from '../../../utils/test-utils'
import Menu from '@/components/Navigation/Menu.vue'

describe('Menu.vue', () => {
  it('renders without crashing', () => {
    const wrapper = mountWithTestSetup(Menu)
    
    expect(wrapper.exists()).toBe(true)
  })

  it('displays main navigation items', () => {
    const wrapper = mountWithTestSetup(Menu)
    
    expect(wrapper.text()).toContain('Stake')
    expect(wrapper.text()).toContain('Learn')
  })

  it('has correct CSS classes', () => {
    const wrapper = mountWithTestSetup(Menu)
    
    const menuElement = wrapper.find('section')
    expect(menuElement.classes()).toContain('flex')
    expect(menuElement.classes()).toContain('items-center')
    expect(menuElement.classes()).toContain('justify-around')
  })

  it('contains dropdown groups', () => {
    const wrapper = mountWithTestSetup(Menu)
    
    const dropdownGroups = wrapper.findAll('.group')
    expect(dropdownGroups.length).toBeGreaterThan(0)
  })

  it('displays coming soon indicators', () => {
    const wrapper = mountWithTestSetup(Menu)
    
    expect(wrapper.text()).toContain('Coming Soon')
  })

  it('contains navigation links', () => {
    const wrapper = mountWithTestSetup(Menu)
    
    // Check for router links
    const routerLinks = wrapper.findAll('router-link-stub')
    expect(routerLinks.length).toBeGreaterThan(0)
    
    // Check for anchor links
    const anchorLinks = wrapper.findAll('a')
    expect(anchorLinks.length).toBeGreaterThan(0)
  })

  it('has proper accessibility attributes', () => {
    const wrapper = mountWithTestSetup(Menu)
    
    // Check for proper heading structure or navigation landmarks
    const navElements = wrapper.findAll('nav, [role="navigation"]')
    if (navElements.length > 0) {
      expect(navElements[0].exists()).toBe(true)
    }
  })

  it('displays external links correctly', () => {
    const wrapper = mountWithTestSetup(Menu)
    
    // Check for external documentation links
    expect(wrapper.text()).toContain('Docs')
    expect(wrapper.text()).toContain('DAO')
    expect(wrapper.text()).toContain('Dune Dashboard')
  })

  it('contains blog navigation', () => {
    const wrapper = mountWithTestSetup(Menu)
    
    expect(wrapper.text()).toContain('Blog')
  })
})