import { marked } from 'marked';

// Configure marked for better security and styling
marked.setOptions({
  breaks: true,
  gfm: true,
  sanitize: false, // We trust our content
  smartLists: true,
  smartypants: true,
  tables: true
});

// Custom renderer for better styling
const renderer = new marked.Renderer();

// Custom heading renderer with better spacing and anchors
renderer.heading = function(text, level) {
  // Remove any HTML tags or emojis for the ID
  const plainText = text.replace(/<[^>]*>/g, '').replace(/[^\w\s-]/g, '');
  const id = plainText.toLowerCase().replace(/\s+/g, '-').replace(/-+/g, '-');
  
  // Add appropriate classes based on heading level
  let className = `heading-${level}`;
  if (level === 2) {
    className += ' section-header';
  } else if (level === 3) {
    className += ' subsection-header';
  }
  
  return `<h${level} id="${id}" class="${className}">${text}</h${level}>`;
};

// Custom code renderer with syntax highlighting and line numbers
renderer.code = function(code, language) {
  const className = language ? `language-${language}` : 'language-plaintext';
  const escapedCode = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
  
  return `<pre class="code-block"><code class="${className}">${escapedCode}</code></pre>`;
};

// Custom inline code renderer
renderer.codespan = function(code) {
  const escapedCode = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
  
  return `<code class="inline-code">${escapedCode}</code>`;
};

// Custom blockquote renderer with better styling
renderer.blockquote = function(quote) {
  return `<blockquote class="blockquote">${quote}</blockquote>`;
};

// Enhanced table renderer with responsive wrapper and better classes
renderer.table = function(header, body) {
  return `
    <div class="table-wrapper">
      <table class="responsive-table">
        ${header}
        ${body}
      </table>
    </div>`;
};

// Custom table header renderer
renderer.tablecell = function(content, flags) {
  const type = flags.header ? 'th' : 'td';
  const tag = flags.align
    ? `<${type} align="${flags.align}">`
    : `<${type}>`;
  return tag + content + `</${type}>`;
};

// Custom list renderer for better styling
renderer.list = function(body, ordered, start) {
  const type = ordered ? 'ol' : 'ul';
  const startatt = (ordered && start !== 1) ? (' start="' + start + '"') : '';
  const className = ordered ? 'ordered-list' : 'unordered-list';
  return `<${type}${startatt} class="${className}">${body}</${type}>`;
};

// Custom paragraph renderer to handle special cases
renderer.paragraph = function(text) {
  // Check if this paragraph contains only an image
  if (text.match(/^<img[^>]*>$/)) {
    return `<div class="image-container">${text}</div>`;
  }
  return `<p>${text}</p>`;
};

// Custom link renderer for better security and styling
renderer.link = function(href, title, text) {
  // Check if it's an external link
  const isExternal = href && (href.startsWith('http://') || href.startsWith('https://'));
  const targetAttr = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
  const titleAttr = title ? ` title="${title}"` : '';
  const className = isExternal ? ' class="external-link"' : '';
  
  return `<a href="${href}"${titleAttr}${targetAttr}${className}>${text}</a>`;
};

// Custom strong renderer
renderer.strong = function(text) {
  return `<strong class="font-bold">${text}</strong>`;
};

// Custom emphasis renderer
renderer.em = function(text) {
  return `<em class="italic">${text}</em>`;
};

// Custom horizontal rule renderer
renderer.hr = function() {
  return '<hr class="section-divider" />';
};

// Set the renderer
marked.setOptions({ renderer });

export const parseMarkdown = (markdown) => {
  if (!markdown) return '';
  
  // Pre-process the markdown to handle special cases
  let processedMarkdown = markdown;
  
  // Ensure proper spacing around tables
  processedMarkdown = processedMarkdown.replace(/(\n)(\|[^\n]+\|)(\n)/g, '$1\n$2$3');
  
  // Parse and return the HTML
  return marked(processedMarkdown);
};

export default parseMarkdown;