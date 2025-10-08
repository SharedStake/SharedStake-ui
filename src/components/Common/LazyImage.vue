<template>
  <div 
    :class="containerClass"
    :style="containerStyle"
  >
    <img
      ref="imageRef"
      :class="imageClass"
      :alt="alt"
      :title="title"
      :style="imageStyle"
      @load="onLoad"
      @error="onError"
    />
    
    <!-- Loading spinner -->
    <div 
      v-if="isLoading" 
      class="lazy-spinner"
    ></div>
    
    <!-- Progress bar -->
    <div 
      v-if="showProgress && isLoading" 
      class="lazy-progress"
      :style="{ width: progress + '%' }"
    ></div>
    
    <!-- Error state -->
    <div 
      v-if="hasError" 
      class="lazy-error-overlay"
    >
      <span class="error-icon">⚠️</span>
      <span class="error-text">Failed to load image</span>
    </div>
  </div>
</template>

<script>
import { addLazyLoading, removeLazyLoading } from '@/utils/lazyLoading.js';

export default {
  name: 'LazyImage',
  props: {
    src: {
      type: String,
      required: true
    },
    srcset: {
      type: String,
      default: null
    },
    alt: {
      type: String,
      default: ''
    },
    title: {
      type: String,
      default: null
    },
    width: {
      type: [String, Number],
      default: null
    },
    height: {
      type: [String, Number],
      default: null
    },
    aspectRatio: {
      type: String,
      default: null, // '16:9', '4:3', '1:1', etc.
      validator: (value) => {
        return !value || /^\d+:\d+$/.test(value);
      }
    },
    placeholder: {
      type: String,
      default: null
    },
    showProgress: {
      type: Boolean,
      default: false
    },
    animation: {
      type: String,
      default: 'fade-in', // 'fade-in', 'slide-up', 'scale-in', 'none'
      validator: (value) => {
        return ['fade-in', 'slide-up', 'scale-in', 'none'].includes(value);
      }
    },
    threshold: {
      type: Number,
      default: 0.01
    },
    rootMargin: {
      type: String,
      default: '50px 0px'
    }
  },
  data() {
    return {
      isLoading: false,
      isLoaded: false,
      hasError: false,
      progress: 0
    };
  },
  computed: {
    containerClass() {
      return [
        'lazy-image-container',
        {
          'lazy-loading': this.isLoading,
          'lazy-loaded': this.isLoaded,
          'lazy-error': this.hasError,
          [`lazy-${this.animation}`]: this.animation !== 'none' && this.isLoaded
        }
      ];
    },
    imageClass() {
      return [
        'lazy-image',
        {
          'lazy-loading': this.isLoading,
          'lazy-loaded': this.isLoaded,
          'lazy-error': this.hasError
        }
      ];
    },
    containerStyle() {
      const style = {};
      
      if (this.aspectRatio) {
        const [width, height] = this.aspectRatio.split(':');
        const ratio = (height / width) * 100;
        style.paddingBottom = `${ratio}%`;
        style.position = 'relative';
        style.overflow = 'hidden';
      }
      
      if (this.width) {
        style.width = typeof this.width === 'number' ? `${this.width}px` : this.width;
      }
      
      if (this.height && !this.aspectRatio) {
        style.height = typeof this.height === 'number' ? `${this.height}px` : this.height;
      }
      
      return style;
    },
    imageStyle() {
      const style = {};
      
      if (this.aspectRatio) {
        style.position = 'absolute';
        style.top = '0';
        style.left = '0';
        style.width = '100%';
        style.height = '100%';
        style.objectFit = 'cover';
      }
      
      if (this.placeholder) {
        style.backgroundImage = `url(${this.placeholder})`;
        style.backgroundSize = 'cover';
        style.backgroundPosition = 'center';
      }
      
      return style;
    }
  },
  mounted() {
    this.setupLazyLoading();
  },
  beforeUnmount() {
    this.cleanup();
  },
  methods: {
    setupLazyLoading() {
      if (this.$refs.imageRef) {
        // Set placeholder
        this.$refs.imageRef.src = this.placeholder || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmM2Y0ZjYiLz48L3N2Zz4=';
        
        // Add lazy loading
        addLazyLoading(this.$refs.imageRef, this.src, this.srcset);
        
        // Set loading state
        this.isLoading = true;
        
        // Simulate progress if enabled
        if (this.showProgress) {
          this.simulateProgress();
        }
      }
    },
    simulateProgress() {
      const interval = setInterval(() => {
        if (this.progress < 90) {
          this.progress += Math.random() * 10;
        }
        
        if (this.isLoaded || this.hasError) {
          clearInterval(interval);
          this.progress = 100;
        }
      }, 100);
    },
    onLoad() {
      this.isLoading = false;
      this.isLoaded = true;
      this.hasError = false;
      this.progress = 100;
      
      this.$emit('load', {
        src: this.src,
        element: this.$refs.imageRef
      });
    },
    onError() {
      this.isLoading = false;
      this.hasError = true;
      this.isLoaded = false;
      
      this.$emit('error', {
        src: this.src,
        element: this.$refs.imageRef
      });
    },
    cleanup() {
      if (this.$refs.imageRef) {
        removeLazyLoading(this.$refs.imageRef);
      }
    },
    // Public methods
    load() {
      if (this.$refs.imageRef && !this.isLoaded && !this.hasError) {
        this.$refs.imageRef.src = this.src;
        if (this.srcset) {
          this.$refs.imageRef.srcset = this.srcset;
        }
      }
    },
    reload() {
      this.hasError = false;
      this.isLoaded = false;
      this.isLoading = true;
      this.progress = 0;
      
      this.setupLazyLoading();
    }
  }
};
</script>

<style scoped>
.lazy-image-container {
  position: relative;
  display: inline-block;
  overflow: hidden;
}

.lazy-image {
  display: block;
  max-width: 100%;
  height: auto;
}

.lazy-error-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #ef4444;
  background: rgba(255, 255, 255, 0.9);
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
}

.error-icon {
  display: block;
  font-size: 16px;
  margin-bottom: 4px;
}

.error-text {
  display: block;
  font-weight: 500;
}

/* Animation classes */
.lazy-fade-in {
  animation: lazy-fade-in 0.5s ease-in-out;
}

.lazy-slide-up {
  animation: lazy-slide-up 0.6s ease-out;
}

.lazy-scale-in {
  animation: lazy-scale-in 0.4s ease-out;
}

@keyframes lazy-fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes lazy-slide-up {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes lazy-scale-in {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .lazy-error-overlay {
    background: rgba(0, 0, 0, 0.9);
    color: #fca5a5;
  }
}
</style>