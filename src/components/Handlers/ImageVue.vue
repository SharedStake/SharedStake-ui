<template>
  <img
    class="logo"
    v-bind:style="{ width: size }"
    v-bind:src="publicPath + 'images/' + src"
    alt="icon"
  />
</template>

<script>
export default {
  props: { size: String, src: String },
  created: function () {},
  computed: {
    publicPath() {
      return process.env.BASE_URL;
    },
  },
};
</script>

<style>
.logo {
  object-fit: cover;
}
</style>