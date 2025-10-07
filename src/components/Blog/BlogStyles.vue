<template>
  <!-- This component only provides global styles for blog posts -->
</template>

<script>
export default {
  name: 'BlogStyles'
};
</script>

<style>
/* ============================================
   GLOBAL BLOG POST STYLES
   GitHub-like markdown rendering with enhanced readability
   ============================================ */

/* Base content wrapper */
.blog-content {
  color: #d1d5db;
  line-height: 1.75;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* ============================================
   TYPOGRAPHY - HEADINGS
   ============================================ */

.blog-h1 {
  @apply text-3xl md:text-4xl lg:text-5xl font-bold text-white;
  @apply mt-8 mb-6 pb-3;
  @apply border-b-2 border-gray-700;
}

.blog-h2 {
  @apply text-2xl md:text-3xl font-bold text-white;
  @apply mt-12 mb-6 pt-4;
  @apply border-t border-gray-800;
  position: relative;
}

/* Add decorative element to h2 */
.blog-h2::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 4rem;
  height: 3px;
  background: linear-gradient(90deg, #e6007a, transparent);
}

.blog-h3 {
  @apply text-xl md:text-2xl font-bold text-gray-100;
  @apply mt-8 mb-4;
  @apply pl-3 border-l-4 border-brand-primary;
}

.blog-h4 {
  @apply text-lg md:text-xl font-semibold text-gray-200;
  @apply mt-6 mb-3;
}

.blog-h5,
.blog-h6 {
  @apply text-base md:text-lg font-semibold text-gray-300;
  @apply mt-4 mb-2;
}

/* ============================================
   TYPOGRAPHY - BODY TEXT
   ============================================ */

.blog-paragraph {
  @apply text-gray-300 text-base md:text-lg;
  @apply mb-6 leading-relaxed;
}

.blog-strong {
  @apply text-white font-bold;
}

.blog-emphasis {
  @apply text-gray-100 italic;
}

.blog-strikethrough {
  @apply text-gray-400 line-through;
}

/* ============================================
   LINKS
   ============================================ */

.blog-link {
  @apply text-brand-primary underline;
  @apply transition-colors duration-200;
}

.blog-link:hover {
  @apply text-pink-400 no-underline;
}

.blog-link-external::after {
  content: ' ↗';
  @apply text-xs align-super;
}

/* ============================================
   LISTS
   ============================================ */

.blog-unordered-list,
.blog-ordered-list {
  @apply mb-6 pl-6 space-y-2;
  @apply bg-gray-800 bg-opacity-30;
  @apply py-4 pr-4 rounded-lg;
}

.blog-list-item {
  @apply text-gray-300 leading-relaxed;
}

.blog-unordered-list .blog-list-item {
  @apply list-disc;
}

.blog-ordered-list .blog-list-item {
  @apply list-decimal;
}

/* Custom list markers */
.blog-unordered-list .blog-list-item::marker {
  @apply text-brand-primary;
}

.blog-ordered-list .blog-list-item::marker {
  @apply text-brand-primary font-bold;
}

/* Nested lists */
.blog-unordered-list .blog-unordered-list,
.blog-unordered-list .blog-ordered-list,
.blog-ordered-list .blog-unordered-list,
.blog-ordered-list .blog-ordered-list {
  @apply mt-2 mb-0 ml-4;
  @apply bg-transparent py-0;
}

/* Task lists */
.blog-task-item {
  @apply list-none flex items-start gap-2;
}

.blog-task-checkbox {
  @apply mt-1;
}

/* ============================================
   CODE BLOCKS
   ============================================ */

.blog-code-block {
  @apply relative my-6 rounded-lg overflow-hidden;
  @apply bg-gray-900 border border-gray-700;
}

.blog-code-lang {
  @apply absolute top-0 right-0;
  @apply px-3 py-1 text-xs;
  @apply bg-gray-800 text-brand-primary;
  @apply rounded-bl-lg font-mono;
}

.blog-code-block pre {
  @apply p-4 md:p-6 overflow-x-auto;
  @apply text-sm md:text-base;
}

.blog-code-block code {
  @apply text-gray-200 font-mono;
  @apply bg-transparent p-0 rounded-none;
  white-space: pre;
}

/* Inline code */
.blog-inline-code {
  @apply bg-gray-800 text-brand-primary;
  @apply px-2 py-0.5 rounded;
  @apply text-sm font-mono;
  @apply border border-gray-700;
}

/* ============================================
   BLOCKQUOTES
   ============================================ */

.blog-blockquote {
  @apply my-6 pl-6 pr-4 py-4;
  @apply border-l-4 border-brand-primary;
  @apply bg-gradient-to-r from-gray-800 to-transparent;
  @apply rounded-r-lg;
  position: relative;
}

.blog-blockquote::before {
  content: '"';
  @apply text-brand-primary text-4xl font-bold;
  @apply absolute -top-2 left-2 opacity-50;
}

.blog-blockquote p {
  @apply mb-0 text-gray-200 italic;
}

.blog-blockquote p:last-child {
  @apply mb-0;
}

/* ============================================
   TABLES
   ============================================ */

.blog-table-wrapper {
  @apply my-6 overflow-x-auto;
  @apply rounded-lg border border-gray-700;
  @apply bg-gray-800 bg-opacity-50;
}

.blog-table {
  @apply w-full min-w-full;
  border-collapse: separate;
  border-spacing: 0;
}

.blog-table-head {
  @apply bg-gray-900 bg-opacity-80;
}

.blog-table-header {
  @apply px-4 py-3 text-left;
  @apply text-brand-primary font-bold;
  @apply border-b-2 border-gray-700;
  @apply border-r border-gray-700;
  @apply text-sm md:text-base;
}

.blog-table-header:last-child {
  @apply border-r-0;
}

.blog-table-cell {
  @apply px-4 py-3 text-left;
  @apply text-gray-300;
  @apply border-b border-gray-700;
  @apply border-r border-gray-700;
  @apply text-sm md:text-base;
}

.blog-table-cell:last-child {
  @apply border-r-0;
}

.blog-table-row:last-child .blog-table-cell {
  @apply border-b-0;
}

.blog-table-row:hover {
  @apply bg-gray-700 bg-opacity-30;
}

/* ============================================
   IMAGES & MEDIA
   ============================================ */

.blog-figure {
  @apply my-6 text-center;
}

.blog-image {
  @apply max-w-full h-auto mx-auto;
  @apply rounded-lg shadow-xl;
  @apply border border-gray-700;
}

.blog-figcaption {
  @apply mt-2 text-sm text-gray-400 italic;
}

/* ============================================
   DIVIDERS
   ============================================ */

.blog-divider {
  @apply my-12 border-0;
  height: 2px;
  background: linear-gradient(90deg, transparent, #e6007a, transparent);
}

/* ============================================
   UTILITIES
   ============================================ */

.blog-error {
  @apply p-4 my-4;
  @apply bg-red-900 bg-opacity-30;
  @apply border border-red-700 rounded-lg;
  @apply text-red-400;
}

/* ============================================
   RESPONSIVE ADJUSTMENTS
   ============================================ */

@media (max-width: 768px) {
  .blog-h1 {
    @apply text-2xl mt-6 mb-4;
  }
  
  .blog-h2 {
    @apply text-xl mt-8 mb-4 pt-3;
  }
  
  .blog-h3 {
    @apply text-lg mt-6 mb-3;
  }
  
  .blog-paragraph {
    @apply text-base mb-4;
  }
  
  .blog-unordered-list,
  .blog-ordered-list {
    @apply pl-4 py-3;
  }
  
  .blog-code-block pre {
    @apply p-3 text-xs;
  }
  
  .blog-table-header,
  .blog-table-cell {
    @apply px-2 py-2 text-xs;
  }
  
  .blog-blockquote {
    @apply pl-4 py-3;
  }
  
  .blog-divider {
    @apply my-8;
  }
}

/* ============================================
   SMOOTH SCROLLING FOR ANCHOR LINKS
   ============================================ */

html {
  scroll-behavior: smooth;
}

/* Offset for fixed headers */
.blog-h1[id],
.blog-h2[id],
.blog-h3[id],
.blog-h4[id],
.blog-h5[id],
.blog-h6[id] {
  scroll-margin-top: 5rem;
}

/* ============================================
   PRINT STYLES
   ============================================ */

@media print {
  .blog-content {
    color: #000;
  }
  
  .blog-h1,
  .blog-h2,
  .blog-h3,
  .blog-h4,
  .blog-h5,
  .blog-h6,
  .blog-strong {
    color: #000;
  }
  
  .blog-paragraph,
  .blog-list-item {
    color: #333;
  }
  
  .blog-link {
    color: #000;
    text-decoration: underline;
  }
  
  .blog-code-block,
  .blog-inline-code {
    background: #f5f5f5;
    border: 1px solid #ddd;
  }
  
  .blog-table-wrapper {
    border: 1px solid #ddd;
  }
  
  .blog-divider {
    background: #ddd;
  }
}
</style>