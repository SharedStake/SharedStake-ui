// Performance monitoring and optimization utilities for blog

/**
 * Monitor Core Web Vitals and performance metrics
 */
export class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.init();
  }

  init() {
    // Monitor Largest Contentful Paint (LCP)
    this.observeLCP();
    
    // Monitor First Input Delay (FID)
    this.observeFID();
    
    // Monitor Cumulative Layout Shift (CLS)
    this.observeCLS();
    
    // Monitor First Contentful Paint (FCP)
    this.observeFCP();
  }

  observeLCP() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.lcp = lastEntry.startTime;
        this.reportMetric('LCP', lastEntry.startTime);
      });
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    }
  }

  observeFID() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.metrics.fid = entry.processingStart - entry.startTime;
          this.reportMetric('FID', this.metrics.fid);
        });
      });
      
      observer.observe({ entryTypes: ['first-input'] });
    }
  }

  observeCLS() {
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.metrics.cls = clsValue;
        this.reportMetric('CLS', clsValue);
      });
      
      observer.observe({ entryTypes: ['layout-shift'] });
    }
  }

  observeFCP() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.metrics.fcp = entry.startTime;
          this.reportMetric('FCP', entry.startTime);
        });
      });
      
      observer.observe({ entryTypes: ['paint'] });
    }
  }

  reportMetric(name, value) {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance Metric - ${name}:`, value);
    }

    // Send to analytics in production
    if (typeof gtag !== 'undefined') {
      gtag('event', 'web_vitals', {
        name: name,
        value: Math.round(name === 'CLS' ? value * 1000 : value),
        event_category: 'Web Vitals',
        event_label: name,
        non_interaction: true
      });
    }
  }

  getMetrics() {
    return this.metrics;
  }
}

/**
 * Lazy load images with intersection observer
 */
export class LazyImageLoader {
  constructor() {
    this.observer = null;
    this.init();
  }

  init() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            this.loadImage(img);
            this.observer.unobserve(img);
          }
        });
      }, {
        rootMargin: '50px 0px',
        threshold: 0.01
      });
    }
  }

  observe(img) {
    if (this.observer) {
      this.observer.observe(img);
    } else {
      // Fallback for browsers without IntersectionObserver
      this.loadImage(img);
    }
  }

  loadImage(img) {
    const src = img.dataset.src;
    if (src) {
      img.src = src;
      img.classList.remove('lazy');
      img.classList.add('loaded');
    }
  }
}

/**
 * Preload critical resources
 */
export function preloadCriticalResources() {
  // Preload critical blog components
  const criticalRoutes = [
    '/blog',
    '/blog/sharedstake-v2-launch-announcement',
    '/blog/understanding-liquid-staking-benefits'
  ];

  criticalRoutes.forEach(route => {
    // Preload route components
    if (route === '/blog') {
      import('@/components/Blog/Blog.vue');
    } else {
      import('@/components/Blog/BlogPost.vue');
    }
  });
}

/**
 * Optimize images for different screen sizes
 */
export function optimizeImages() {
  const images = document.querySelectorAll('img[data-src]');
  const lazyLoader = new LazyImageLoader();

  images.forEach(img => {
    lazyLoader.observe(img);
  });
}

/**
 * Debounce function for performance optimization
 */
export function debounce(func, wait, immediate) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Initialize performance optimizations
 */
export function initPerformanceOptimizations() {
  // Start performance monitoring
  new PerformanceMonitor();
  
  // Preload critical resources
  preloadCriticalResources();
  
  // Optimize images
  optimizeImages();
  
  // Add performance event listeners
  window.addEventListener('load', () => {
    // Report page load time
    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
    if (typeof gtag !== 'undefined') {
      gtag('event', 'page_load_time', {
        value: loadTime,
        event_category: 'Performance',
        event_label: 'Page Load Time'
      });
    }
  });
}

// Auto-initialize in production
if (process.env.NODE_ENV === 'production') {
  document.addEventListener('DOMContentLoaded', initPerformanceOptimizations);
}