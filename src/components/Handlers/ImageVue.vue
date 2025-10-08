<template>
  <img
    class="logo"
    :style="{ width: size }"
    :src="publicPath + 'images/' + src"
    alt="icon"
  >
</template>

<script>
export default {
  props: { size: String, src: String },
  computed: {
    publicPath() {
      return process.env.BASE_URL;
    },
  },
  created: function () {},
};
</script>

<style>
.logo {
  object-fit: cover;
}
</style>