// Performance Monitoring Utilities
import { getLazyLoadMetrics } from './lazyLoading.js'

export const performanceMonitoring = {
  // Core Web Vitals monitoring
  measureCoreWebVitals: () => {
    if (typeof window === 'undefined') return

    // Largest Contentful Paint (LCP)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      const lastEntry = entries[entries.length - 1]
      
      console.log('LCP:', lastEntry.startTime)
      
      // Send to analytics
      if (window.gtag) {
        window.gtag('event', 'web_vitals', {
          name: 'LCP',
          value: Math.round(lastEntry.startTime),
          event_category: 'Web Vitals'
        })
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] })

    // First Input Delay (FID)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      entries.forEach((entry) => {
        console.log('FID:', entry.processingStart - entry.startTime)
        
        // Send to analytics
        if (window.gtag) {
          window.gtag('event', 'web_vitals', {
            name: 'FID',
            value: Math.round(entry.processingStart - entry.startTime),
            event_category: 'Web Vitals'
          })
        }
      })
    }).observe({ entryTypes: ['first-input'] })

    // Cumulative Layout Shift (CLS)
    let clsValue = 0
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      })
      
      console.log('CLS:', clsValue)
      
      // Send to analytics
      if (window.gtag) {
        window.gtag('event', 'web_vitals', {
          name: 'CLS',
          value: Math.round(clsValue * 1000),
          event_category: 'Web Vitals'
        })
      }
    }).observe({ entryTypes: ['layout-shift'] })
  },

  // Page load performance
  measurePageLoad: () => {
    if (typeof window === 'undefined') return

    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0]
        const paint = performance.getEntriesByType('paint')
        
        const metrics = {
          // Navigation timing
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          totalLoadTime: navigation.loadEventEnd - navigation.fetchStart,
          
          // Paint timing
          firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
          firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
          
          // Resource timing
          resourceCount: performance.getEntriesByType('resource').length,
          resourceSize: performance.getEntriesByType('resource').reduce((total, resource) => {
            return total + (resource.transferSize || 0)
          }, 0)
        }
        
        console.log('Page Load Metrics:', metrics)
        
        // Send to analytics
        if (window.gtag) {
          window.gtag('event', 'page_load_performance', {
            dom_content_loaded: Math.round(metrics.domContentLoaded),
            load_complete: Math.round(metrics.loadComplete),
            total_load_time: Math.round(metrics.totalLoadTime),
            first_paint: Math.round(metrics.firstPaint),
            first_contentful_paint: Math.round(metrics.firstContentfulPaint),
            resource_count: metrics.resourceCount,
            resource_size: Math.round(metrics.resourceSize / 1024), // KB
            event_category: 'Performance'
          })
        }
      }, 0)
    })
  },

  // Image loading performance
  measureImageLoading: () => {
    if (typeof window === 'undefined') return

    const images = document.querySelectorAll('img')
    let loadedImages = 0
    let totalImages = images.length
    
    if (totalImages === 0) return

    images.forEach((img) => {
      if (img.complete) {
        loadedImages++
      } else {
        img.addEventListener('load', () => {
          loadedImages++
          if (loadedImages === totalImages) {
            console.log('All images loaded')
            
            // Send to analytics
            if (window.gtag) {
              window.gtag('event', 'images_loaded', {
                total_images: totalImages,
                event_category: 'Performance'
              })
            }
          }
        })
        
        img.addEventListener('error', () => {
          console.warn('Image failed to load:', img.src)
          
          // Send to analytics
          if (window.gtag) {
            window.gtag('event', 'image_load_error', {
              image_src: img.src,
              event_category: 'Performance'
            })
          }
        })
      }
    })
  },

  // User interaction performance
  measureUserInteractions: () => {
    if (typeof window === 'undefined') return

    // Click performance
    document.addEventListener('click', (event) => {
      const startTime = performance.now()
      
      requestAnimationFrame(() => {
        const endTime = performance.now()
        const clickDelay = endTime - startTime
        
        if (clickDelay > 100) { // Only log slow clicks
          console.log('Slow click detected:', clickDelay)
          
          // Send to analytics
          if (window.gtag) {
            window.gtag('event', 'slow_click', {
              click_delay: Math.round(clickDelay),
              target_element: event.target.tagName,
              event_category: 'Performance'
            })
          }
        }
      })
    })

    // Scroll performance
    let scrollTimeout
    document.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        const scrollDepth = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100)
        
        // Send to analytics
        if (window.gtag) {
          window.gtag('event', 'scroll_depth', {
            scroll_percentage: scrollDepth,
            event_category: 'User Engagement'
          })
        }
      }, 100)
    })
  },

  // Memory usage monitoring
  measureMemoryUsage: () => {
    if (typeof window === 'undefined' || !window.performance.memory) return

    const memory = window.performance.memory
    const memoryInfo = {
      usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
      totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
      jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) // MB
    }
    
    console.log('Memory Usage:', memoryInfo)
    
    // Send to analytics
    if (window.gtag) {
      window.gtag('event', 'memory_usage', {
        used_heap: memoryInfo.usedJSHeapSize,
        total_heap: memoryInfo.totalJSHeapSize,
        heap_limit: memoryInfo.jsHeapSizeLimit,
        event_category: 'Performance'
      })
    }
  },

  // Initialize all monitoring
  init: () => {
    if (typeof window === 'undefined') return

    // Core Web Vitals
    performanceMonitoring.measureCoreWebVitals()
    
    // Page load performance
    performanceMonitoring.measurePageLoad()
    
    // Image loading performance
    performanceMonitoring.measureImageLoading()
    
    // User interaction performance
    performanceMonitoring.measureUserInteractions()
    
    // Lazy loading performance
    performanceMonitoring.measureLazyLoading()
    
    // Memory usage (check every 30 seconds)
    setInterval(() => {
      performanceMonitoring.measureMemoryUsage()
    }, 30000)
    
    console.log('Performance monitoring initialized')
  },

  // Get performance score
  getPerformanceScore: () => {
    if (typeof window === 'undefined') return null

    const navigation = performance.getEntriesByType('navigation')[0]
    const paint = performance.getEntriesByType('paint')
    
    const firstContentfulPaint = paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0
    const totalLoadTime = navigation.loadEventEnd - navigation.fetchStart
    
    // Simple scoring algorithm
    let score = 100
    
    // FCP scoring (0-40 points)
    if (firstContentfulPaint > 3000) score -= 40
    else if (firstContentfulPaint > 2000) score -= 30
    else if (firstContentfulPaint > 1500) score -= 20
    else if (firstContentfulPaint > 1000) score -= 10
    
    // Total load time scoring (0-30 points)
    if (totalLoadTime > 5000) score -= 30
    else if (totalLoadTime > 3000) score -= 20
    else if (totalLoadTime > 2000) score -= 10
    
    // Resource count scoring (0-20 points)
    const resourceCount = performance.getEntriesByType('resource').length
    if (resourceCount > 100) score -= 20
    else if (resourceCount > 50) score -= 10
    
    // Resource size scoring (0-10 points)
    const resourceSize = performance.getEntriesByType('resource').reduce((total, resource) => {
      return total + (resource.transferSize || 0)
    }, 0)
    
    if (resourceSize > 5 * 1024 * 1024) score -= 10 // 5MB
    else if (resourceSize > 2 * 1024 * 1024) score -= 5 // 2MB
    
    return Math.max(0, score)
  },

  // Lazy loading performance monitoring
  measureLazyLoading: () => {
    if (typeof window === 'undefined') return

    // Monitor lazy loading performance every 10 seconds
    setInterval(() => {
      const metrics = getLazyLoadMetrics()
      
      if (metrics.imagesLoaded > 0 || metrics.imagesFailed > 0) {
        console.log('Lazy Loading Metrics:', metrics)
        
        // Send to analytics
        if (window.gtag) {
          window.gtag('event', 'lazy_loading_metrics', {
            images_loaded: metrics.imagesLoaded,
            images_failed: metrics.imagesFailed,
            average_load_time: Math.round(metrics.averageLoadTime),
            success_rate: Math.round(metrics.successRate),
            event_category: 'Performance'
          })
        }
      }
    }, 10000)
  }
}

// Export default
export default performanceMonitoring