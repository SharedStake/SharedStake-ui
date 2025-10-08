<template>
  <BaseButton
    :variant="disabled ? 'disabled' : 'primary'"
    :size="big ? 'big' : 'large'"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <slot />
  </BaseButton>
</template>
<script>
import BaseButton from "./BaseButton.vue";

export default {
  name: "SharedButton",
  components: {
    BaseButton
  },
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
