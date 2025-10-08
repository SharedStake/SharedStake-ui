/**
 * Advanced Lazy Loading Utility for SharedStake
 * 
 * Provides intersection observer-based lazy loading with performance monitoring
 * and comprehensive error handling for optimal SEO and user experience.
 */

class LazyLoadingManager {
  constructor(options = {}) {
    this.options = {
      rootMargin: '50px',
      threshold: 0.1,
      enablePerformanceMonitoring: true,
      enableAnalytics: true,
      ...options
    };
    
    this.observer = null;
    this.performanceMetrics = {
      imagesLoaded: 0,
      imagesFailed: 0,
      totalLoadTime: 0,
      averageLoadTime: 0,
      lazyLoadEvents: []
    };
    
    this.init();
  }

  init() {
    // Check for Intersection Observer support
    if (!('IntersectionObserver' in window)) {
      console.warn('IntersectionObserver not supported, falling back to immediate loading');
      this.loadAllImages();
      return;
    }

    // Create intersection observer
    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      {
        rootMargin: this.options.rootMargin,
        threshold: this.options.threshold
      }
    );

    // Start observing images
    this.observeImages();
    
    // Set up performance monitoring
    if (this.options.enablePerformanceMonitoring) {
      this.setupPerformanceMonitoring();
    }
  }

  observeImages() {
    const lazyImages = document.querySelectorAll('img[data-src], img[loading="lazy"]');
    
    lazyImages.forEach(img => {
      // Add loading class for styling
      img.classList.add('lazy-loading');
      
      // Add error handling
      img.addEventListener('error', this.handleImageError.bind(this));
      img.addEventListener('load', this.handleImageLoad.bind(this));
      
      // Start observing
      this.observer.observe(img);
    });

    console.log(`LazyLoading: Observing ${lazyImages.length} images`);
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        this.loadImage(img);
        this.observer.unobserve(img);
      }
    });
  }

  loadImage(img) {
    const startTime = performance.now();
    
    // Get the actual image source
    const src = img.dataset.src || img.src;
    if (!src) return;

    // Create a new image to preload
    const imageLoader = new Image();
    
    imageLoader.onload = () => {
      // Update the actual image
      img.src = src;
      img.classList.remove('lazy-loading');
      img.classList.add('lazy-loaded');
      
      // Remove data-src attribute
      delete img.dataset.src;
      
      // Record performance metrics
      const loadTime = performance.now() - startTime;
      this.recordLoadTime(loadTime);
      
      // Track analytics
      if (this.options.enableAnalytics) {
        this.trackLazyLoadEvent('success', loadTime, src);
      }
    };

    imageLoader.onerror = () => {
      img.classList.remove('lazy-loading');
      img.classList.add('lazy-error');
      
      // Record error
      this.performanceMetrics.imagesFailed++;
      
      // Track analytics
      if (this.options.enableAnalytics) {
        this.trackLazyLoadEvent('error', performance.now() - startTime, src);
      }
      
      console.error(`LazyLoading: Failed to load image ${src}`);
    };

    // Start loading
    imageLoader.src = src;
  }

  handleImageLoad(event) {
    this.performanceMetrics.imagesLoaded++;
    event.target.classList.add('lazy-loaded');
  }

  handleImageError(event) {
    this.performanceMetrics.imagesFailed++;
    event.target.classList.add('lazy-error');
    
    // Optional: Set a placeholder image
    if (this.options.placeholderImage) {
      event.target.src = this.options.placeholderImage;
    }
  }

  recordLoadTime(loadTime) {
    this.performanceMetrics.totalLoadTime += loadTime;
    this.performanceMetrics.averageLoadTime = 
      this.performanceMetrics.totalLoadTime / this.performanceMetrics.imagesLoaded;
  }

  trackLazyLoadEvent(type, loadTime, src) {
    const event = {
      type,
      loadTime,
      src,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      connectionType: navigator.connection?.effectiveType || 'unknown'
    };

    this.performanceMetrics.lazyLoadEvents.push(event);

    // Send to analytics if available
    if (typeof gtag !== 'undefined') {
      gtag('event', 'lazy_load', {
        event_category: 'performance',
        event_label: type,
        value: Math.round(loadTime)
      });
    }
  }

  setupPerformanceMonitoring() {
    // Monitor Core Web Vitals
    if ('web-vital' in window) {
      // This would integrate with web-vitals library if available
      console.log('LazyLoading: Performance monitoring enabled');
    }

    // Report metrics periodically
    setInterval(() => {
      this.reportMetrics();
    }, 30000); // Every 30 seconds
  }

  reportMetrics() {
    const metrics = this.getMetrics();
    
    console.log('LazyLoading Performance Metrics:', {
      imagesLoaded: metrics.imagesLoaded,
      imagesFailed: metrics.imagesFailed,
      successRate: metrics.successRate,
      averageLoadTime: metrics.averageLoadTime,
      totalEvents: metrics.lazyLoadEvents.length
    });

    // Send to analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'lazy_loading_metrics', {
        event_category: 'performance',
        images_loaded: metrics.imagesLoaded,
        images_failed: metrics.imagesFailed,
        success_rate: metrics.successRate,
        average_load_time: Math.round(metrics.averageLoadTime)
      });
    }
  }

  getMetrics() {
    const total = this.performanceMetrics.imagesLoaded + this.performanceMetrics.imagesFailed;
    return {
      ...this.performanceMetrics,
      successRate: total > 0 ? (this.performanceMetrics.imagesLoaded / total) * 100 : 0
    };
  }

  loadAllImages() {
    // Fallback for browsers without IntersectionObserver
    const lazyImages = document.querySelectorAll('img[data-src]');
    lazyImages.forEach(img => {
      img.src = img.dataset.src;
      delete img.dataset.src;
    });
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Vue directive for lazy loading
export const lazyLoadDirective = {
  mounted(el, binding) {
    if (el.tagName === 'IMG') {
      el.dataset.src = binding.value;
      el.src = ''; // Clear src to prevent immediate loading
    }
  },
  updated(el, binding) {
    if (el.tagName === 'IMG' && binding.value !== binding.oldValue) {
      el.dataset.src = binding.value;
    }
  }
};

// Vue composable for lazy loading
export function useLazyLoading(options = {}) {
  const manager = new LazyLoadingManager(options);
  
  return {
    manager,
    metrics: manager.getMetrics.bind(manager),
    destroy: manager.destroy.bind(manager)
  };
}

// Global lazy loading manager instance
let globalLazyLoadingManager = null;

export function initLazyLoading(options = {}) {
  if (globalLazyLoadingManager) {
    globalLazyLoadingManager.destroy();
  }
  
  globalLazyLoadingManager = new LazyLoadingManager(options);
  return globalLazyLoadingManager;
}

export function getLazyLoadingMetrics() {
  return globalLazyLoadingManager ? globalLazyLoadingManager.getMetrics() : null;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initLazyLoading();
  });
} else {
  initLazyLoading();
}

export default LazyLoadingManager;