import { marked } from 'marked';

// Configure marked for GitHub-flavored markdown
marked.setOptions({
  breaks: true,
  gfm: true,
  headerIds: true,
  sanitize: false,
  smartLists: true,
  smartypants: true
});

// Custom renderer for blog styling
const renderer = new marked.Renderer();

// Helper to generate IDs from text
const makeId = (text) => text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').trim();

// Helper to escape HTML
const escapeHtml = (text) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
};

// Headings with classes
renderer.heading = (text, level) => 
  `<h${level} id="${makeId(text)}" class="blog-h${level}">${text}</h${level}>\n`;

// Code blocks with language labels
renderer.code = (code, language) => `<div class="blog-code-block">
  ${language ? `<div class="blog-code-lang">${language}</div>` : ''}
  <pre><code class="language-${language || 'plaintext'}">${escapeHtml(code)}</code></pre>
</div>\n`;

// Inline code
renderer.codespan = (code) => `<code class="blog-inline-code">${escapeHtml(code)}</code>`;

// Blockquotes
renderer.blockquote = (quote) => `<blockquote class="blog-blockquote">${quote}</blockquote>\n`;

// Tables with wrapper
renderer.table = (header, body) => `<div class="blog-table-wrapper">
  <table class="blog-table">
    <thead class="blog-table-head">${header}</thead>
    <tbody class="blog-table-body">${body}</tbody>
  </table>
</div>\n`;

renderer.tablerow = (content) => `<tr class="blog-table-row">${content}</tr>\n`;
renderer.tablecell = (content, flags) => {
  const tag = flags.header ? 'th' : 'td';
  const cls = flags.header ? 'blog-table-header' : 'blog-table-cell';
  const align = flags.align ? ` style="text-align: ${flags.align}"` : '';
  return `<${tag} class="${cls}"${align}>${content}</${tag}>`;
};

// Lists
renderer.list = (body, ordered, start) => {
  const tag = ordered ? 'ol' : 'ul';
  const cls = ordered ? 'blog-ordered-list' : 'blog-unordered-list';
  const startAttr = ordered && start !== 1 ? ` start="${start}"` : '';
  return `<${tag} class="${cls}"${startAttr}>${body}</${tag}>\n`;
};

renderer.listitem = (text) => `<li class="blog-list-item">${text}</li>\n`;

// Paragraphs
renderer.paragraph = (text) => `<p class="blog-paragraph">${text}</p>\n`;

// Links
renderer.link = (href, title, text) => {
  const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
  const external = href.startsWith('http') ? ' target="_blank" rel="noopener noreferrer"' : '';
  return `<a href="${escapeHtml(href)}"${titleAttr}${external} class="blog-link">${text}</a>`;
};

// Images
renderer.image = (href, title, text) => {
  const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
  return `<img src="${escapeHtml(href)}" alt="${escapeHtml(text)}"${titleAttr} class="blog-image" loading="lazy" />`;
};

// Horizontal rules
renderer.hr = () => '<hr class="blog-divider" />\n';

// Strong (bold)
renderer.strong = (text) => `<strong class="blog-strong">${text}</strong>`;

// Emphasis (italic)
renderer.em = (text) => `<em class="blog-emphasis">${text}</em>`;

// Strikethrough
renderer.del = (text) => `<del class="blog-strikethrough">${text}</del>`;

// Export the parsing function
export function parseMarkdown(markdown) {
  try {
    return marked(markdown, { renderer });
  } catch (error) {
    console.error('Error parsing markdown:', error);
    // Return escaped content as fallback
    return `<pre>${escapeHtml(markdown)}</pre>`;
  }
}

// Export marked for direct use if needed
export { marked };