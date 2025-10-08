/**
 * Lazy Loading Utility for SharedStake
 * 
 * Provides advanced lazy loading functionality with intersection observer
 * and performance monitoring for images and other resources.
 */

class LazyLoader {
  constructor(options = {}) {
    this.options = {
      rootMargin: '50px 0px',
      threshold: 0.1,
      ...options
    };
    
    this.observer = null;
    this.observedElements = new Set();
    this.performanceMetrics = {
      imagesLoaded: 0,
      imagesFailed: 0,
      averageLoadTime: 0,
      totalLoadTime: 0
    };
    
    this.init();
  }

  init() {
    // Check if IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) {
      console.warn('IntersectionObserver not supported, falling back to immediate loading');
      this.loadAllImages();
      return;
    }

    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      this.options
    );
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        this.loadElement(entry.target);
        this.observer.unobserve(entry.target);
        this.observedElements.delete(entry.target);
      }
    });
  }

  loadElement(element) {
    const startTime = performance.now();
    
    if (element.tagName === 'IMG') {
      this.loadImage(element, startTime);
    } else if (element.dataset.lazySrc) {
      this.loadGenericElement(element, startTime);
    }
  }

  loadImage(img, startTime) {
    const originalSrc = img.dataset.lazySrc || img.src;
    const placeholder = img.dataset.placeholder;
    
    // Add loading class
    img.classList.add('lazy-loading');
    
    // Set placeholder if provided
    if (placeholder && !img.src) {
      img.src = placeholder;
    }
    
    // Create new image to preload
    const newImg = new Image();
    
    newImg.onload = () => {
      const loadTime = performance.now() - startTime;
      this.performanceMetrics.imagesLoaded++;
      this.performanceMetrics.totalLoadTime += loadTime;
      this.performanceMetrics.averageLoadTime = 
        this.performanceMetrics.totalLoadTime / this.performanceMetrics.imagesLoaded;
      
      // Update the actual image
      img.src = originalSrc;
      img.classList.remove('lazy-loading');
      img.classList.add('lazy-loaded');
      
      // Track performance
      this.trackImageLoad(originalSrc, loadTime, true);
      
      // Dispatch custom event
      img.dispatchEvent(new CustomEvent('lazyLoaded', {
        detail: { loadTime, src: originalSrc }
      }));
    };
    
    newImg.onerror = () => {
      const loadTime = performance.now() - startTime;
      this.performanceMetrics.imagesFailed++;
      
      img.classList.remove('lazy-loading');
      img.classList.add('lazy-error');
      
      // Track error
      this.trackImageLoad(originalSrc, loadTime, false);
      
      // Dispatch custom event
      img.dispatchEvent(new CustomEvent('lazyError', {
        detail: { loadTime, src: originalSrc }
      }));
    };
    
    newImg.src = originalSrc;
  }

  loadGenericElement(element, startTime) {
    const src = element.dataset.lazySrc;
    
    element.classList.add('lazy-loading');
    
    // For background images
    if (element.dataset.lazyType === 'background') {
      element.style.backgroundImage = `url(${src})`;
    }
    
    // For other elements, set src attribute
    if (element.dataset.lazyType === 'src') {
      element.src = src;
    }
    
    const loadTime = performance.now() - startTime;
    element.classList.remove('lazy-loading');
    element.classList.add('lazy-loaded');
    
    // Dispatch custom event
    element.dispatchEvent(new CustomEvent('lazyLoaded', {
      detail: { loadTime, src }
    }));
  }

  observe(element) {
    if (!this.observer) {
      this.loadElement(element);
      return;
    }
    
    this.observer.observe(element);
    this.observedElements.add(element);
  }

  unobserve(element) {
    if (this.observer && this.observedElements.has(element)) {
      this.observer.unobserve(element);
      this.observedElements.delete(element);
    }
  }

  loadAllImages() {
    const images = document.querySelectorAll('img[data-lazy-src]');
    images.forEach(img => this.loadElement(img));
  }

  trackImageLoad(src, loadTime, success) {
    // Send to Google Analytics if available
    if (window.gtag) {
      window.gtag('event', success ? 'lazy_image_loaded' : 'lazy_image_error', {
        image_src: src,
        load_time: Math.round(loadTime),
        event_category: 'Performance'
      });
    }
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Lazy load ${success ? 'success' : 'error'}: ${src} (${Math.round(loadTime)}ms)`);
    }
  }

  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      successRate: this.performanceMetrics.imagesLoaded / 
        (this.performanceMetrics.imagesLoaded + this.performanceMetrics.imagesFailed) * 100
    };
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.observedElements.clear();
  }
}

// Create global instance
const lazyLoader = new LazyLoader();

// Vue directive for lazy loading
export const lazyLoadDirective = {
  bind(el, binding) {
    const { value } = binding;
    
    if (value && value.src) {
      el.dataset.lazySrc = value.src;
      el.dataset.lazyType = value.type || 'src';
      el.dataset.placeholder = value.placeholder;
      
      // Set initial placeholder
      if (value.placeholder) {
        if (value.type === 'background') {
          el.style.backgroundImage = `url(${value.placeholder})`;
        } else {
          el.src = value.placeholder;
        }
      }
      
      lazyLoader.observe(el);
    }
  },
  
  unbind(el) {
    lazyLoader.unobserve(el);
  }
};

// Utility functions
export const lazyLoadImage = (img) => {
  if (typeof img === 'string') {
    const imgElement = document.querySelector(img);
    if (imgElement) {
      lazyLoader.observe(imgElement);
    }
  } else if (img && img.nodeType === Node.ELEMENT_NODE) {
    lazyLoader.observe(img);
  }
};

export const lazyLoadImages = (selector = 'img[data-lazy-src]') => {
  const images = document.querySelectorAll(selector);
  images.forEach(img => lazyLoader.observe(img));
};

export const getLazyLoadMetrics = () => lazyLoader.getPerformanceMetrics();

export default lazyLoader;