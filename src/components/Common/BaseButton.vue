<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="buttonClasses"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<script>
export default {
  name: 'BaseButton',
  props: {
    variant: {
      type: String,
      default: 'primary',
      validator: (value) => ['primary', 'connect', 'stake', 'secondary'].includes(value)
    },
    size: {
      type: String,
      default: 'medium',
      validator: (value) => ['small', 'medium', 'large'].includes(value)
    },
    disabled: {
      type: Boolean,
      default: false
    },
    animated: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      default: 'button'
    }
  },
  computed: {
    buttonClasses() {
      const baseClasses = 'font-semibold transition-all duration-300 border-2 rounded-full whitespace-nowrap';
      
      const variantClasses = {
        primary: 'px-6 py-3 text-xl border-white bg-brand-primary hover:bg-transparent hover:text-brand-primary hover:border-brand-primary',
        connect: 'px-6 py-3 text-lg border-3 border-double border-transparent bg-gradient-to-r from-brand-primary to-blue-400 hover:brightness-110',
        stake: 'px-6 py-3 text-base border border-gray-300 bg-gray-800 text-white hover:bg-gray-700',
        secondary: 'px-4 py-2 text-sm border border-white hover:bg-gray-800'
      };
      
      const sizeClasses = {
        small: 'px-3 py-1 text-sm',
        medium: 'px-6 py-3 text-base',
        large: 'px-8 py-4 text-xl'
      };
      
      const stateClasses = this.disabled 
        ? 'cursor-not-allowed text-gray-400 border-gray-400 opacity-50' 
        : 'cursor-pointer';
      
      const animationClasses = this.animated ? 'animate-pulse' : '';
      
      return [
        baseClasses,
        variantClasses[this.variant],
        sizeClasses[this.size],
        stateClasses,
        animationClasses
      ].filter(Boolean).join(' ');
    }
  }
};
</script>

<style scoped>
/* Connect button specific styles */
.bg-gradient-to-r {
  background: linear-gradient(rgb(13, 14, 33), rgb(13, 14, 33)),
    radial-gradient(
      circle at left top,
      rgb(250, 82, 160) 0%,
      rgb(37, 167, 219) 100%
    );
  background-origin: border-box;
  background-clip: padding-box, border-box;
  background-size: 100% 100%;
}

.animate-pulse {
  animation: animatedButton 3s ease-out backwards infinite;
}

@keyframes animatedButton {
  from {
    background-position: 0px;
  }
  to {
    background-position: 168.6px;
  }
}
</style>