// Enhanced SEO composable for comprehensive meta management
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useStructuredData } from './useStructuredData.js';

// Default SEO configuration
const defaultSEO = {
  title: 'SharedStake | Ethereum Liquid Staking | Earn 4-8% APR',
  description: 'Stake ETH with SharedStake and earn 4-8% APR rewards. No 32 ETH minimum, full liquidity, and DeFi integration. Start staking with as little as 0.01 ETH.',
  keywords: 'ethereum staking, liquid staking, stake eth, ethereum rewards, defi staking, veth2, ethereum 2.0, staking platform',
  author: 'SharedStake Team',
  image: 'https://sharedstake.org/images/og-image.jpg',
  url: 'https://sharedstake.org',
  type: 'website',
  siteName: 'SharedStake',
  locale: 'en_US'
};

// SEO state management
const seoState = ref({
  title: defaultSEO.title,
  description: defaultSEO.description,
  keywords: defaultSEO.keywords,
  author: defaultSEO.author,
  image: defaultSEO.image,
  url: defaultSEO.url,
  type: defaultSEO.type,
  siteName: defaultSEO.siteName,
  locale: defaultSEO.locale,
  canonical: defaultSEO.url,
  robots: 'index, follow',
  themeColor: '#ff6b6b'
});

export function useSEO() {
  // Computed properties for dynamic meta tags
  const pageTitle = computed(() => {
    const baseTitle = 'SharedStake';
    return seoState.value.title === baseTitle 
      ? baseTitle 
      : `${seoState.value.title} | ${baseTitle}`;
  });

  const metaTags = computed(() => ({
    // Primary meta tags
    title: pageTitle.value,
    description: seoState.value.description,
    keywords: seoState.value.keywords,
    author: seoState.value.author,
    robots: seoState.value.robots,
    
    // Open Graph tags
    'og:title': seoState.value.title,
    'og:description': seoState.value.description,
    'og:image': seoState.value.image,
    'og:url': seoState.value.url,
    'og:type': seoState.value.type,
    'og:site_name': seoState.value.siteName,
    'og:locale': seoState.value.locale,
    
    // Twitter Card tags
    'twitter:card': 'summary_large_image',
    'twitter:title': seoState.value.title,
    'twitter:description': seoState.value.description,
    'twitter:image': seoState.value.image,
    'twitter:site': '@sharedstake',
    'twitter:creator': '@sharedstake',
    
    // Additional meta tags
    'theme-color': seoState.value.themeColor,
    'msapplication-TileColor': seoState.value.themeColor,
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': seoState.value.siteName
  }));

  // Update SEO data
  const updateSEO = (newSEO) => {
    Object.assign(seoState.value, newSEO);
    applyMetaTags();
  };

  // Apply meta tags to document head
  const applyMetaTags = () => {
    // Update document title
    document.title = pageTitle.value;
    
    // Update or create meta tags
    Object.entries(metaTags.value).forEach(([name, content]) => {
      if (!content) return;
      
      let selector;
      let attribute;
      
      if (name.startsWith('og:') || name.startsWith('twitter:')) {
        selector = `meta[property="${name}"]`;
        attribute = 'property';
      } else if (name === 'title') {
        // Title is handled separately
        return;
      } else {
        selector = `meta[name="${name}"]`;
        attribute = 'name';
      }
      
      let metaTag = document.querySelector(selector);
      
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.setAttribute(attribute, name);
        document.head.appendChild(metaTag);
      }
      
      metaTag.setAttribute('content', content);
    });
    
    // Update canonical URL
    updateCanonical();
  };

  // Update canonical URL
  const updateCanonical = () => {
    let canonical = document.querySelector('link[rel="canonical"]');
    
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    
    canonical.setAttribute('href', seoState.value.canonical || seoState.value.url);
  };

  // Set page-specific SEO
  const setPageSEO = (pageSEO) => {
    const fullURL = pageSEO.url ? 
      `${defaultSEO.url}${pageSEO.url.startsWith('/') ? '' : '/'}${pageSEO.url}` : 
      defaultSEO.url;
    
    updateSEO({
      ...pageSEO,
      url: fullURL,
      canonical: fullURL
    });
  };

  // Blog post SEO helper
  const setBlogPostSEO = (post) => {
    if (!post) return;
    
    const postURL = `${defaultSEO.url}/blog/${post.slug}`;
    const postImage = post.featuredImage || `${defaultSEO.url}/images/blog-${post.slug}.jpg`;
    
    setPageSEO({
      title: post.title,
      description: post.meta?.description || post.excerpt,
      keywords: post.meta?.keywords || post.tags?.join(', '),
      author: post.author || defaultSEO.author,
      image: postImage,
      url: postURL,
      type: 'article',
      canonical: postURL
    });
  };

  // Reset to default SEO
  const resetSEO = () => {
    Object.assign(seoState.value, defaultSEO);
    applyMetaTags();
  };

  // Performance monitoring
  const trackPageView = (pageName) => {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'page_view', {
        page_title: pageTitle.value,
        page_location: seoState.value.url,
        page_name: pageName
      });
    }
  };

  // Initialize SEO on component mount
  const initSEO = () => {
    applyMetaTags();
  };

  // Cleanup on component unmount
  const cleanupSEO = () => {
    // Reset to default SEO when component unmounts
    resetSEO();
  };

  return {
    // State
    seoState: computed(() => seoState.value),
    pageTitle,
    metaTags,
    
    // Methods
    updateSEO,
    setPageSEO,
    setBlogPostSEO,
    resetSEO,
    trackPageView,
    initSEO,
    cleanupSEO,
    
    // Utilities
    applyMetaTags,
    updateCanonical
  };
}

// Global SEO utilities
export const seoUtils = {
  // Generate structured data for different content types
  generateStructuredData: (type, data) => {
    const baseSchema = {
      '@context': 'https://schema.org'
    };
    
    switch (type) {
      case 'organization':
        return {
          ...baseSchema,
          '@type': 'Organization',
          name: data.name || 'SharedStake',
          url: data.url || 'https://sharedstake.org',
          logo: data.logo || 'https://sharedstake.org/logo-white.svg',
          description: data.description || 'Ethereum liquid staking platform',
          foundingDate: data.foundingDate || '2023',
          sameAs: data.sameAs || [
            'https://twitter.com/sharedstake',
            'https://discord.gg/sharedstake',
            'https://github.com/sharedstake'
          ]
        };
        
      case 'blogPost':
        return {
          ...baseSchema,
          '@type': 'BlogPosting',
          headline: data.title,
          description: data.description,
          image: data.image,
          author: {
            '@type': 'Organization',
            name: data.author || 'SharedStake Team'
          },
          publisher: {
            '@type': 'Organization',
            name: 'SharedStake',
            logo: 'https://sharedstake.org/logo-white.svg'
          },
          datePublished: data.publishDate,
          dateModified: data.publishDate,
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': data.url
          },
          keywords: data.keywords,
          articleSection: 'DeFi',
          wordCount: data.wordCount,
          inLanguage: 'en-US'
        };
        
      case 'website':
        return {
          ...baseSchema,
          '@type': 'WebSite',
          name: data.name || 'SharedStake',
          url: data.url || 'https://sharedstake.org',
          description: data.description || 'Ethereum liquid staking platform',
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: 'https://sharedstake.org/search?q={search_term_string}'
            },
            'query-input': 'required name=search_term_string'
          }
        };
        
      default:
        return baseSchema;
    }
  },
  
  // Validate SEO data
  validateSEO: (seoData) => {
    const errors = [];
    const warnings = [];
    
    // Title validation
    if (!seoData.title) {
      errors.push('Title is required');
    } else if (seoData.title.length < 30) {
      warnings.push('Title is too short (recommended: 30-60 characters)');
    } else if (seoData.title.length > 60) {
      warnings.push('Title is too long (recommended: 30-60 characters)');
    }
    
    // Description validation
    if (!seoData.description) {
      errors.push('Description is required');
    } else if (seoData.description.length < 120) {
      warnings.push('Description is too short (recommended: 120-160 characters)');
    } else if (seoData.description.length > 160) {
      warnings.push('Description is too long (recommended: 120-160 characters)');
    }
    
    // Image validation
    if (!seoData.image) {
      warnings.push('Image is recommended for social sharing');
    } else if (!seoData.image.startsWith('http')) {
      warnings.push('Image URL should be absolute');
    }
    
    return { errors, warnings, isValid: errors.length === 0 };
  },
  
  // Generate social sharing URLs
  generateSocialUrls: (url, title, description) => {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    const encodedDescription = encodeURIComponent(description);
    
    return {
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`
    };
  }
};