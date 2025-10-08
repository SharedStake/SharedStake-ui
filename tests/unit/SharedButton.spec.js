import { mount } from '@vue/test-utils';
import SharedButton from '@/components/Common/SharedButton.vue';

describe('SharedButton.vue', () => {
  let wrapper;

  afterEach(() => {
    if (wrapper) {
      wrapper.destroy();
    }
  });

  describe('Rendering', () => {
    it('renders button with default props', () => {
      wrapper = mount(SharedButton, {
        slots: {
          default: 'Click me'
        }
      });

      expect(wrapper.text()).toBe('Click me');
      expect(wrapper.element.tagName).toBe('BUTTON');
      expect(wrapper.attributes('type')).toBe('button');
    });

    it('applies correct CSS classes by default', () => {
      wrapper = mount(SharedButton, {
        slots: {
          default: 'Test Button'
        }
      });

      const classes = wrapper.classes();
      expect(classes).toContain('px-6');
      expect(classes).toContain('py-3');
      expect(classes).toContain('text-xl');
      expect(classes).toContain('font-semibold');
      expect(classes).toContain('border-2');
      expect(classes).toContain('border-white');
      expect(classes).toContain('rounded-full');
    });

    it('applies big variant classes when big prop is true', () => {
      wrapper = mount(SharedButton, {
        propsData: {
          big: true
        },
        slots: {
          default: 'Big Button'
        }
      });

      expect(wrapper.classes()).toContain('md:text-3xl');
    });

    it('applies disabled classes when disabled prop is true', () => {
      wrapper = mount(SharedButton, {
        propsData: {
          disabled: true
        },
        slots: {
          default: 'Disabled Button'
        }
      });

      const classes = wrapper.classes();
      expect(classes).toContain('cursor-not-allowed');
      expect(classes).toContain('text-gray-400');
      expect(classes).toContain('border-gray-400');
    });

    it('applies hover classes when not disabled', () => {
      wrapper = mount(SharedButton, {
        propsData: {
          disabled: false
        },
        slots: {
          default: 'Enabled Button'
        }
      });

      const classes = wrapper.classes();
      expect(classes).toContain('bg-brand-primary');
      expect(classes).toContain('hover:bg-transparent');
      expect(classes).toContain('hover:text-brand-primary');
      expect(classes).toContain('hover:border-brand-primary');
    });
  });

  describe('Props', () => {
    it('has correct default prop values', () => {
      wrapper = mount(SharedButton);

      expect(wrapper.props('disabled')).toBe(false);
      expect(wrapper.props('big')).toBe(false);
    });

    it('accepts disabled prop', () => {
      wrapper = mount(SharedButton, {
        propsData: {
          disabled: true
        }
      });

      expect(wrapper.props('disabled')).toBe(true);
    });

    it('accepts big prop', () => {
      wrapper = mount(SharedButton, {
        propsData: {
          big: true
        }
      });

      expect(wrapper.props('big')).toBe(true);
    });
  });

  describe('User Interactions', () => {
    it('emits click event when clicked', async () => {
      wrapper = mount(SharedButton, {
        slots: {
          default: 'Clickable Button'
        }
      });

      await wrapper.trigger('click');

      expect(wrapper.emitted('click')).toBeTruthy();
      expect(wrapper.emitted('click')).toHaveLength(1);
    });

    it('does not emit click event when disabled', async () => {
      wrapper = mount(SharedButton, {
        propsData: {
          disabled: true
        },
        slots: {
          default: 'Disabled Button'
        }
      });

      await wrapper.trigger('click');

      expect(wrapper.emitted('click')).toBeFalsy();
    });

    it('has disabled attribute when disabled prop is true', () => {
      wrapper = mount(SharedButton, {
        propsData: {
          disabled: true
        }
      });

      expect(wrapper.attributes('disabled')).toBe('disabled');
    });

    it('does not have disabled attribute when disabled prop is false', () => {
      wrapper = mount(SharedButton, {
        propsData: {
          disabled: false
        }
      });

      expect(wrapper.attributes('disabled')).toBeFalsy();
    });
  });

  describe('Slots', () => {
    it('renders default slot content', () => {
      const slotContent = 'Custom Button Text';
      wrapper = mount(SharedButton, {
        slots: {
          default: slotContent
        }
      });

      expect(wrapper.text()).toBe(slotContent);
    });

    it('renders complex slot content', () => {
      const slotContent = '<span>Complex <strong>Button</strong> Content</span>';
      wrapper = mount(SharedButton, {
        slots: {
          default: slotContent
        }
      });

      expect(wrapper.html()).toContain(slotContent);
    });
  });

  describe('Accessibility', () => {
    it('has correct button type attribute', () => {
      wrapper = mount(SharedButton);

      expect(wrapper.attributes('type')).toBe('button');
    });

    it('maintains button semantics when disabled', () => {
      wrapper = mount(SharedButton, {
        propsData: {
          disabled: true
        }
      });

      expect(wrapper.element.tagName).toBe('BUTTON');
      expect(wrapper.attributes('disabled')).toBe('disabled');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty slot content', () => {
      wrapper = mount(SharedButton, {
        slots: {
          default: ''
        }
      });

      expect(wrapper.text()).toBe('');
      expect(wrapper.element.tagName).toBe('BUTTON');
    });

    it('handles multiple rapid clicks', async () => {
      wrapper = mount(SharedButton, {
        slots: {
          default: 'Multi Click Button'
        }
      });

      await wrapper.trigger('click');
      await wrapper.trigger('click');
      await wrapper.trigger('click');

      expect(wrapper.emitted('click')).toHaveLength(3);
    });
  });
});