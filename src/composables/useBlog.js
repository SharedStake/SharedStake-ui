// Blog utilities for Vue 2
import { blogPosts, getBlogPostBySlug } from '@/components/Blog/data/index.js';
import { formatDate, formatTag, generateBreadcrumbItems, findRelatedPosts } from '@/utils/blogUtils.js';

export function useBlog() {
  // Helper functions that can be used in Vue 2 components
  const getAllTags = () => {
    const tags = new Set();
    blogPosts.forEach(post => {
      (post.tags || []).forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  };
  
  const getFeaturedPosts = () => 
    blogPosts.filter(post => post.featured);
  
  const getFilteredPosts = (selectedTag) => {
    if (selectedTag) {
      return blogPosts.filter(post => post.tags?.includes(selectedTag));
    }
    return blogPosts;
  };
  
  const loadPost = (slug) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const post = getBlogPostBySlug(slug);
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
    // Data
    blogPosts,
    
    // Helper functions
    getAllTags,
    getFeaturedPosts,
    getFilteredPosts,
    loadPost,
    getRelatedPosts,
    getBreadcrumbItems,
    setPageMeta,
    formatDate,
    formatTag
  };
}