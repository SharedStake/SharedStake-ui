// Dynamic loader for blog posts stored in individual files.
// Supports both .js files (with exports) and .md files (with frontmatter)

// Use marked directly for better compatibility
import { marked } from 'marked';

// Configure marked for basic markdown parsing
marked.setOptions({
  breaks: true,
  gfm: true,
  headerIds: true,
  sanitize: false
});

// Simple markdown parser using marked
const parseMarkdown = (content) => {
  try {
    return marked(content);
  } catch (error) {
    console.error('Error parsing markdown:', error);
    // Fallback to basic HTML
    return content
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/\n\n/gim, '</p><p>')
      .replace(/\n/gim, '<br>')
      .replace(/^(.*)$/gim, '<p>$1</p>');
  }
};

const requirePost = require.context('../posts', true, /\.(js|md)$/);

const loadedPosts = requirePost.keys().map((key) => {
  const mod = requirePost(key);
  
  // Handle .js files (existing format)
  if (key.endsWith('.js')) {
    return mod && mod.default ? mod.default : mod;
  }
  
  // Handle .md files (markdown with frontmatter)
  if (key.endsWith('.md')) {
    // With esModule: false, raw-loader returns the string directly
    let content = mod;
    
    // Ensure content is a string
    if (typeof content !== 'string') {
      console.error('Markdown content is not a string for', key, 'Type:', typeof content);
      return null;
    }
    const lines = content.split('\n');
    
    // Find frontmatter (between --- markers)
    let frontmatter = {};
    let contentStart = 0;
    
    if (lines[0] === '---') {
      let inMeta = false;
      
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
}).filter(post => post !== null && post !== undefined);

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

