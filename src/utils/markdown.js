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

renderer.listitem = (text, task, checked) => {
  if (task) {
    const checkbox = `<input type="checkbox" class="blog-task-checkbox"${checked ? ' checked' : ''} disabled>`;
    return `<li class="blog-list-item blog-task-item">${checkbox} ${text}</li>\n`;
  }
  return `<li class="blog-list-item">${text}</li>\n`;
};

// Paragraphs
renderer.paragraph = (text) => 
  text.startsWith('<img') ? text + '\n' : `<p class="blog-paragraph">${text}</p>\n`;

// Links with external detection
renderer.link = (href, title, text) => {
  const isExternal = href?.startsWith('http');
  const attrs = [
    `href="${href}"`,
    `class="blog-link${isExternal ? ' blog-link-external' : ''}"`,
    title ? `title="${title}"` : '',
    isExternal ? 'target="_blank" rel="noopener noreferrer"' : ''
  ].filter(Boolean).join(' ');
  return `<a ${attrs}>${text}</a>`;
};

// Images with figure wrapper
renderer.image = (href, title, text) => `<figure class="blog-figure">
  <img src="${href}" alt="${text || title || 'Image'}" class="blog-image" loading="lazy"${title ? ` title="${title}"` : ''}>
  ${title ? `<figcaption class="blog-figcaption">${title}</figcaption>` : ''}
</figure>\n`;

// Text formatting
renderer.hr = () => '<hr class="blog-divider">\n';
renderer.strong = (text) => `<strong class="blog-strong">${text}</strong>`;
renderer.em = (text) => `<em class="blog-emphasis">${text}</em>`;
renderer.del = (text) => `<del class="blog-strikethrough">${text}</del>`;

// Helper to escape HTML
const escapeHtml = (text) => {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return text.replace(/[&<>"']/g, m => map[m]);
};

// Set renderer
marked.setOptions({ renderer });

// Export parser
export const parseMarkdown = (markdown) => {
  if (!markdown) return '';
  try {
    // Clean up extra line breaks
    const processed = markdown.replace(/\n\n<br\/>\n\n/g, '\n\n').replace(/<br\/>\n/g, '\n\n');
    return marked(processed);
  } catch (error) {
    console.error('Error parsing markdown:', error);
    return '<div class="blog-error">Error rendering content</div>';
  }
};

export default parseMarkdown;