// Dynamic loader for blog posts stored in individual files.
// Supports both .js files (with exports) and .md files (with frontmatter)

import { parseMarkdown } from '@/utils/markdown.js';

const requirePost = require.context('../posts', true, /\.(js|md)$/);

const loadedPosts = requirePost.keys().map((key) => {
  const mod = requirePost(key);
  
  // Handle .js files (existing format)
  if (key.endsWith('.js')) {
    return mod && mod.default ? mod.default : mod;
  }
  
  // Handle .md files (markdown with frontmatter)
  if (key.endsWith('.md')) {
    const content = mod.default || mod;
    const lines = content.split('\n');
    
    // Find frontmatter (between --- markers)
    let frontmatter = {};
    let contentStart = 0;
    
    if (lines[0] === '---') {
      let inMeta = false;
      let metaContent = '';
      
      for (let i = 1; i < lines.length; i++) {
        if (lines[i] === '---') {
          contentStart = i + 1;
          break;
        }
        
        // Handle meta section with nested content
        if (lines[i].trim() === 'meta:') {
          inMeta = true;
          frontmatter.meta = {};
          continue;
        }
        
        const line = lines[i];
        const indentLevel = line.search(/\S/);
        
        if (inMeta && indentLevel >= 2) {
          // Parse meta properties
          const [key, ...valueParts] = line.trim().split(':');
          if (key && valueParts.length > 0) {
            let value = valueParts.join(':').trim();
            value = value.replace(/^["']|["']$/g, ''); // Remove quotes
            frontmatter.meta[key.trim()] = value;
          }
        } else {
          inMeta = false;
          const [key, ...valueParts] = line.split(':');
          if (key && valueParts.length > 0) {
            let value = valueParts.join(':').trim();
            // Parse arrays and booleans
            if (value.startsWith('[') && value.endsWith(']')) {
              value = value.slice(1, -1).split(',').map(v => v.trim().replace(/['"]/g, ''));
            } else if (value === 'true') {
              value = true;
            } else if (value === 'false') {
              value = false;
            } else if (value.startsWith('"') && value.endsWith('"')) {
              value = value.slice(1, -1);
            }
            frontmatter[key.trim()] = value;
          }
        }
      }
    }
    
    // Parse markdown content
    const markdownContent = lines.slice(contentStart).join('\n');
    const htmlContent = parseMarkdown(markdownContent);
    
    return {
      ...frontmatter,
      content: htmlContent,
      rawContent: markdownContent
    };
  }
  
  return mod;
});

// Sort by publishDate desc by default
loadedPosts.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));

export const blogPosts = loadedPosts;

export const getBlogPostBySlug = (slug) => {
  return blogPosts.find((post) => post.slug === slug);
};

export const getFeaturedPosts = () => {
  return blogPosts.filter((post) => post.featured);
};

export const getPostsByTag = (tag) => {
  return blogPosts.filter((post) => post.tags && post.tags.includes(tag));
};

export const getAllTags = () => {
  const tags = new Set();
  blogPosts.forEach((post) => {
    (post.tags || []).forEach((tag) => tags.add(tag));
  });
  return Array.from(tags);
};

