/**
 * Performance Monitoring Utility for SharedStake
 * 
 * Comprehensive performance tracking including Core Web Vitals,
 * lazy loading metrics, and real-time performance monitoring.
 */

class PerformanceMonitor {
  constructor(options = {}) {
    this.options = {
      enableCoreWebVitals: true,
      enableLazyLoadingMetrics: true,
      enableRealTimeMonitoring: true,
      enableAnalytics: true,
      reportInterval: 30000, // 30 seconds
      ...options
    };

    this.metrics = {
      coreWebVitals: {
        lcp: null, // Largest Contentful Paint
        fid: null, // First Input Delay
        cls: null, // Cumulative Layout Shift
        fcp: null, // First Contentful Paint
        ttfb: null // Time to First Byte
      },
      lazyLoading: {
        imagesLoaded: 0,
        imagesFailed: 0,
        totalLoadTime: 0,
        averageLoadTime: 0,
        events: []
      },
      navigation: {
        loadTime: 0,
        domContentLoaded: 0,
        firstPaint: 0,
        firstContentfulPaint: 0
      },
      custom: {}
    };

    this.observers = [];
    this.init();
  }

  init() {
    if (this.options.enableCoreWebVitals) {
      this.measureCoreWebVitals();
    }

    if (this.options.enableRealTimeMonitoring) {
      this.measureNavigationTiming();
      this.setupRealTimeMonitoring();
    }

    if (this.options.enableAnalytics) {
      this.setupAnalytics();
    }

    // Start periodic reporting
    this.startReporting();
  }

  measureCoreWebVitals() {
    // Largest Contentful Paint (LCP)
    this.measureLCP();
    
    // First Input Delay (FID)
    this.measureFID();
    
    // Cumulative Layout Shift (CLS)
    this.measureCLS();
    
    // First Contentful Paint (FCP)
    this.measureFCP();
    
    // Time to First Byte (TTFB)
    this.measureTTFB();
  }

  measureLCP() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      this.metrics.coreWebVitals.lcp = lastEntry.startTime;
      
      this.trackMetric('lcp', lastEntry.startTime);
    });

    observer.observe({ entryTypes: ['largest-contentful-paint'] });
    this.observers.push(observer);
  }

  measureFID() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        this.metrics.coreWebVitals.fid = entry.processingStart - entry.startTime;
        this.trackMetric('fid', entry.processingStart - entry.startTime);
      });
    });

    observer.observe({ entryTypes: ['first-input'] });
    this.observers.push(observer);
  }

  measureCLS() {
    if (!('PerformanceObserver' in window)) return;

    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      
      this.metrics.coreWebVitals.cls = clsValue;
      this.trackMetric('cls', clsValue);
    });

    observer.observe({ entryTypes: ['layout-shift'] });
    this.observers.push(observer);
  }

  measureFCP() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          this.metrics.coreWebVitals.fcp = entry.startTime;
          this.trackMetric('fcp', entry.startTime);
        }
      });
    });

    observer.observe({ entryTypes: ['paint'] });
    this.observers.push(observer);
  }

  measureTTFB() {
    if (!('performance' in window) || !('timing' in performance)) return;

    const timing = performance.timing;
    const ttfb = timing.responseStart - timing.navigationStart;
    
    this.metrics.coreWebVitals.ttfb = ttfb;
    this.trackMetric('ttfb', ttfb);
  }

  measureNavigationTiming() {
    if (!('performance' in window) || !('timing' in performance)) return;

    const timing = performance.timing;
    
    this.metrics.navigation = {
      loadTime: timing.loadEventEnd - timing.navigationStart,
      domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
      firstPaint: this.getFirstPaint(),
      firstContentfulPaint: this.getFirstContentfulPaint()
    };
  }

  getFirstPaint() {
    if (!('PerformanceObserver' in window)) return null;

    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : null;
  }

  getFirstContentfulPaint() {
    if (!('PerformanceObserver' in window)) return null;

    const paintEntries = performance.getEntriesByType('paint');
    const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return firstContentfulPaint ? firstContentfulPaint.startTime : null;
  }

  setupRealTimeMonitoring() {
    // Monitor resource loading
    this.monitorResourceLoading();
    
    // Monitor user interactions
    this.monitorUserInteractions();
    
    // Monitor memory usage
    this.monitorMemoryUsage();
  }

  monitorResourceLoading() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'resource') {
          this.trackResourceLoad(entry);
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });
    this.observers.push(observer);
  }

  monitorUserInteractions() {
    // Track click events
    document.addEventListener('click', (event) => {
      this.trackInteraction('click', {
        target: event.target.tagName,
        timestamp: Date.now()
      });
    });

    // Track scroll events
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.trackInteraction('scroll', {
          scrollY: window.scrollY,
          timestamp: Date.now()
        });
      }, 100);
    });
  }

  monitorMemoryUsage() {
    if (!('memory' in performance)) return;

    setInterval(() => {
      const memory = performance.memory;
      this.trackMetric('memory_usage', {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      });
    }, 10000); // Every 10 seconds
  }

  setupAnalytics() {
    // Google Analytics integration
    if (typeof gtag !== 'undefined') {
      this.setupGoogleAnalytics();
    }

    // Custom analytics endpoint
    this.setupCustomAnalytics();
  }

  setupGoogleAnalytics() {
    // Track Core Web Vitals
    this.trackCoreWebVitalsToGA();
    
    // Track custom events
    this.trackCustomEventsToGA();
  }

  trackCoreWebVitalsToGA() {
    const vitals = this.metrics.coreWebVitals;
    
    Object.entries(vitals).forEach(([metric, value]) => {
      if (value !== null) {
        gtag('event', metric, {
          event_category: 'Web Vitals',
          value: Math.round(value),
          non_interaction: true
        });
      }
    });
  }

  trackCustomEventsToGA() {
    // Track page load performance
    gtag('event', 'page_load_time', {
      event_category: 'Performance',
      value: Math.round(this.metrics.navigation.loadTime),
      non_interaction: true
    });

    // Track lazy loading performance
    const lazyMetrics = this.metrics.lazyLoading;
    if (lazyMetrics.imagesLoaded > 0) {
      gtag('event', 'lazy_loading_performance', {
        event_category: 'Performance',
        images_loaded: lazyMetrics.imagesLoaded,
        images_failed: lazyMetrics.imagesFailed,
        average_load_time: Math.round(lazyMetrics.averageLoadTime),
        non_interaction: true
      });
    }
  }

  setupCustomAnalytics() {
    // Send metrics to custom endpoint
    this.sendToCustomEndpoint = (data) => {
      if (this.options.analyticsEndpoint) {
        fetch(this.options.analyticsEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        }).catch(error => {
          console.warn('Failed to send analytics data:', error);
        });
      }
    };
  }

  trackMetric(name, value) {
    this.metrics.custom[name] = value;
    
    // Send to analytics
    if (this.options.enableAnalytics) {
      this.sendToAnalytics(name, value);
    }
  }

  trackResourceLoad(entry) {
    const resourceData = {
      name: entry.name,
      duration: entry.duration,
      size: entry.transferSize,
      type: entry.initiatorType,
      timestamp: Date.now()
    };

    this.trackMetric('resource_load', resourceData);
  }

  trackInteraction(type, data) {
    const interactionData = {
      type,
      ...data,
      timestamp: Date.now()
    };

    this.trackMetric('user_interaction', interactionData);
  }

  updateLazyLoadingMetrics(metrics) {
    this.metrics.lazyLoading = { ...this.metrics.lazyLoading, ...metrics };
  }

  sendToAnalytics(name, value) {
    // Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', name, {
        event_category: 'Performance',
        value: typeof value === 'number' ? Math.round(value) : value,
        non_interaction: true
      });
    }

    // Custom endpoint
    if (this.sendToCustomEndpoint) {
      this.sendToCustomEndpoint({
        metric: name,
        value: value,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent
      });
    }
  }

  startReporting() {
    setInterval(() => {
      this.reportMetrics();
    }, this.options.reportInterval);
  }

  reportMetrics() {
    const report = this.generateReport();
    
    console.log('Performance Report:', report);
    
    // Send comprehensive report
    if (this.options.enableAnalytics) {
      this.sendToAnalytics('performance_report', report);
    }
  }

  generateReport() {
    return {
      timestamp: Date.now(),
      url: window.location.href,
      coreWebVitals: this.metrics.coreWebVitals,
      navigation: this.metrics.navigation,
      lazyLoading: this.metrics.lazyLoading,
      custom: this.metrics.custom,
      userAgent: navigator.userAgent,
      connectionType: navigator.connection?.effectiveType || 'unknown'
    };
  }

  getMetrics() {
    return this.metrics;
  }

  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Vue composable for performance monitoring
export function usePerformanceMonitoring(options = {}) {
  const monitor = new PerformanceMonitor(options);
  
  return {
    monitor,
    metrics: monitor.getMetrics.bind(monitor),
    trackMetric: monitor.trackMetric.bind(monitor),
    destroy: monitor.destroy.bind(monitor)
  };
}

// Global performance monitor instance
let globalPerformanceMonitor = null;

export function initPerformanceMonitoring(options = {}) {
  if (globalPerformanceMonitor) {
    globalPerformanceMonitor.destroy();
  }
  
  globalPerformanceMonitor = new PerformanceMonitor(options);
  return globalPerformanceMonitor;
}

export function getPerformanceMetrics() {
  return globalPerformanceMonitor ? globalPerformanceMonitor.getMetrics() : null;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initPerformanceMonitoring();
  });
} else {
  initPerformanceMonitoring();
}

export default PerformanceMonitor;