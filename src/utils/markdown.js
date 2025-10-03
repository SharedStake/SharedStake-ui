import { marked } from 'marked';

// Configure marked for better security and styling
marked.setOptions({
  breaks: true,
  gfm: true,
  sanitize: false, // We trust our content
  smartLists: true,
  smartypants: true
});

// Custom renderer for better styling
const renderer = new marked.Renderer();

// Custom heading renderer with better spacing
renderer.heading = function(text, level) {
  const id = text.toLowerCase().replace(/[^\w]+/g, '-');
  const className = `heading-${level}`;
  return `<h${level} id="${id}" class="${className}">${text}</h${level}>`;
};

// Custom code renderer with syntax highlighting
renderer.code = function(code, language) {
  const className = language ? `language-${language}` : '';
  return `<pre class="code-block"><code class="${className}">${code}</code></pre>`;
};

// Custom blockquote renderer
renderer.blockquote = function(quote) {
  return `<blockquote class="blockquote">${quote}</blockquote>`;
};

// Custom table renderer
renderer.table = function(header, body) {
  return `<div class="table-wrapper"><table class="table">${header}${body}</table></div>`;
};

marked.use({ renderer });

export const parseMarkdown = (markdown) => {
  if (!markdown) return '';
  return marked(markdown);
};

export default parseMarkdown;