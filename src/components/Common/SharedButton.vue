<template>
  <button
    @click="$emit('click')"
    :disabled="disabled"
    class="shared-button"
    :class="{
      'shared-button--big': big,
      'shared-button--disabled': disabled,
      'shared-button--primary': !disabled
    }"
    type="button"
  >
    <slot />
  </button>
</template>
<script>
export default {
  name: "Button",
  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
    big: {
      type: Boolean,
      default: false,
    },
  },
};
</script>

<style scoped>
.shared-button {
  @apply px-6 py-3 font-semibold border-2 border-white rounded-full whitespace-nowrap;
  font-size: var(--font-size-xl);
  transition: all var(--transition-normal);
}

.shared-button--big {
  @apply md:px-8;
  font-size: var(--font-size-3xl);
}

.shared-button--disabled {
  @apply cursor-not-allowed text-gray-400 border-gray-400;
  opacity: 0.5;
}

.shared-button--primary {
  background-color: var(--color-brand-primary);
  color: var(--color-white);
}

.shared-button--primary:hover:not(:disabled) {
  background-color: transparent;
  color: var(--color-brand-primary);
  border-color: var(--color-brand-primary);
  transform: scale(0.98);
}

@media (min-width: 768px) {
  .shared-button {
    font-weight: 500;
  }
}
</style>
