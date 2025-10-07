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
const makeId = (text) => {
  if (typeof text !== 'string') {
    text = String(text || '');
  }
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').trim();
};

// Headings with classes
renderer.heading = (text, level) => {
  // Ensure text is a string
  const textStr = typeof text === 'string' ? text : String(text || '');
  return `<h${level} id="${makeId(textStr)}" class="blog-h${level}">${textStr}</h${level}>\n`;
};

// Code blocks with language labels
renderer.code = (code, language) => {
  const codeStr = String(code || '');
  const langStr = String(language || 'plaintext');
  return `<div class="blog-code-block">
  ${langStr && langStr !== 'plaintext' ? `<div class="blog-code-lang">${langStr}</div>` : ''}
  <pre><code class="language-${langStr}">${escapeHtml(codeStr)}</code></pre>
</div>\n`;
};

// Inline code
renderer.codespan = (code) => {
  const codeStr = String(code || '');
  return `<code class="blog-inline-code">${escapeHtml(codeStr)}</code>`;
};

// Blockquotes
renderer.blockquote = (quote) => `<blockquote class="blog-blockquote">${String(quote || '')}</blockquote>\n`;

// Tables with wrapper
renderer.table = (header, body) => {
  const headerStr = String(header || '');
  const bodyStr = String(body || '');
  return `<div class="blog-table-wrapper">
  <table class="blog-table">
    <thead class="blog-table-head">${headerStr}</thead>
    <tbody class="blog-table-body">${bodyStr}</tbody>
  </table>
</div>\n`;
};

renderer.tablerow = (content) => `<tr class="blog-table-row">${String(content || '')}</tr>\n`;
renderer.tablecell = (content, flags) => {
  const contentStr = String(content || '');
  const tag = flags.header ? 'th' : 'td';
  const cls = flags.header ? 'blog-table-header' : 'blog-table-cell';
  const align = flags.align ? ` style="text-align: ${flags.align}"` : '';
  return `<${tag} class="${cls}"${align}>${contentStr}</${tag}>`;
};

// Lists
renderer.list = (body, ordered, start) => {
  const tag = ordered ? 'ol' : 'ul';
  const cls = ordered ? 'blog-ordered-list' : 'blog-unordered-list';
  const startAttr = ordered && start !== 1 ? ` start="${start}"` : '';
  return `<${tag} class="${cls}"${startAttr}>${body}</${tag}>\n`;
};

renderer.listitem = (text, task, checked) => {
  const textStr = String(text || '');
  if (task) {
    const checkbox = `<input type="checkbox" class="blog-task-checkbox"${checked ? ' checked' : ''} disabled>`;
    return `<li class="blog-list-item blog-task-item">${checkbox} ${textStr}</li>\n`;
  }
  return `<li class="blog-list-item">${textStr}</li>\n`;
};

// Paragraphs
renderer.paragraph = (text) => {
  const textStr = String(text || '');
  return textStr.startsWith('<img') ? textStr + '\n' : `<p class="blog-paragraph">${textStr}</p>\n`;
};

// Links with external detection
renderer.link = (href, title, text) => {
  const hrefStr = String(href || '');
  const titleStr = String(title || '');
  const textStr = String(text || '');
  const isExternal = hrefStr.startsWith('http');
  const attrs = [
    `href="${hrefStr}"`,
    `class="blog-link${isExternal ? ' blog-link-external' : ''}"`,
    titleStr ? `title="${titleStr}"` : '',
    isExternal ? 'target="_blank" rel="noopener noreferrer"' : ''
  ].filter(Boolean).join(' ');
  return `<a ${attrs}>${textStr}</a>`;
};

// Images with figure wrapper
renderer.image = (href, title, text) => {
  const hrefStr = String(href || '');
  const titleStr = String(title || '');
  const textStr = String(text || '');
  const altText = textStr || titleStr || 'Image';
  return `<figure class="blog-figure">
  <img src="${hrefStr}" alt="${altText}" class="blog-image" loading="lazy"${titleStr ? ` title="${titleStr}"` : ''}>
  ${titleStr ? `<figcaption class="blog-figcaption">${titleStr}</figcaption>` : ''}
</figure>\n`;
};

// Text formatting
renderer.hr = () => '<hr class="blog-divider">\n';
renderer.strong = (text) => `<strong class="blog-strong">${String(text || '')}</strong>`;
renderer.em = (text) => `<em class="blog-emphasis">${String(text || '')}</em>`;
renderer.del = (text) => `<del class="blog-strikethrough">${String(text || '')}</del>`;

// Helper to escape HTML
const escapeHtml = (text) => {
  const textStr = String(text || '');
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return textStr.replace(/[&<>"']/g, m => map[m]);
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