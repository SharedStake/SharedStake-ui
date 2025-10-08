<template>
  <div class="lazy-image-container" :style="{ minHeight: placeholderHeight }">
    <img
      v-if="loaded"
      :src="src"
      :alt="alt"
      :class="imageClass"
      @load="onLoad"
      @error="onError"
    />
    <div
      v-else
      :class="placeholderClass"
      :style="{ height: placeholderHeight }"
    >
      <div class="animate-pulse bg-gray-700 rounded w-full h-full flex items-center justify-center">
        <svg class="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path>
        </svg>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LazyImage',
  props: {
    src: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      default: ''
    },
    imageClass: {
      type: String,
      default: ''
    },
    placeholderClass: {
      type: String,
      default: ''
    },
    placeholderHeight: {
      type: String,
      default: '200px'
    },
    rootMargin: {
      type: String,
      default: '50px'
    }
  },
  data() {
    return {
      loaded: false,
      observer: null
    };
  },
  mounted() {
    this.setupIntersectionObserver();
  },
  beforeDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  },
  methods: {
    setupIntersectionObserver() {
      if (!('IntersectionObserver' in window)) {
        // Fallback for browsers that don't support IntersectionObserver
        this.loaded = true;
        return;
      }

      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              this.loaded = true;
              this.observer.unobserve(entry.target);
            }
          });
        },
        {
          rootMargin: this.rootMargin
        }
      );

      this.observer.observe(this.$el);
    },
    onLoad() {
      this.$emit('load');
    },
    onError() {
      this.$emit('error');
    }
  }
};
</script>

<style scoped>
.lazy-image-container {
  position: relative;
  overflow: hidden;
}

.lazy-image-container img {
  width: 100%;
  height: auto;
  transition: opacity 0.3s ease-in-out;
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>