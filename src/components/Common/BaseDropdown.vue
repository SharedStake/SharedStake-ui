<template>
  <div class="relative py-2 cursor-pointer group">
    <div 
      :class="triggerClasses"
      @click="handleTriggerClick"
    >
      <slot name="trigger">
        <span>{{ label }}</span>
        <DropdownArrow v-if="showArrow" />
      </slot>
    </div>
    
    <DropdownGroup v-if="showDropdown">
      <slot name="content" />
    </DropdownGroup>
  </div>
</template>

<script>
import DropdownGroup from "../Navigation/DropdownGroup.vue";
import DropdownArrow from "../Navigation/DropdownArrow.vue";

export default {
  name: "BaseDropdown",
  components: {
    DropdownGroup,
    DropdownArrow
  },
  props: {
    label: {
      type: String,
      default: ""
    },
    showArrow: {
      type: Boolean,
      default: true
    },
    triggerClass: {
      type: String,
      default: ""
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      showDropdown: false
    };
  },
  computed: {
    triggerClasses() {
      const baseClasses = "flex items-center gap-1 px-6 py-2 text-base font-semibold text-white transition-all duration-100 whitespace-nowrap";
      const disabledClasses = this.disabled ? "disabled-dropdown-item" : "";
      
      return [
        baseClasses,
        disabledClasses,
        this.triggerClass
      ].filter(Boolean).join(" ");
    }
  },
  mounted() {
    // Close dropdown when clicking outside
    document.addEventListener("click", this.handleOutsideClick);
  },
  beforeDestroy() {
    document.removeEventListener("click", this.handleOutsideClick);
  },
  methods: {
    handleTriggerClick() {
      if (!this.disabled) {
        this.showDropdown = !this.showDropdown;
        this.$emit("toggle", this.showDropdown);
      }
    },
    handleOutsideClick(event) {
      if (!this.$el.contains(event.target)) {
        this.showDropdown = false;
      }
    }
  }
};
</script>

<style scoped>
.disabled-dropdown-item {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}
</style>