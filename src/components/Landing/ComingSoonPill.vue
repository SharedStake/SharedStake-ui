<template>
  <button
    type="button"
    disabled
    :aria-label="resolvedAriaLabel"
  >
    <span>{{ label }}</span>
    <div class="text-xs mt-1">
      {{ subLabel }}
    </div>
  </button>
</template>

<script>
export default {
  props: {
    label: {
      type: String,
      required: true,
    },
    ariaLabel: {
      type: String,
      default: "",
    },
    subLabel: {
      type: String,
      default: "Coming Soon",
    },
  },
  computed: {
    resolvedAriaLabel() {
      if (this.ariaLabel) return this.ariaLabel;
      return `${this.label} is coming soon`;
    },
  },
};
</script>
