<template>
  <router-link
    :to="to"
    class="px-4 py-2 text-sm font-semibold transition-all border border-white rounded-full hover:bg-gray-800"
  >
    <slot />
  </router-link>
</template>

<script>
export default {
  name: "SharedLink",
  props: {
    to: {
      type: String,
      required: true,
    },
  },
};
</script>
