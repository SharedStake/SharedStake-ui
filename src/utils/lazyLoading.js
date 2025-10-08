/**
 * Lazy Loading Implementation for SharedStake
 * 
 * This utility provides lazy loading functionality for images and other content
 * to improve page performance and Core Web Vitals scores.
 */

// Intersection Observer for lazy loading
let intersectionObserver;

/**
 * Initialize lazy loading for all images with data-src attribute
 */
export function initLazyLoading() {
  // Check if Intersection Observer is supported
  if (!('IntersectionObserver' in window)) {
    // Fallback: load all images immediately
    loadAllImages();
    return;
  }

  // Create intersection observer
  intersectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target;
          
          if (element.tagName === 'IMG') {
            loadImage(element);
          } else if (element.hasAttribute('data-src')) {
            loadElement(element);
          }
          
          // Stop observing this element
          intersectionObserver.unobserve(element);
        }
      });
    },
    {
      // Load images when they're 50px away from viewport
      rootMargin: '50px 0px',
      threshold: 0.01
    }
  );

  // Observe all lazy elements
  observeLazyElements();
}

/**
 * Observe all elements that should be lazy loaded
 */
function observeLazyElements() {
  // Find all images with data-src attribute
  const lazyImages = document.querySelectorAll('img[data-src]');
  lazyImages.forEach((img) => {
    intersectionObserver.observe(img);
  });

  // Find all other elements with data-src attribute
  const lazyElements = document.querySelectorAll('[data-src]:not(img)');
  lazyElements.forEach((element) => {
    intersectionObserver.observe(element);
  });
}

/**
 * Load a lazy image
 */
function loadImage(img) {
  const src = img.getAttribute('data-src');
  const srcset = img.getAttribute('data-srcset');
  
  if (src) {
    // Add loading class
    img.classList.add('lazy-loading');
    
    // Create new image to preload
    const newImg = new Image();
    
    newImg.onload = () => {
      // Image loaded successfully
      img.src = src;
      if (srcset) {
        img.srcset = srcset;
      }
      img.classList.remove('lazy-loading');
      img.classList.add('lazy-loaded');
      
      // Remove data attributes
      img.removeAttribute('data-src');
      img.removeAttribute('data-srcset');
    };
    
    newImg.onerror = () => {
      // Image failed to load
      img.classList.remove('lazy-loading');
      img.classList.add('lazy-error');
      console.warn('Failed to load lazy image:', src);
    };
    
    // Start loading
    newImg.src = src;
    if (srcset) {
      newImg.srcset = srcset;
    }
  }
}

/**
 * Load a lazy element (non-image)
 */
function loadElement(element) {
  const src = element.getAttribute('data-src');
  
  if (src) {
    element.classList.add('lazy-loading');
    
    // For non-image elements, we might load content via fetch
    // This is a placeholder for future implementations
    fetch(src)
      .then(response => response.text())
      .then(content => {
        element.innerHTML = content;
        element.classList.remove('lazy-loading');
        element.classList.add('lazy-loaded');
        element.removeAttribute('data-src');
      })
      .catch(error => {
        element.classList.remove('lazy-loading');
        element.classList.add('lazy-error');
        console.warn('Failed to load lazy element:', src, error);
      });
  }
}

/**
 * Fallback: load all images immediately (for browsers without Intersection Observer)
 */
function loadAllImages() {
  const lazyImages = document.querySelectorAll('img[data-src]');
  lazyImages.forEach((img) => {
    const src = img.getAttribute('data-src');
    const srcset = img.getAttribute('data-srcset');
    
    if (src) {
      img.src = src;
      if (srcset) {
        img.srcset = srcset;
      }
      img.removeAttribute('data-src');
      img.removeAttribute('data-srcset');
    }
  });
}

/**
 * Add lazy loading to a specific image element
 */
export function addLazyLoading(img, src, srcset = null) {
  // Set placeholder
  img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmM2Y0ZjYiLz48L3N2Zz4=';
  
  // Set data attributes
  img.setAttribute('data-src', src);
  if (srcset) {
    img.setAttribute('data-srcset', srcset);
  }
  
  // Add lazy loading class
  img.classList.add('lazy-image');
  
  // Observe if observer is available
  if (intersectionObserver) {
    intersectionObserver.observe(img);
  } else {
    // Fallback: load immediately
    loadImage(img);
  }
}

/**
 * Remove lazy loading from an element
 */
export function removeLazyLoading(element) {
  if (intersectionObserver) {
    intersectionObserver.unobserve(element);
  }
  
  element.classList.remove('lazy-image', 'lazy-loading', 'lazy-loaded', 'lazy-error');
  element.removeAttribute('data-src');
  element.removeAttribute('data-srcset');
}

/**
 * Destroy the intersection observer
 */
export function destroyLazyLoading() {
  if (intersectionObserver) {
    intersectionObserver.disconnect();
    intersectionObserver = null;
  }
}

/**
 * Check if an element is currently being lazy loaded
 */
export function isLazyLoading(element) {
  return element.classList.contains('lazy-loading');
}

/**
 * Check if an element has been lazy loaded
 */
export function isLazyLoaded(element) {
  return element.classList.contains('lazy-loaded');
}

/**
 * Get lazy loading statistics
 */
export function getLazyLoadingStats() {
  const lazyImages = document.querySelectorAll('img[data-src]');
  const loadedImages = document.querySelectorAll('.lazy-loaded');
  const loadingImages = document.querySelectorAll('.lazy-loading');
  const errorImages = document.querySelectorAll('.lazy-error');
  
  return {
    total: lazyImages.length + loadedImages.length + loadingImages.length + errorImages.length,
    pending: lazyImages.length,
    loaded: loadedImages.length,
    loading: loadingImages.length,
    errors: errorImages.length
  };
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLazyLoading);
} else {
  initLazyLoading();
}