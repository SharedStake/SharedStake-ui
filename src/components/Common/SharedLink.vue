<template>
  <BaseLink
    type="router"
    :to="to"
    variant="button"
    size="small"
  >
    <slot />
  </BaseLink>
</template>

<script>
import BaseLink from "./BaseLink.vue";

export default {
  name: "SharedLink",
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
