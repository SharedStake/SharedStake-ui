<template>
  <BaseLink
    type="external"
    :href="href"
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
    href: {
      type: String,
      required: true,
    },
  },
};
</script>
