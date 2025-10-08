// Global SEO plugin for SharedStake
import { useSEO } from '@/composables/useSEO.js';

export default {
  install(app) {
    // Initialize global SEO utilities
    const seoUtils = useSEO();
    
    // Make SEO utilities available globally
    app.config.globalProperties.$seo = seoUtils;
    
    // Initialize default SEO on app start
    seoUtils.initSEO();
    
    // Set up global SEO tracking
    app.config.globalProperties.$trackPageView = (pageName) => {
      seoUtils.trackPageView(pageName);
    };
    
    // Set up global SEO updates
    app.config.globalProperties.$updateSEO = (seoData) => {
      seoUtils.updateSEO(seoData);
    };
    
    // Set up global page SEO
    app.config.globalProperties.$setPageSEO = (pageSEO) => {
      seoUtils.setPageSEO(pageSEO);
    };
    
    // Set up global blog post SEO
    app.config.globalProperties.$setBlogPostSEO = (post) => {
      seoUtils.setBlogPostSEO(post);
    };
  }
};