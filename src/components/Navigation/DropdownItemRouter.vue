<template>
  <BaseLink
    type="router"
    :to="to"
    variant="dropdown"
    size="medium"
  >
    <slot></slot>
  </BaseLink>
</template>
<script>
import BaseLink from "../Common/BaseLink.vue";

export default {
  components: {
    BaseLink
  },
  props: {
    to: {
      type: String,
      required: true,
    },
  },
};
</script>
