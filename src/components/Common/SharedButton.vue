<template>
  <button
    @click="$emit('click')"
    :disabled="disabled"
    class="px-6 py-3 text-xl font-semibold transition-all border-2 border-white rounded-full md:font-medium md:px-8 whitespace-nowrap"
    :class="{
      'md:text-3xl': big,
      'cursor-not-allowed text-gray-400 border-gray-400': disabled,
      'bg-brand-primary hover:bg-transparent hover:text-brand-primary hover:border-brand-primary': !disabled
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
