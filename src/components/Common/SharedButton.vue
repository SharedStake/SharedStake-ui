<template>
  <BaseButton
    :disabled="disabled"
    :size="big ? 'large' : 'medium'"
    variant="primary"
    @click="$emit('click')"
  >
    <slot />
  </BaseButton>
</template>
<script>
import BaseButton from './BaseButton.vue';

export default {
  name: "SharedButton",
  components: { BaseButton },
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
