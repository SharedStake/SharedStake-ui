<template>
  <div class="lazy-image-container" :class="containerClass">
    <!-- Placeholder while loading -->
    <div 
      v-if="!loaded && !error"
      class="lazy-image-placeholder"
      :style="placeholderStyle"
    >
      <div class="loading-spinner" v-if="showSpinner">
        <div class="spinner"></div>
      </div>
    </div>
    
    <!-- Error state -->
    <div 
      v-if="error"
      class="lazy-image-error"
      :style="placeholderStyle"
    >
      <div class="error-content">
        <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        <span class="error-text">Failed to load image</span>
      </div>
    </div>
    
    <!-- Actual image -->
    <picture v-if="loaded && !error">
      <!-- WebP source for modern browsers -->
      <source 
        v-if="webpSrc"
        :srcset="webpSrc"
        type="image/webp"
      >
      
      <!-- Fallback source -->
      <img
        :src="src"
        :alt="alt"
        :class="imageClass"
        :style="imageStyle"
        @load="onImageLoad"
        @error="onImageError"
        loading="lazy"
      >
    </picture>
  </div>
</template>

<script>
// import { imageOptimization } from '@/utils/imageOptimization.js'

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
    width: {
      type: [String, Number],
      default: null
    },
    height: {
      type: [String, Number],
      default: null
    },
    containerClass: {
      type: String,
      default: ''
    },
    imageClass: {
      type: String,
      default: ''
    },
    showSpinner: {
      type: Boolean,
      default: true
    },
    rootMargin: {
      type: String,
      default: '50px 0px'
    },
    threshold: {
      type: Number,
      default: 0.1
    },
    // Enable WebP support
    enableWebP: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      loaded: false,
      error: false,
      observer: null,
      isIntersecting: false
    }
  },
  computed: {
    webpSrc() {
      if (!this.enableWebP || !this.src) return null
      
      // Check if WebP is supported
      if (typeof window === 'undefined') return null
      
      const canvas = document.createElement('canvas')
      const webpSupported = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
      
      if (!webpSupported) return null
      
      // Convert to WebP format
      return this.src.replace(/\.(jpg|jpeg|png)$/i, '.webp')
    },
    placeholderStyle() {
      const style = {}
      if (this.width) style.width = typeof this.width === 'number' ? `${this.width}px` : this.width
      if (this.height) style.height = typeof this.height === 'number' ? `${this.height}px` : this.height
      return style
    },
    imageStyle() {
      const style = {}
      if (this.width) style.width = typeof this.width === 'number' ? `${this.width}px` : this.width
      if (this.height) style.height = typeof this.height === 'number' ? `${this.height}px` : this.height
      return style
    }
  },
  mounted() {
    this.setupIntersectionObserver()
  },
  beforeUnmount() {
    if (this.observer) {
      this.observer.disconnect()
    }
  },
  methods: {
    setupIntersectionObserver() {
      if (typeof window === 'undefined' || !window.IntersectionObserver) {
        // Fallback for browsers without IntersectionObserver
        this.loadImage()
        return
      }
      
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting && !this.loaded && !this.error) {
              this.loadImage()
              this.observer.unobserve(entry.target)
            }
          })
        },
        {
          rootMargin: this.rootMargin,
          threshold: this.threshold
        }
      )
      
      this.observer.observe(this.$el)
    },
    loadImage() {
      // Preload the image
      const img = new Image()
      img.onload = this.onImageLoad
      img.onerror = this.onImageError
      
      // Try WebP first if available, then fallback to original
      if (this.webpSrc) {
        img.src = this.webpSrc
      } else {
        img.src = this.src
      }
    },
    onImageLoad() {
      this.loaded = true
      this.error = false
      this.$emit('load')
    },
    onImageError() {
      // If WebP failed and we haven't tried the original yet, try the original
      if (this.webpSrc && this.src !== this.webpSrc) {
        const img = new Image()
        img.onload = this.onImageLoad
        img.onerror = this.onImageError
        img.src = this.src
        return
      }
      
      this.error = true
      this.loaded = false
      this.$emit('error')
    }
  }
}
</script>

<style scoped>
.lazy-image-container {
  position: relative;
  display: inline-block;
  overflow: hidden;
}

.lazy-image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f3f4f6;
  border-radius: 8px;
  min-height: 200px;
}

.lazy-image-error {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fef2f2;
  border: 2px dashed #fca5a5;
  border-radius: 8px;
  min-height: 200px;
}

.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #dc2626;
}

.error-icon {
  width: 24px;
  height: 24px;
}

.error-text {
  font-size: 14px;
  font-weight: 500;
}

.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Dark mode support */
.dark .lazy-image-placeholder {
  background-color: #374151;
}

.dark .lazy-image-error {
  background-color: #1f2937;
  border-color: #dc2626;
}

.dark .error-content {
  color: #fca5a5;
}

.dark .spinner {
  border-color: #4b5563;
  border-top-color: #60a5fa;
}
</style>