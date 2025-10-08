// Composable for blog functionality
import { ref, computed } from 'vue';
import { blogPosts, getBlogPostBySlug } from '@/components/Blog/data/index.js';
import { formatDate, formatTag, generateBreadcrumbItems, findRelatedPosts } from '@/utils/blogUtils.js';

export function useBlog() {
  const loading = ref(false);
  const selectedTag = ref(null);
  
  // Computed properties
  const allPosts = computed(() => blogPosts);
  const allTags = computed(() => {
    const tags = new Set();
    blogPosts.forEach(post => {
      (post.tags || []).forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  });
  
  const featuredPosts = computed(() => 
    blogPosts.filter(post => post.featured)
  );
  
  const filteredPosts = computed(() => {
    if (selectedTag.value) {
      return blogPosts.filter(post => post.tags?.includes(selectedTag.value));
    }
    return blogPosts;
  });
  
  // Methods
  const loadPost = (slug) => {
    loading.value = true;
    return new Promise((resolve) => {
      setTimeout(() => {
        const post = getBlogPostBySlug(slug);
        loading.value = false;
        resolve(post);
      }, 300);
    });
  };
  
  const getRelatedPosts = (currentPost, limit = 3) => {
    return findRelatedPosts(currentPost, blogPosts, limit);
  };
  
  const getBreadcrumbItems = (post = null) => {
    return generateBreadcrumbItems(post);
  };
  
  const setPageMeta = (title, description) => {
    document.title = title;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    }
  };
  
  return {
    // State
    loading,
    selectedTag,
    
    // Computed
    allPosts,
    allTags,
    featuredPosts,
    filteredPosts,
    
    // Methods
    loadPost,
    getRelatedPosts,
    getBreadcrumbItems,
    setPageMeta,
    formatDate,
    formatTag
  };
}