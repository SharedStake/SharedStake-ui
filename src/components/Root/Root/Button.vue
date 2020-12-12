<template>
  <div class="flex_row">
    <div>
      {{ msg }}
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: "Button",
  props: {
    msg: String,
  },
};
</script>

<style scoped>
</style>
