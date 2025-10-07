import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'

const createTestPinia = () => {
  return createPinia()
}

// Sample test to demonstrate testing setup
describe('Testing Infrastructure', () => {
  it('should have working test environment', () => {
    expect(true).toBe(true)
  })

  it('should be able to create Pinia store', () => {
    const pinia = createTestPinia()
    expect(pinia).toBeDefined()
  })

  it('should have mocked global objects', () => {
    expect(global.ethers).toBeDefined()
    expect(global.ethers.providers).toBeDefined()
    expect(window.ethereum).toBeDefined()
  })
})

// Example component test (you can replace this with actual component tests)
describe('Example Component Test', () => {
  it('should render a simple component', () => {
    const pinia = createTestPinia()
    
    const TestComponent = {
      template: '<div class="test-component">Hello World</div>'
    }

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [pinia]
      }
    })

    expect(wrapper.find('.test-component').text()).toBe('Hello World')
  })
})