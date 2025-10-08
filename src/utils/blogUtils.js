// Shared utilities for blog functionality

/**
 * Format date string to readable format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Format tag string to readable format
 * @param {string} tag - Tag string (e.g., "liquid-staking")
 * @returns {string} Formatted tag (e.g., "Liquid Staking")
 */
export const formatTag = (tag) => {
  return tag.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

/**
 * Generate breadcrumb items for blog pages
 * @param {Object} post - Blog post object (optional)
 * @returns {Array} Breadcrumb items
 */
export const generateBreadcrumbItems = (post = null) => {
  const baseItems = [
    { name: 'Home', url: '/' },
    { name: 'Blog', url: '/blog' }
  ];
  
  if (post) {
    baseItems.push({
      name: post.title,
      url: `/blog/${post.slug}`
    });
  }
  
  return baseItems;
};

/**
 * Extract FAQ content from markdown
 * @param {string} rawContent - Raw markdown content
 * @returns {string|null} FAQ content or null if not found
 */
export const extractFAQContent = (rawContent) => {
  if (!rawContent) return null;
  
  const lines = rawContent.split('\n');
  let faqStart = -1;
  let faqEnd = -1;
  
  // Find FAQ section
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.match(/^##\s+.*[Ff][Aa][Qq].*$/)) {
      faqStart = i;
    } else if (faqStart !== -1 && line.match(/^##\s+/) && !line.match(/[Ff][Aa][Qq]/)) {
      faqEnd = i;
      break;
    }
  }
  
  if (faqStart === -1) return null;
  
  // Extract FAQ content
  const faqLines = faqEnd === -1 ? lines.slice(faqStart) : lines.slice(faqStart, faqEnd);
  return faqLines.join('\n');
};

/**
 * Generate Twitter share URL
 * @param {string} title - Post title
 * @param {string} url - Post URL
 * @returns {string} Twitter share URL
 */
export const generateTwitterShareUrl = (title, url) => {
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(title);
  return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
};

/**
 * Find related posts based on shared tags
 * @param {Object} currentPost - Current blog post
 * @param {Array} allPosts - All blog posts
 * @param {number} limit - Maximum number of related posts
 * @returns {Array} Related posts
 */
export const findRelatedPosts = (currentPost, allPosts, limit = 3) => {
  if (!currentPost || !currentPost.tags) return [];
  
  const currentTags = currentPost.tags;
  return allPosts
    .filter(post => post.id !== currentPost.id)
    .filter(post => post.tags && post.tags.some(tag => currentTags.includes(tag)))
    .slice(0, limit);
};
