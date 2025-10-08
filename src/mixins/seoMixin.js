// SEO mixin for automatic SEO handling
import { useSEO } from '@/composables/useSEO.js';

export default {
  data() {
    const seoUtils = useSEO();
    return {
      ...seoUtils
    };
  },
  
  mounted() {
    // Apply route-specific SEO if available
    if (this.$route?.meta?.seo) {
      this.setPageSEO({
        ...this.$route.meta.seo,
        url: this.$route.path
      });
      
      // Track page view
      this.trackPageView(this.$route.name || this.$route.path);
    }
  },
  
  watch: {
    // Watch for route changes and update SEO
    '$route'(to) {
      if (to.meta?.seo) {
        this.setPageSEO({
          ...to.meta.seo,
          url: to.path
        });
        
        // Track page view
        this.trackPageView(to.name || to.path);
      }
    }
  }
};