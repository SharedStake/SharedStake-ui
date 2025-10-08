<template>
  <img
    class="logo"
    v-bind:style="{ width: size }"
    v-bind:src="publicPath + 'images/' + src"
    v-bind:alt="alt || 'SharedStake image'"
    v-bind:loading="lazy ? 'lazy' : 'eager'"
    v-bind:decoding="lazy ? 'async' : 'sync'"
    @load="onImageLoad"
    @error="onImageError"
  />
</template>

<script>
export default {
  props: { 
    size: String, 
    src: String, 
    alt: String,
    lazy: {
      type: Boolean,
      default: true
    }
  },
  created: function () {},
  computed: {
    publicPath() {
      return process.env.BASE_URL;
    },
  },
  methods: {
    onImageLoad() {
      // Track successful image loads for performance monitoring
      if (window.gtag) {
        window.gtag('event', 'image_load_success', {
          image_src: this.src,
          event_category: 'Performance'
        });
      }
    },
    onImageError() {
      // Track failed image loads for debugging
      console.warn('Image failed to load:', this.src);
      if (window.gtag) {
        window.gtag('event', 'image_load_error', {
          image_src: this.src,
          event_category: 'Performance'
        });
      }
    }
  }
};
</script>

<style>
.logo {
  object-fit: cover;
}
</style>