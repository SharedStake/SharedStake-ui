import { marked } from 'marked';

// Configure marked for GitHub-flavored markdown with better defaults
marked.setOptions({
  breaks: true,           // Convert \n to <br>
  gfm: true,             // GitHub Flavored Markdown
  headerIds: true,       // Add IDs to headers for anchoring
  mangle: false,         // Don't mangle email addresses
  sanitize: false,       // We trust our content
  smartLists: true,      // Better list behavior
  smartypants: true,     // Smart quotes and dashes
  xhtml: false          // HTML5 output
});

// Custom renderer for enhanced styling
const renderer = new marked.Renderer();

// Enhanced heading renderer with anchors and better structure
renderer.heading = function(text, level, raw) {
  const id = raw.toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-')      // Replace spaces with dashes
    .replace(/-+/g, '-')       // Replace multiple dashes with single
    .trim();
  
  // Add appropriate classes for styling
  const levelClasses = {
    1: 'blog-h1',
    2: 'blog-h2', 
    3: 'blog-h3',
    4: 'blog-h4',
    5: 'blog-h5',
    6: 'blog-h6'
  };
  
  return `<h${level} id="${id}" class="${levelClasses[level] || ''}">${text}</h${level}>\n`;
};

// Enhanced code renderer with language support
renderer.code = function(code, language, isEscaped) {
  const lang = language || 'plaintext';
  const escapedCode = isEscaped ? code : escapeHtml(code);
  
  return `<div class="blog-code-block">
    ${language ? `<div class="blog-code-lang">${language}</div>` : ''}
    <pre><code class="language-${lang}">${escapedCode}</code></pre>
  </div>\n`;
};

// Enhanced inline code
renderer.codespan = function(code) {
  return `<code class="blog-inline-code">${escapeHtml(code)}</code>`;
};

// Enhanced blockquote with better styling
renderer.blockquote = function(quote) {
  return `<blockquote class="blog-blockquote">
    ${quote}
  </blockquote>\n`;
};

// Enhanced table with responsive wrapper and better structure
renderer.table = function(header, body) {
  return `<div class="blog-table-wrapper">
    <table class="blog-table">
      <thead class="blog-table-head">
        ${header}
      </thead>
      <tbody class="blog-table-body">
        ${body}
      </tbody>
    </table>
  </div>\n`;
};

// Enhanced table row
renderer.tablerow = function(content) {
  return `<tr class="blog-table-row">${content}</tr>\n`;
};

// Enhanced table cell
renderer.tablecell = function(content, flags) {
  const type = flags.header ? 'th' : 'td';
  const className = flags.header ? 'blog-table-header' : 'blog-table-cell';
  const align = flags.align ? ` style="text-align: ${flags.align}"` : '';
  
  return `<${type} class="${className}"${align}>${content}</${type}>`;
};

// Enhanced list rendering
renderer.list = function(body, ordered, start) {
  const type = ordered ? 'ol' : 'ul';
  const className = ordered ? 'blog-ordered-list' : 'blog-unordered-list';
  const startAttr = ordered && start !== 1 ? ` start="${start}"` : '';
  
  return `<${type} class="${className}"${startAttr}>
    ${body}
  </${type}>\n`;
};

// Enhanced list item
renderer.listitem = function(text, task, checked) {
  let className = 'blog-list-item';
  
  if (task) {
    className += ' blog-task-item';
    const checkbox = checked 
      ? '<input type="checkbox" class="blog-task-checkbox" checked disabled>'
      : '<input type="checkbox" class="blog-task-checkbox" disabled>';
    return `<li class="${className}">${checkbox} ${text}</li>\n`;
  }
  
  return `<li class="${className}">${text}</li>\n`;
};

// Enhanced paragraph
renderer.paragraph = function(text) {
  // Don't wrap images in paragraphs
  if (text.startsWith('<img')) {
    return text + '\n';
  }
  return `<p class="blog-paragraph">${text}</p>\n`;
};

// Enhanced links with external link handling
renderer.link = function(href, title, text) {
  const isExternal = href && (href.startsWith('http://') || href.startsWith('https://'));
  const titleAttr = title ? ` title="${title}"` : '';
  const targetAttr = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
  const className = isExternal ? 'blog-link blog-link-external' : 'blog-link';
  
  return `<a href="${href}" class="${className}"${titleAttr}${targetAttr}>${text}</a>`;
};

// Enhanced image rendering with lazy loading
renderer.image = function(href, title, text) {
  const titleAttr = title ? ` title="${title}"` : '';
  const altText = text || title || 'Image';
  
  return `<figure class="blog-figure">
    <img src="${href}" alt="${altText}" class="blog-image" loading="lazy"${titleAttr}>
    ${title ? `<figcaption class="blog-figcaption">${title}</figcaption>` : ''}
  </figure>\n`;
};

// Enhanced horizontal rule
renderer.hr = function() {
  return '<hr class="blog-divider">\n';
};

// Enhanced strong/bold
renderer.strong = function(text) {
  return `<strong class="blog-strong">${text}</strong>`;
};

// Enhanced emphasis/italic
renderer.em = function(text) {
  return `<em class="blog-emphasis">${text}</em>`;
};

// Enhanced strikethrough
renderer.del = function(text) {
  return `<del class="blog-strikethrough">${text}</del>`;
};

// Helper function to escape HTML
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Set the custom renderer
marked.setOptions({ renderer });

// Main parsing function with error handling
export const parseMarkdown = (markdown) => {
  if (!markdown) return '';
  
  try {
    // Pre-process to handle special cases
    let processed = markdown;
    
    // Handle line breaks better for readability
    processed = processed.replace(/\n\n<br\/>\n\n/g, '\n\n');
    processed = processed.replace(/<br\/>\n/g, '\n\n');
    
    // Parse with marked
    const html = marked(processed);
    
    return html;
  } catch (error) {
    console.error('Error parsing markdown:', error);
    return `<div class="blog-error">Error rendering content</div>`;
  }
};

export default parseMarkdown;