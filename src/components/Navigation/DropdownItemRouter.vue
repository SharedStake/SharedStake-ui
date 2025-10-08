<template>
  <router-link
    class="flex items-center gap-1 px-4 py-2 text-base font-semibold text-white transition-all duration-100 whitespace-nowrap hover:text-brand-primary"
    :to="to"
  >
    <slot></slot>
  </router-link>
</template>
<script>
export default {
  props: {
    to: {
      type: String,
      required: true,
    },
  },
};
</script>
