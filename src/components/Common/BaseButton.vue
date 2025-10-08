<template>
  <component
    :is="tag"
    :to="to"
    :href="href"
    :target="target"
    :rel="rel"
    :disabled="disabled"
    :type="type"
    :class="buttonClasses"
    @click="handleClick"
  >
    <slot />
  </component>
</template>

<script>
export default {
  name: "BaseButton",
  props: {
    // Button variants
    variant: {
      type: String,
      default: "primary",
      validator: (value) => ["primary", "secondary", "connect", "animated", "disabled"].includes(value)
    },
    // Size variants
    size: {
      type: String,
      default: "medium",
      validator: (value) => ["small", "medium", "large", "big"].includes(value)
    },
    // Component type
    tag: {
      type: String,
      default: "button",
      validator: (value) => ["button", "router-link", "a"].includes(value)
    },
    // Router link props
    to: {
      type: String,
      default: null
    },
    // Anchor link props
    href: {
      type: String,
      default: null
    },
    target: {
      type: String,
      default: null
    },
    rel: {
      type: String,
      default: null
    },
    // Button props
    type: {
      type: String,
      default: "button"
    },
    disabled: {
      type: Boolean,
      default: false
    },
    // Custom classes
    customClass: {
      type: String,
      default: ""
    }
  },
  computed: {
    buttonClasses() {
      const baseClasses = "font-semibold transition-all duration-300 whitespace-nowrap cursor-pointer";
      const sizeClasses = this.getSizeClasses();
      const variantClasses = this.getVariantClasses();
      const disabledClasses = this.disabled ? "cursor-not-allowed opacity-50 pointer-events-none" : "";
      
      return [
        baseClasses,
        sizeClasses,
        variantClasses,
        disabledClasses,
        this.customClass
      ].filter(Boolean).join(" ");
    }
  },
  methods: {
    getSizeClasses() {
      const sizeMap = {
        small: "px-3 py-1.5 text-sm",
        medium: "px-6 py-3 text-xl md:px-8",
        large: "px-6 py-3 text-xl md:text-2xl md:px-8",
        big: "px-6 py-3 text-xl md:text-3xl md:px-8"
      };
      return sizeMap[this.size] || sizeMap.medium;
    },
    getVariantClasses() {
      const variantMap = {
        primary: "border-2 border-white rounded-full bg-brand-primary hover:bg-transparent hover:text-brand-primary hover:border-brand-primary text-white",
        secondary: "border border-white rounded-full hover:border-brand-primary hover:text-brand-primary text-white",
        connect: "border-3 border-transparent rounded-full bg-gradient-to-r from-pink-500 to-blue-500 text-white hover:brightness-110",
        animated: "border-3 border-transparent rounded-full bg-gradient-to-r from-pink-500 to-blue-500 text-white animate-pulse",
        disabled: "border-2 border-gray-400 rounded-full bg-gray-500 text-gray-400 cursor-not-allowed"
      };
      return variantMap[this.variant] || variantMap.primary;
    },
    handleClick(event) {
      if (this.disabled) {
        event.preventDefault();
        return;
      }
      this.$emit("click", event);
    }
  }
};
</script>

<style scoped>
/* Animation for animated variant */
@keyframes animatedButton {
  from {
    background-position: 0px;
  }
  to {
    background-position: 168.6px;
  }
}

.animate-pulse {
  animation: animatedButton 3s ease-out backwards infinite;
}

/* Hover effects for connect variant */
.bg-gradient-to-r:hover {
  filter: drop-shadow(0px 0px 4px rgba(255, 255, 255, 0.7)) brightness(120%);
}
</style>