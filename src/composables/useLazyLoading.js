import { ref, onMounted, onUnmounted, watch, computed } from 'vue'

/**
 * Lazy Loading Composable
 * Provides intersection observer functionality for lazy loading images and components
 */
export function useLazyLoading(options = {}) {
  const {
    rootMargin = '50px 0px',
    threshold = 0.1,
    once = true
  } = options

  const isIntersecting = ref(false)
  const hasIntersected = ref(false)
  const observer = ref(null)
  const element = ref(null)

  const setupObserver = () => {
    if (typeof window === 'undefined' || !window.IntersectionObserver) {
      // Fallback for browsers without IntersectionObserver
      isIntersecting.value = true
      hasIntersected.value = true
      return
    }

    observer.value = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          isIntersecting.value = entry.isIntersecting
          
          if (entry.isIntersecting && !hasIntersected.value) {
            hasIntersected.value = true
          }
          
          // If once is true, disconnect after first intersection
          if (once && entry.isIntersecting && observer.value) {
            observer.value.disconnect()
          }
        })
      },
      {
        rootMargin,
        threshold
      }
    )

    if (element.value) {
      observer.value.observe(element.value)
    }
  }

  const disconnect = () => {
    if (observer.value) {
      observer.value.disconnect()
      observer.value = null
    }
  }

  onMounted(() => {
    setupObserver()
  })

  onUnmounted(() => {
    disconnect()
  })

  return {
    isIntersecting,
    hasIntersected,
    element,
    disconnect
  }
}

/**
 * Lazy Image Loading Composable
 * Specialized for image lazy loading with WebP support
 */
export function useLazyImage(imageSrc, options = {}) {
  const {
    enableWebP = true,
    fallbackSrc = null,
    ...lazyOptions
  } = options

  const { isIntersecting, hasIntersected, element } = useLazyLoading(lazyOptions)
  const loaded = ref(false)
  const error = ref(false)
  const currentSrc = ref('')

  const getWebPSrc = (src) => {
    if (!enableWebP || !src) return null
    
    // Check if WebP is supported
    if (typeof window === 'undefined') return null
    
    const canvas = document.createElement('canvas')
    const webpSupported = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
    
    if (!webpSupported) return null
    
    // Convert to WebP format
    return src.replace(/\.(jpg|jpeg|png)$/i, '.webp')
  }

  const loadImage = () => {
    if (!imageSrc || loaded.value || error.value) return

    const img = new Image()
    
    img.onload = () => {
      loaded.value = true
      error.value = false
      currentSrc.value = imageSrc
    }
    
    img.onerror = () => {
      error.value = true
      loaded.value = false
      
      // Try fallback if available
      if (fallbackSrc && currentSrc.value !== fallbackSrc) {
        currentSrc.value = fallbackSrc
        loadImage()
      }
    }
    
    img.src = imageSrc
  }

  // Load image when it comes into view
  watch(isIntersecting, (intersecting) => {
    if (intersecting && !loaded.value && !error.value) {
      loadImage()
    }
  })

  const webpSrc = computed(() => getWebPSrc(imageSrc))

  return {
    isIntersecting,
    hasIntersected,
    loaded,
    error,
    currentSrc,
    webpSrc,
    element,
    loadImage
  }
}

/**
 * Lazy Component Loading Composable
 * For lazy loading Vue components
 */
export function useLazyComponent(componentLoader, options = {}) {
  const { isIntersecting, hasIntersected, element } = useLazyLoading(options)
  const component = ref(null)
  const loading = ref(false)
  const error = ref(false)

  const loadComponent = async () => {
    if (component.value || loading.value) return

    loading.value = true
    error.value = false

    try {
      const loadedComponent = await componentLoader()
      component.value = loadedComponent
    } catch (err) {
      console.error('Failed to load component:', err)
      error.value = true
    } finally {
      loading.value = false
    }
  }

  // Load component when it comes into view
  watch(isIntersecting, (intersecting) => {
    if (intersecting && !component.value && !loading.value && !error.value) {
      loadComponent()
    }
  })

  return {
    isIntersecting,
    hasIntersected,
    component,
    loading,
    error,
    element,
    loadComponent
  }
}

export default {
  useLazyLoading,
  useLazyImage,
  useLazyComponent
}