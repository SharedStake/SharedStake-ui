// Blog utilities for Vue 3 Composition API
import { ref, computed } from 'vue'
import { blogPosts, getBlogPostBySlug } from '@/components/Blog/data/index.js';
import { formatDate, formatTag, generateBreadcrumbItems, findRelatedPosts } from '@/utils/blogUtils.js';

export function useBlog() {
  // Reactive state
  const selectedTag = ref(null)
  const isLoading = ref(false)
  
  // Computed properties
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
  const setSelectedTag = (tag) => {
    selectedTag.value = tag;
  };
  
  const clearFilter = () => {
    selectedTag.value = null;
  };
  
  const loadPost = async (slug) => {
    isLoading.value = true;
    try {
      return new Promise((resolve) => {
        setTimeout(() => {
          const post = getBlogPostBySlug(slug);
          resolve(post);
        }, 300);
      });
    } finally {
      isLoading.value = false;
    }
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
    // Reactive state
    selectedTag,
    isLoading,
    
    // Computed properties
    allTags,
    featuredPosts,
    filteredPosts,
    
    // Data
    blogPosts,
    
    // Methods
    setSelectedTag,
    clearFilter,
    loadPost,
    getRelatedPosts,
    getBreadcrumbItems,
    setPageMeta,
    formatDate,
    formatTag
  };
}