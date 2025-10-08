// Optimized blog data loader
import { parseMarkdown } from '@/utils/markdown.js';

const requirePost = require.context('../posts', true, /\.(js|md)$/);

// Parse frontmatter from markdown content
const parseFrontmatter = (content) => {
  const lines = content.split('\n');
  const frontmatter = {};
  let contentStart = 0;
  
  if (lines[0] === '---') {
    let inMeta = false;
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i] === '---') {
        contentStart = i + 1;
        break;
      }
      
      const line = lines[i];
      const trimmedLine = line.trim();
      
      if (trimmedLine === 'meta:') {
        inMeta = true;
        frontmatter.meta = {};
        continue;
      }
      
      const indentLevel = line.search(/\S/);
      if (inMeta && indentLevel >= 2) {
        const [key, ...valueParts] = trimmedLine.split(':');
        if (key && valueParts.length > 0) {
          let value = valueParts.join(':').trim().replace(/^["']|["']$/g, '');
          frontmatter.meta[key.trim()] = value;
        }
      } else {
        inMeta = false;
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length > 0) {
          let value = valueParts.join(':').trim();
          if (value.startsWith('[') && value.endsWith(']')) {
            value = value.slice(1, -1).split(',').map(v => v.trim().replace(/['"]/g, ''));
          } else if (value === 'true') value = true;
          else if (value === 'false') value = false;
          else if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
          frontmatter[key.trim()] = value;
        }
      }
    }
  }
  
  return { frontmatter, contentStart };
};

// Load and process blog posts
const loadedPosts = requirePost.keys()
  .map(key => {
    const mod = requirePost(key);
    
    if (key.endsWith('.js')) {
      return mod?.default || mod;
    }
    
    if (key.endsWith('.md') && typeof mod === 'string') {
      const { frontmatter, contentStart } = parseFrontmatter(mod);
      const markdownContent = mod.split('\n').slice(contentStart).join('\n');
      
      return {
        ...frontmatter,
        content: parseMarkdown(markdownContent),
        rawContent: markdownContent
      };
    }
    
    return null;
  })
  .filter(Boolean)
  .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));

// Export blog data and utilities
export const blogPosts = loadedPosts;

export const getBlogPostBySlug = (slug) => 
  blogPosts.find(post => post.slug === slug);

export const getFeaturedPosts = () => 
  blogPosts.filter(post => post.featured);

export const getPostsByTag = (tag) => 
  blogPosts.filter(post => post.tags?.includes(tag));

export const getAllTags = () => {
  const tags = new Set();
  blogPosts.forEach(post => {
    (post.tags || []).forEach(tag => tags.add(tag));
  });
  return Array.from(tags);
};

