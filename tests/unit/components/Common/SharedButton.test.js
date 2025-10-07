import { mount } from '@vue/test-utils'
import SharedButton from '@/components/Common/SharedButton.vue'

describe('SharedButton', () => {
  it('renders with default props', () => {
    const wrapper = mount(SharedButton, {
      slots: {
        default: 'Click me'
      }
    })
    
    expect(wrapper.text()).toBe('Click me')
    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.attributes('type')).toBe('button')
  })

  it('applies big prop classes correctly', () => {
    const wrapper = mount(SharedButton, {
      props: {
        big: true
      },
      slots: {
        default: 'Big Button'
      }
    })
    
    expect(wrapper.classes()).toContain('md:text-3xl')
  })

  it('handles click events', async () => {
    const wrapper = mount(SharedButton, {
      slots: {
        default: 'Click me'
      }
    })
    
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })

  it('can be disabled', () => {
    const wrapper = mount(SharedButton, {
      props: {
        disabled: true
      },
      slots: {
        default: 'Disabled Button'
      }
    })
    
    expect(wrapper.attributes('disabled')).toBeDefined()
    expect(wrapper.classes()).toContain('cursor-not-allowed')
    expect(wrapper.classes()).toContain('text-gray-400')
    expect(wrapper.classes()).toContain('border-gray-400')
  })

  it('applies hover styles when not disabled', () => {
    const wrapper = mount(SharedButton, {
      props: {
        disabled: false
      },
      slots: {
        default: 'Enabled Button'
      }
    })
    
    expect(wrapper.classes()).toContain('bg-brand-primary')
    expect(wrapper.classes()).toContain('hover:bg-transparent')
    expect(wrapper.classes()).toContain('hover:text-brand-primary')
    expect(wrapper.classes()).toContain('hover:border-brand-primary')
  })

  it('has correct base classes', () => {
    const wrapper = mount(SharedButton, {
      slots: {
        default: 'Test Button'
      }
    })
    
    expect(wrapper.classes()).toContain('px-6')
    expect(wrapper.classes()).toContain('py-3')
    expect(wrapper.classes()).toContain('text-xl')
    expect(wrapper.classes()).toContain('font-semibold')
    expect(wrapper.classes()).toContain('transition-all')
    expect(wrapper.classes()).toContain('border-2')
    expect(wrapper.classes()).toContain('border-white')
    expect(wrapper.classes()).toContain('rounded-full')
  })
})