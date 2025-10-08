<template>
  <div style="display: none;">
    <!-- This component only provides global styles for blog posts -->
  </div>
</template>

<script>
export default {
  name: 'BlogStyles'
};
</script>

<style>
/* Blog Post Styles - Optimized for GitHub-like rendering */

/* Base */
.blog-content {
  @apply text-gray-300 leading-relaxed;
  word-wrap: break-word;
}

/* Headings */
.blog-h1 { @apply text-3xl md:text-4xl font-bold text-white mt-8 mb-6 pb-3 border-b-2 border-gray-700; }
.blog-h2 { @apply text-2xl md:text-3xl font-bold text-white mt-12 mb-6 pt-4 border-t border-gray-800; }
.blog-h3 { @apply text-xl md:text-2xl font-bold text-gray-100 mt-8 mb-4 pl-3 border-l-4 border-brand-primary; }
.blog-h4 { @apply text-lg md:text-xl font-semibold text-gray-200 mt-6 mb-3; }
.blog-h5, .blog-h6 { @apply text-base md:text-lg font-semibold text-gray-300 mt-4 mb-2; }

/* Text */
.blog-paragraph { @apply text-gray-300 text-base md:text-lg mb-6 leading-relaxed; }
.blog-strong { @apply text-white font-bold; }
.blog-emphasis { @apply text-gray-100 italic; }
.blog-strikethrough { @apply text-gray-400 line-through; }

/* Links - Enhanced SEO and UX */
.blog-link { 
  @apply text-brand-primary underline hover:text-pink-400 hover:no-underline transition-colors; 
  text-decoration-thickness: 1px;
  text-underline-offset: 2px;
}

.blog-link-external { 
  @apply relative;
}

.blog-link-external::after { 
  content: ' ↗'; 
  @apply text-xs absolute -top-1 -right-1 opacity-60; 
  transition: opacity 0.2s ease;
}

.blog-link-external:hover::after { 
  @apply opacity-100; 
}

.blog-link-internal {
  @apply font-medium;
}

.blog-link-internal:hover {
  @apply text-pink-300;
}

/* Link focus states for accessibility */
.blog-link:focus {
  @apply outline-none ring-2 ring-brand-primary ring-offset-2 ring-offset-gray-900 rounded;
}

/* Lists */
.blog-unordered-list,
.blog-ordered-list {
  @apply mb-6 pl-6 space-y-2 py-4 pr-4 rounded-lg;
  background: rgba(31, 41, 55, 0.3);
}
.blog-list-item { @apply text-gray-300 leading-relaxed; }
.blog-unordered-list .blog-list-item { @apply list-disc; }
.blog-ordered-list .blog-list-item { @apply list-decimal; }
.blog-list-item::marker { @apply text-brand-primary; }
.blog-ordered-list .blog-list-item::marker { @apply font-bold; }

/* Nested lists */
.blog-unordered-list ul,
.blog-unordered-list ol,
.blog-ordered-list ul,
.blog-ordered-list ol {
  @apply mt-2 mb-0 ml-4 bg-transparent py-0;
}

/* Code */
.blog-code-block {
  @apply relative my-6 rounded-lg overflow-hidden bg-gray-900 border border-gray-700;
}
.blog-code-lang {
  @apply absolute top-0 right-0 px-3 py-1 text-xs bg-gray-800 text-brand-primary rounded-bl-lg font-mono;
}
.blog-code-block pre {
  @apply p-4 md:p-6 overflow-x-auto text-sm md:text-base;
}
.blog-code-block code {
  @apply text-gray-200 font-mono bg-transparent p-0;
  white-space: pre;
}
.blog-inline-code {
  @apply bg-gray-800 text-brand-primary px-2 py-0.5 rounded text-sm font-mono border border-gray-700;
}

/* Blockquotes */
.blog-blockquote {
  @apply my-6 pl-6 pr-4 py-4 border-l-4 border-brand-primary bg-gradient-to-r from-gray-800 to-transparent rounded-r-lg;
  position: relative;
}
.blog-blockquote::before {
  content: '"';
  @apply text-brand-primary text-4xl font-bold absolute -top-2 left-2;
  opacity: 0.5;
}
.blog-blockquote p { @apply mb-0 text-gray-200 italic; }

/* Tables */
.blog-table-wrapper {
  @apply my-6 overflow-x-auto rounded-lg border border-gray-700;
  background: rgba(31, 41, 55, 0.5);
}
.blog-table {
  @apply w-full min-w-full;
  border-collapse: separate;
  border-spacing: 0;
}
.blog-table-head { background: rgba(17, 24, 39, 0.8); }
.blog-table-header,
.blog-table-cell {
  @apply px-4 py-3 text-left border-b border-gray-700 text-sm md:text-base;
}
.blog-table-header {
  @apply text-brand-primary font-bold border-b-2 border-r;
}
.blog-table-cell {
  @apply text-gray-300 border-r;
}
.blog-table-header:last-child,
.blog-table-cell:last-child { @apply border-r-0; }
.blog-table-row:last-child .blog-table-cell { @apply border-b-0; }
.blog-table-row:hover { background: rgba(55, 65, 81, 0.3); }

/* Images - Enhanced SEO and Performance */
.blog-image-container {
  @apply my-6 text-center block;
  position: relative;
}

.blog-image {
  @apply max-w-full h-auto mx-auto rounded-lg shadow-xl border border-gray-700;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  background: linear-gradient(45deg, #1f2937, #374151);
  min-height: 200px;
  object-fit: cover;
}

.blog-image:hover {
  transform: scale(1.02);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.blog-figure { @apply my-6 text-center; }
.blog-figcaption { @apply mt-2 text-sm text-gray-400 italic; }

/* Image loading states */
.blog-image-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 40px;
  border: 3px solid #374151;
  border-top: 3px solid #e6007a;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.blog-image-container.loading::before {
  opacity: 1;
}

@keyframes spin {
  0% { transform: translateX(-50%) rotate(0deg); }
  100% { transform: translateX(-50%) rotate(360deg); }
}

/* Misc */
.blog-divider {
  @apply my-12 border-0;
  height: 2px;
  background: linear-gradient(90deg, transparent, #e6007a, transparent);
}
.blog-task-item { @apply list-none flex items-start gap-2; }
.blog-task-checkbox { @apply mt-1; }

/* Mobile Optimization */
@media (max-width: 768px) {
  .blog-h1 { @apply text-2xl mt-6 mb-4; }
  .blog-h2 { @apply text-xl mt-8 mb-4 pt-3; }
  .blog-h3 { @apply text-lg mt-6 mb-3; }
  .blog-paragraph { @apply text-base mb-4; }
  .blog-unordered-list,
  .blog-ordered-list { @apply pl-4 py-3; }
  .blog-code-block pre { @apply p-3 text-xs; }
  .blog-table-header,
  .blog-table-cell { @apply px-2 py-2 text-xs; }
  .blog-blockquote { @apply pl-4 py-3; }
  .blog-divider { @apply my-8; }
  
  /* Mobile image optimizations */
  .blog-image-container { @apply my-4; }
  .blog-image { 
    @apply min-h-32;
    max-width: 100%;
    height: auto;
  }
  
  /* Touch-friendly interactions */
  .blog-link {
    @apply min-h-11 flex items-center;
    padding: 8px 0;
  }
  
  /* Better mobile table handling */
  .blog-table-wrapper {
    @apply -mx-4;
    border-left: none;
    border-right: none;
    border-radius: 0;
  }
}

/* Tablet optimization */
@media (min-width: 769px) and (max-width: 1024px) {
  .blog-image-container { @apply my-5; }
  .blog-image { min-height: 180px; }
}

/* Large screen optimizations */
@media (min-width: 1200px) {
  .blog-image { max-width: 900px; }
  .blog-content {
    max-width: 900px;
    margin: 0 auto;
  }
}

/* Anchor offset for fixed headers */
[id].blog-h1,
[id].blog-h2,
[id].blog-h3,
[id].blog-h4,
[id].blog-h5,
[id].blog-h6 { scroll-margin-top: 5rem; }
</style>