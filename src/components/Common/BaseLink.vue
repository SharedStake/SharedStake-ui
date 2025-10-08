<template>
  <component
    :is="componentType"
    :to="to"
    :href="href"
    :target="target"
    :rel="rel"
    :class="linkClasses"
    @click="handleClick"
  >
    <slot />
  </component>
</template>

<script>
export default {
  name: "BaseLink",
  props: {
    // Link type
    type: {
      type: String,
      default: "router", // "router", "external", "anchor"
      validator: (value) => ["router", "external", "anchor"].includes(value)
    },
    // Router link props
    to: {
      type: String,
      default: null
    },
    // External link props
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
    // Styling variants
    variant: {
      type: String,
      default: "default",
      validator: (value) => ["default", "button", "footer", "dropdown"].includes(value)
    },
    // Size variants
    size: {
      type: String,
      default: "medium",
      validator: (value) => ["small", "medium", "large"].includes(value)
    },
    // Custom classes
    customClass: {
      type: String,
      default: ""
    }
  },
  computed: {
    componentType() {
      if (this.type === "router" && this.to) {
        return "router-link";
      }
      return "a";
    },
    linkClasses() {
      const baseClasses = "transition-all duration-100";
      const variantClasses = this.getVariantClasses();
      const sizeClasses = this.getSizeClasses();
      
      return [
        baseClasses,
        variantClasses,
        sizeClasses,
        this.customClass
      ].filter(Boolean).join(" ");
    },
    externalProps() {
      if (this.type === "external") {
        return {
          target: this.target || "_blank",
          rel: this.rel || "noopener noreferrer"
        };
      }
      return {};
    }
  },
  methods: {
    getVariantClasses() {
      const variantMap = {
        default: "text-white hover:text-brand-primary",
        button: "px-4 py-2 text-sm font-semibold border border-white rounded-full hover:bg-gray-800",
        footer: "text-white opacity-67 hover:opacity-100",
        dropdown: "flex items-center gap-1 px-4 py-2 text-base font-semibold text-white hover:text-brand-primary"
      };
      return variantMap[this.variant] || variantMap.default;
    },
    getSizeClasses() {
      const sizeMap = {
        small: "text-sm",
        medium: "text-base",
        large: "text-lg"
      };
      return sizeMap[this.size] || sizeMap.medium;
    },
    handleClick(event) {
      this.$emit("click", event);
    }
  }
};
</script>