import { mount, createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'
import ConnectButton from '@/components/Common/ConnectButton.vue'

const localVue = createLocalVue()
localVue.use(Vuex)

describe('ConnectButton', () => {
  let store
  let actions
  let getters

  beforeEach(() => {
    actions = {
      setAddress: jest.fn()
    }
    
    getters = {
      userAddress: jest.fn()
    }
    
    store = new Vuex.Store({
      actions,
      getters
    })
  })

  it('renders "Connect Wallet" when no user address', () => {
    getters.userAddress.mockReturnValue(null)
    
    const wrapper = mount(ConnectButton, {
      store,
      localVue
    })
    
    expect(wrapper.text()).toBe('Connect Wallet')
    expect(wrapper.classes()).toContain('btn-animated')
  })

  it('renders truncated address when user is connected', () => {
    const mockAddress = '0x1234567890abcdef1234567890abcdef12345678'
    getters.userAddress.mockReturnValue(mockAddress)
    
    const wrapper = mount(ConnectButton, {
      store,
      localVue
    })
    
    expect(wrapper.text()).toBe('0x12...5678')
    expect(wrapper.classes()).not.toContain('btn-animated')
  })

  it('calls setAddress when clicked and no user address', async () => {
    getters.userAddress.mockReturnValue(null)
    actions.setAddress.mockResolvedValue()
    
    const wrapper = mount(ConnectButton, {
      store,
      localVue
    })
    
    await wrapper.trigger('click')
    expect(actions.setAddress).toHaveBeenCalled()
  })

  it('does not call setAddress when clicked and user is already connected', async () => {
    getters.userAddress.mockReturnValue('0x1234567890abcdef1234567890abcdef12345678')
    
    const wrapper = mount(ConnectButton, {
      store,
      localVue
    })
    
    await wrapper.trigger('click')
    expect(actions.setAddress).not.toHaveBeenCalled()
  })

  it('has correct base classes', () => {
    getters.userAddress.mockReturnValue(null)
    
    const wrapper = mount(ConnectButton, {
      store,
      localVue
    })
    
    expect(wrapper.classes()).toContain('text-lg')
    expect(wrapper.classes()).toContain('text-white')
    expect(wrapper.classes()).toContain('btn-connect')
  })

  it('handles short addresses correctly', () => {
    const shortAddress = '0x1234'
    getters.userAddress.mockReturnValue(shortAddress)
    
    const wrapper = mount(ConnectButton, {
      store,
      localVue
    })
    
    // Should still show the full short address
    expect(wrapper.text()).toBe(shortAddress)
  })
})