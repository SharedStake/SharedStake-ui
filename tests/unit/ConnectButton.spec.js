import { mount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import ConnectButton from '@/components/Common/ConnectButton.vue';
import { createMockStore } from '../utils/web3-mocks';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('ConnectButton.vue', () => {
  let wrapper;
  let store;
  let actions;

  beforeEach(() => {
    actions = {
      setAddress: jest.fn()
    };

    store = new Vuex.Store(createMockStore({
      getters: {
        userAddress: () => null
      },
      actions
    }));

    wrapper = mount(ConnectButton, {
      localVue,
      store
    });
  });

  afterEach(() => {
    wrapper.destroy();
  });

  describe('Rendering', () => {
    it('renders "Connect Wallet" when no user address', () => {
      expect(wrapper.text()).toBe('Connect Wallet');
    });

    it('renders truncated address when user is connected', async () => {
      const mockAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6';
      
      store = new Vuex.Store(createMockStore({
        getters: {
          userAddress: () => mockAddress
        },
        actions
      }));

      wrapper = mount(ConnectButton, {
        localVue,
        store
      });

      await wrapper.vm.$nextTick();
      
      expect(wrapper.text()).toBe('0x74...d8b6');
    });

    it('applies correct CSS classes when not connected', () => {
      expect(wrapper.classes()).toContain('btn-connect');
      expect(wrapper.classes()).toContain('btn-animated');
    });

    it('removes animated class when connected', async () => {
      const mockAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6';
      
      store = new Vuex.Store(createMockStore({
        getters: {
          userAddress: () => mockAddress
        },
        actions
      }));

      wrapper = mount(ConnectButton, {
        localVue,
        store
      });

      await wrapper.vm.$nextTick();
      
      expect(wrapper.classes()).toContain('btn-connect');
      expect(wrapper.classes()).not.toContain('btn-animated');
    });
  });

  describe('User Interactions', () => {
    it('calls setAddress action when clicked and not connected', async () => {
      await wrapper.trigger('click');
      
      expect(actions.setAddress).toHaveBeenCalledTimes(1);
    });

    it('does not call setAddress when already connected', async () => {
      const mockAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6';
      
      store = new Vuex.Store(createMockStore({
        getters: {
          userAddress: () => mockAddress
        },
        actions
      }));

      wrapper = mount(ConnectButton, {
        localVue,
        store
      });

      await wrapper.trigger('click');
      
      expect(actions.setAddress).not.toHaveBeenCalled();
    });

    it('handles async setAddress action', async () => {
      actions.setAddress.mockResolvedValue();
      
      await wrapper.trigger('click');
      
      expect(actions.setAddress).toHaveBeenCalledTimes(1);
    });

    it('handles setAddress action errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      actions.setAddress.mockRejectedValue(new Error('Connection failed'));
      
      await wrapper.trigger('click');
      
      expect(actions.setAddress).toHaveBeenCalledTimes(1);
      
      consoleError.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('has correct button type', () => {
      expect(wrapper.attributes('type')).toBe('button');
    });

    it('has proper button semantics', () => {
      expect(wrapper.element.tagName).toBe('BUTTON');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty address string', async () => {
      store = new Vuex.Store(createMockStore({
        getters: {
          userAddress: () => ''
        },
        actions
      }));

      wrapper = mount(ConnectButton, {
        localVue,
        store
      });

      await wrapper.vm.$nextTick();
      
      expect(wrapper.text()).toBe('Connect Wallet');
    });

    it('handles very short address', async () => {
      const shortAddress = '0x123';
      
      store = new Vuex.Store(createMockStore({
        getters: {
          userAddress: () => shortAddress
        },
        actions
      }));

      wrapper = mount(ConnectButton, {
        localVue,
        store
      });

      await wrapper.vm.$nextTick();
      
      // Should handle gracefully without crashing
      expect(wrapper.text()).toContain('0x12');
    });
  });
});