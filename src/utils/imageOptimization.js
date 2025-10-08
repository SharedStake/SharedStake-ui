// Image optimization utilities for better SEO and performance
import { ref, computed } from 'vue';

// Image optimization configuration
const imageConfig = {
  // Quality settings for different image types
  quality: {
    hero: 85,
    blog: 80,
    thumbnail: 75,
    icon: 90
  },
  
  // Size configurations
  sizes: {
    hero: { width: 1200, height: 630 },
    blog: { width: 800, height: 400 },
    thumbnail: { width: 300, height: 200 },
    icon: { width: 64, height: 64 }
  },
  
  // Supported formats
  formats: ['webp', 'avif', 'jpg', 'png'],
  
  // Lazy loading configuration
  lazyLoading: {
    rootMargin: '50px',
    threshold: 0.1
  }
};

// Image optimization state
const optimizationState = ref({
  isSupported: {
    webp: false,
    avif: false
  },
  lazyLoadObserver: null,
  loadedImages: new Set()
});

export function useImageOptimization() {
  // Check browser support for modern image formats
  const checkFormatSupport = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    // Check WebP support
    optimizationState.value.isSupported.webp = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    
    // Check AVIF support (fallback to WebP if not supported)
    optimizationState.value.isSupported.avif = canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
  };

  // Get optimal image format
  const getOptimalFormat = () => {
    if (optimizationState.value.isSupported.avif) return 'avif';
    if (optimizationState.value.isSupported.webp) return 'webp';
    return 'jpg';
  };

  // Generate responsive image sources
  const generateImageSources = (basePath, alt, type = 'blog') => {
    const format = getOptimalFormat();
    const size = imageConfig.sizes[type];
    
    return {
      src: `${basePath}.${format}`,
      srcSet: [
        `${basePath}-300.${format} 300w`,
        `${basePath}-600.${format} 600w`,
        `${basePath}-800.${format} 800w`,
        `${basePath}-1200.${format} 1200w`
      ].join(', '),
      sizes: type === 'hero' ? '100vw' : '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
      alt: alt || 'SharedStake image',
      loading: 'lazy',
      decoding: 'async'
    };
  };

  // Create lazy loading observer
  const createLazyLoadObserver = () => {
    if (optimizationState.value.lazyLoadObserver) {
      return optimizationState.value.lazyLoadObserver;
    }

    optimizationState.value.lazyLoadObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const src = img.dataset.src;
            const srcset = img.dataset.srcset;
            
            if (src) {
              img.src = src;
              img.removeAttribute('data-src');
            }
            
            if (srcset) {
              img.srcset = srcset;
              img.removeAttribute('data-srcset');
            }
            
            img.classList.add('loaded');
            optimizationState.value.loadedImages.add(src);
            optimizationState.value.lazyLoadObserver.unobserve(img);
          }
        });
      },
      imageConfig.lazyLoading
    );

    return optimizationState.value.lazyLoadObserver;
  };

  // Setup lazy loading for image
  const setupLazyLoading = (imgElement) => {
    const observer = createLazyLoadObserver();
    observer.observe(imgElement);
  };

  // Generate optimized image attributes
  const getOptimizedImageAttrs = (src, alt, type = 'blog', options = {}) => {
    const basePath = src.replace(/\.(jpg|jpeg|png|webp|avif)$/i, '');
    const sources = generateImageSources(basePath, alt, type);
    
    return {
      ...sources,
      class: `optimized-image ${options.class || ''}`,
      style: options.style || '',
      onLoad: options.onLoad || null,
      onError: options.onError || null
    };
  };

  // Preload critical images
  const preloadImage = (src, type = 'image') => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = type;
    link.href = src;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  };

  // Generate image placeholder
  const generatePlaceholder = (width, height, color = '#f3f4f6') => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
    return canvas.toDataURL();
  };

  // Image compression utility (client-side)
  const compressImage = (file, quality = 0.8, maxWidth = 1200) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        
        resolve(compressedDataUrl);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // SEO-optimized image component props
  const getSEOImageProps = (src, alt, title, type = 'blog') => {
    const optimizedAttrs = getOptimizedImageAttrs(src, alt, type);
    
    return {
      ...optimizedAttrs,
      title: title || alt,
      'data-seo-optimized': 'true',
      'data-image-type': type
    };
  };

  // Initialize image optimization
  const initImageOptimization = () => {
    checkFormatSupport();
    createLazyLoadObserver();
  };

  // Cleanup image optimization
  const cleanupImageOptimization = () => {
    if (optimizationState.value.lazyLoadObserver) {
      optimizationState.value.lazyLoadObserver.disconnect();
      optimizationState.value.lazyLoadObserver = null;
    }
    optimizationState.value.loadedImages.clear();
  };

  return {
    // State
    isSupported: computed(() => optimizationState.value.isSupported),
    loadedImages: computed(() => optimizationState.value.loadedImages),
    
    // Methods
    getOptimalFormat,
    generateImageSources,
    getOptimizedImageAttrs,
    getSEOImageProps,
    setupLazyLoading,
    preloadImage,
    generatePlaceholder,
    compressImage,
    initImageOptimization,
    cleanupImageOptimization
  };
}

// Image optimization utilities
export const imageUtils = {
  // Generate responsive image HTML
  generateResponsiveImage: (src, alt, type = 'blog', options = {}) => {
    const basePath = src.replace(/\.(jpg|jpeg|png|webp|avif)$/i, '');
    const format = optimizationState.value.isSupported.avif ? 'avif' : 
                   optimizationState.value.isSupported.webp ? 'webp' : 'jpg';
    
    const sources = [
      `<source media="(max-width: 768px)" srcset="${basePath}-300.${format} 300w">`,
      `<source media="(max-width: 1200px)" srcset="${basePath}-600.${format} 600w">`,
      `<source media="(min-width: 1201px)" srcset="${basePath}-1200.${format} 1200w">`
    ].join('\n');
    
    return `<picture>
      ${sources}
      <img src="${basePath}.${format}" 
           alt="${alt || 'SharedStake image'}" 
           loading="lazy" 
           decoding="async"
           class="responsive-image ${options.class || ''}"
           ${options.title ? `title="${options.title}"` : ''}>
    </picture>`;
  },
  
  // Validate image dimensions
  validateImageDimensions: (width, height, type = 'blog') => {
    const expectedSize = imageConfig.sizes[type];
    const aspectRatio = width / height;
    const expectedRatio = expectedSize.width / expectedSize.height;
    
    return {
      isValid: Math.abs(aspectRatio - expectedRatio) < 0.1,
      aspectRatio,
      expectedRatio,
      recommendation: `Recommended: ${expectedSize.width}x${expectedSize.height}`
    };
  },
  
  // Generate image metadata for SEO
  generateImageMetadata: (src, alt, title, type = 'blog') => {
    const basePath = src.replace(/\.(jpg|jpeg|png|webp|avif)$/i, '');
    const size = imageConfig.sizes[type];
    
    return {
      src: `${basePath}.webp`,
      alt: alt || 'SharedStake image',
      title: title || alt,
      width: size.width,
      height: size.height,
      type: 'image/webp',
      loading: 'lazy',
      decoding: 'async'
    };
  }
};