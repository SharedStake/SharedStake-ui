import { mount, createLocalVue } from '@vue/test-utils'
import ImageVue from '@/components/Handlers/ImageVue.vue'

const localVue = createLocalVue()

describe('ImageVue', () => {
  it('renders with correct src and size', () => {
    const wrapper = mount(ImageVue, {
      localVue,
      propsData: {
        src: 'test-image.png',
        size: '100px'
      }
    })

    expect(wrapper.find('img').attributes('src')).toBe('test-image.png')
    expect(wrapper.find('img').attributes('style')).toContain('width: 100px')
  })

  it('applies custom class', () => {
    const wrapper = mount(ImageVue, {
      localVue,
      propsData: {
        src: 'test-image.png',
        size: '100px'
      },
      attrs: {
        class: 'custom-class'
      }
    })

    expect(wrapper.classes()).toContain('custom-class')
  })

  it('handles missing src gracefully', () => {
    const wrapper = mount(ImageVue, {
      localVue,
      propsData: {
        size: '100px'
      }
    })

    expect(wrapper.find('img').exists()).toBe(true)
  })
})