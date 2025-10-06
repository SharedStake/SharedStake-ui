<template>
  <div class="BlogPost min-h-screen bg-gray-900 text-white">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen pt-32">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
        <p class="text-gray-400">Loading post...</p>
      </div>
    </div>

    <!-- Post Not Found -->
    <div v-else-if="!post" class="flex items-center justify-center min-h-screen pt-32">
      <div class="text-center">
        <h1 class="text-4xl font-bold mb-4">Post Not Found</h1>
        <p class="text-gray-400 mb-8">The blog post you're looking for doesn't exist.</p>
        <router-link 
          to="/blog"
          class="bg-brand-primary text-white px-6 py-3 rounded-full font-semibold hover:bg-pink-600 transition-colors"
        >
          Back to Blog
        </router-link>
      </div>
    </div>

    <!-- Blog Post Content -->
    <div v-else>
      <!-- Hero Section - Added proper top padding to account for fixed header -->
      <div class="relative pt-32 pb-12 md:pt-40 md:pb-16 px-4">
        <div class="max-w-4xl mx-auto">
          <!-- Breadcrumb -->
          <nav class="mb-6 md:mb-8">
            <ol class="flex items-center space-x-2 text-xs md:text-sm text-gray-400 flex-wrap">
              <li>
                <router-link to="/" class="hover:text-white transition-colors">Home</router-link>
              </li>
              <li class="flex items-center">
                <svg class="w-4 h-4 mx-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
                </svg>
                <router-link to="/blog" class="hover:text-white transition-colors">Blog</router-link>
              </li>
              <li class="flex items-center">
                <svg class="w-4 h-4 mx-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
                </svg>
                <span class="text-white">{{ post.title }}</span>
              </li>
            </ol>
          </nav>

          <!-- Post Header -->
          <div class="mb-6 md:mb-8">
            <div class="flex items-center gap-2 mb-3 md:mb-4 flex-wrap">
              <span 
                v-if="post.featured"
                class="bg-brand-primary text-white px-2 py-1 md:px-3 rounded-full text-xs md:text-sm font-semibold"
              >
                Featured
              </span>
              <span class="text-xs md:text-sm text-gray-400">{{ formatDate(post.publishDate) }}</span>
            </div>
            <h1 class="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 leading-tight">{{ post.title }}</h1>
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between text-gray-400 gap-2">
              <span class="text-sm md:text-base">By {{ post.author }}</span>
              <div class="flex gap-2 flex-wrap">
                <span 
                  v-for="tag in post.tags" 
                  :key="tag"
                  class="bg-gray-700 px-2 py-1 md:px-3 rounded-full text-xs md:text-sm"
                >
                  {{ formatTag(tag) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Post Content -->
      <div class="py-6 md:py-8 px-4">
        <div class="max-w-4xl mx-auto">
          <article class="prose prose-lg prose-invert max-w-none">
            <div v-html="post.content" class="blog-content"></div>
          </article>

          <!-- Post Footer -->
          <div class="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-gray-700">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <span class="text-gray-400 text-sm md:text-base">Share this post:</span>
                <div class="flex gap-2">
                  <a 
                    :href="twitterShareUrl" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    class="bg-gray-700 hover:bg-blue-500 text-white p-2 rounded transition-colors"
                    title="Share on Twitter"
                  >
                    <svg class="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </a>
                  <a 
                    :href="linkedinShareUrl" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    class="bg-gray-700 hover:bg-blue-600 text-white p-2 rounded transition-colors"
                    title="Share on LinkedIn"
                  >
                    <svg class="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                </div>
              </div>
              <router-link 
                to="/blog"
                class="text-brand-primary hover:text-pink-400 font-semibold transition-colors text-sm md:text-base"
              >
                ← Back to Blog
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- Related Posts -->
      <div v-if="relatedPosts.length > 0" class="py-12 md:py-16 px-4 bg-gray-800">
        <div class="max-w-6xl mx-auto">
          <h2 class="text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-center">Related Posts</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
            <article 
              v-for="relatedPost in relatedPosts" 
              :key="relatedPost.id"
              class="bg-gray-700 rounded-lg p-4 md:p-6 hover:bg-gray-600 transition-colors"
            >
              <h3 class="text-lg md:text-xl font-bold mb-2 md:mb-3 hover:text-brand-primary transition-colors">
                <router-link :to="`/blog/${relatedPost.slug}`">
                  {{ relatedPost.title }}
                </router-link>
              </h3>
              <p class="text-gray-300 mb-3 md:mb-4 line-clamp-2 text-sm md:text-base">{{ relatedPost.excerpt }}</p>
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs md:text-sm text-gray-400 gap-2">
                <span>{{ formatDate(relatedPost.publishDate) }}</span>
                <router-link 
                  :to="`/blog/${relatedPost.slug}`"
                  class="text-brand-primary hover:text-pink-400 font-semibold transition-colors"
                >
                  Read More →
                </router-link>
              </div>
            </article>
          </div>
        </div>
      </div>

      <!-- CTA Section -->
      <div class="py-12 md:py-16 px-4 bg-gradient-to-r from-brand-primary to-pink-600">
        <div class="max-w-4xl mx-auto text-center">
          <h2 class="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6">Ready to Start Staking?</h2>
          <p class="text-lg md:text-xl mb-6 md:mb-8 text-white/90 px-4">
            Join thousands of users earning rewards with SharedStake's liquid staking protocol.
          </p>
          <div class="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
            <router-link 
              to="/stake"
              class="bg-white text-brand-primary px-6 py-3 md:px-8 rounded-full font-semibold hover:bg-gray-100 transition-colors text-sm md:text-base"
            >
              Start Staking
            </router-link>
            <router-link 
              to="/earn"
              class="border-2 border-white text-white px-6 py-3 md:px-8 rounded-full font-semibold hover:bg-white hover:text-brand-primary transition-colors text-sm md:text-base"
            >
              View Rewards
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { blogPosts, getBlogPostBySlug } from './data/index.js';

export default {
  name: 'BlogPost',
  data() {
    return {
      post: null,
      loading: true,
    };
  },
  computed: {
    relatedPosts() {
      if (!this.post) return [];
      
      // Find posts with similar tags (excluding current post)
      const currentTags = this.post.tags;
      const related = blogPosts
        .filter(p => p.id !== this.post.id)
        .filter(p => p.tags.some(tag => currentTags.includes(tag)))
        .slice(0, 3);
      
      return related;
    },
    twitterShareUrl() {
      if (!this.post) return '';
      const url = encodeURIComponent(window.location.href);
      const text = encodeURIComponent(this.post.title);
      return `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
    },
    linkedinShareUrl() {
      if (!this.post) return '';
      const url = encodeURIComponent(window.location.href);
      return `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    }
  },
  watch: {
    '$route.params.slug': {
      immediate: true,
      handler(newSlug) {
        this.loadPost(newSlug);
      }
    }
  },
  methods: {
    loadPost(slug) {
      this.loading = true;
      this.post = null;
      
      // Simulate loading delay for better UX
      setTimeout(() => {
        this.post = getBlogPostBySlug(slug);
        this.loading = false;
        
        if (this.post) {
          this.setPageMeta();
        }
      }, 300);
    },
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    },
    formatTag(tag) {
      return tag.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    },
    setPageMeta() {
      if (!this.post) return;
      
      // Set page title
      document.title = `${this.post.title} - SharedStake Blog`;
      
      // Set meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', this.post.meta.description);
      } else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = this.post.meta.description;
        document.head.appendChild(meta);
      }
      
      // Set Open Graph tags
      this.setOpenGraphTags();
      
      // Set structured data
      this.setStructuredData();
    },
    setOpenGraphTags() {
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) {
        ogTitle.setAttribute('content', this.post.title);
      } else {
        const meta = document.createElement('meta');
        meta.setAttribute('property', 'og:title');
        meta.content = this.post.title;
        document.head.appendChild(meta);
      }
      
      const ogDescription = document.querySelector('meta[property="og:description"]');
      if (ogDescription) {
        ogDescription.setAttribute('content', this.post.meta.description);
      } else {
        const meta = document.createElement('meta');
        meta.setAttribute('property', 'og:description');
        meta.content = this.post.meta.description;
        document.head.appendChild(meta);
      }
      
      const ogUrl = document.querySelector('meta[property="og:url"]');
      if (ogUrl) {
        ogUrl.setAttribute('content', window.location.href);
      } else {
        const meta = document.createElement('meta');
        meta.setAttribute('property', 'og:url');
        meta.content = window.location.href;
        document.head.appendChild(meta);
      }
    },
    setStructuredData() {
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": this.post.title,
        "description": this.post.meta.description,
        "author": {
          "@type": "Organization",
          "name": this.post.author
        },
        "publisher": {
          "@type": "Organization",
          "name": "SharedStake",
          "logo": {
            "@type": "ImageObject",
            "url": `${window.location.origin}/logo-white.svg`
          }
        },
        "datePublished": this.post.publishDate,
        "dateModified": this.post.publishDate,
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": window.location.href
        }
      };
      
      // Remove existing structured data
      const existingScript = document.querySelector('script[type="application/ld+json"]');
      if (existingScript) {
        existingScript.remove();
      }
      
      // Add new structured data
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }
  }
};
</script>

<style scoped>
/* Minimal custom utilities */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Blog content styling - Responsive with Tailwind classes */
.blog-content {
  @apply text-gray-300 leading-relaxed max-w-none;
}

/* Simple heading styles */
.blog-content h1 {
  @apply text-3xl md:text-4xl font-bold text-white mb-6 mt-8;
}

.blog-content h2 {
  @apply text-2xl md:text-3xl font-bold text-brand-primary mb-6 mt-10 pt-6 relative pl-6 -mx-4 px-4 py-3 rounded-lg;
  background: linear-gradient(to right, rgba(131, 24, 67, 0.1), transparent);
}

.blog-content h2::before {
  content: '';
  @apply absolute left-2 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-brand-primary to-pink-500 rounded;
}

.blog-content h3 {
  @apply text-xl md:text-2xl font-bold text-white mb-4 mt-8 pt-4 border-l-4 border-pink-500 pl-4;
}

.blog-content h4 {
  @apply text-lg md:text-xl font-semibold text-gray-100 mb-3 mt-6 pt-2;
}

.blog-content h5, .blog-content h6 {
  @apply text-base md:text-lg font-semibold text-gray-300 mb-3 mt-4;
}

/* Paragraphs with responsive spacing and better readability */
.blog-content p {
  @apply mb-6 text-gray-300 text-base md:text-lg leading-relaxed;
}

/* Lists with responsive styling */
.blog-content ul, .blog-content ol {
  @apply mb-6 pl-4 md:pl-6 space-y-3;
}

.blog-content li {
  @apply text-gray-300 leading-relaxed text-base md:text-lg;
}

.blog-content ul li {
  @apply list-disc;
}

.blog-content ol li {
  @apply list-decimal;
}

/* Nested lists */
.blog-content ul ul, .blog-content ol ol, .blog-content ul ol, .blog-content ol ul {
  @apply mt-3 mb-3 ml-4 md:ml-6;
}

.blog-content li > p {
  @apply mb-2;
}

/* Strong and emphasis */
.blog-content strong {
  @apply text-white font-bold;
}

.blog-content em {
  @apply text-gray-100 italic;
}

/* Links */
.blog-content a {
  @apply text-brand-primary underline hover:text-pink-400 transition-colors duration-200;
}

/* Code styling with responsive design */
.blog-content code {
  @apply bg-gray-800 bg-opacity-50 text-brand-primary px-2 py-0.5 rounded text-xs md:text-sm font-mono border border-gray-700;
  word-break: break-word;
}

.blog-content pre {
  @apply bg-gray-800 bg-opacity-50 backdrop-blur-sm border border-gray-700 rounded-lg my-6 md:my-8;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.blog-content pre code {
  @apply bg-transparent border-0 p-4 md:p-6 text-gray-200 text-xs md:text-sm block;
  word-break: normal;
  white-space: pre;
}

/* Add scroll indicator for code blocks on mobile */
@media (max-width: 640px) {
  .blog-content pre {
    margin-left: -1rem;
    margin-right: -1rem;
    border-radius: 0;
  }
}

/* Blockquotes with responsive design */
.blog-content blockquote {
  @apply border-l-4 border-brand-primary bg-pink-900 bg-opacity-10 my-6 p-4 md:p-6 italic text-gray-300 rounded-r-lg;
}

.blog-content blockquote p {
  @apply mb-0;
}

/* Tables with responsive design - No horizontal scrolling on mobile */
.blog-content .table-wrapper {
  @apply my-8 -mx-4 px-4 md:mx-0 md:px-0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* Create a shadow effect to indicate scrollable area */
.blog-content .table-wrapper::before,
.blog-content .table-wrapper::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 30px;
  pointer-events: none;
  z-index: 1;
}

.blog-content .table-wrapper::before {
  left: 0;
  background: linear-gradient(to right, rgba(15, 16, 19, 1), transparent);
}

.blog-content .table-wrapper::after {
  right: 0;
  background: linear-gradient(to left, rgba(15, 16, 19, 1), transparent);
}

.blog-content table {
  @apply border-collapse bg-gray-800 bg-opacity-30 backdrop-blur-sm rounded-lg overflow-hidden;
  min-width: 100%;
  width: max-content;
}

.blog-content th, .blog-content td {
  @apply text-left border-b border-gray-700;
  padding: 0.75rem 1rem;
  white-space: nowrap;
}

/* Responsive padding for mobile */
@media (max-width: 640px) {
  .blog-content th, .blog-content td {
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
  }
}

.blog-content th {
  @apply bg-gray-900 bg-opacity-80 text-brand-primary font-bold uppercase tracking-wider text-xs md:text-sm;
}

.blog-content td {
  @apply text-gray-300 text-sm md:text-base;
}

.blog-content tbody tr {
  @apply transition-colors duration-200;
}

.blog-content tbody tr:hover {
  @apply bg-gray-700 bg-opacity-20;
}

.blog-content tbody tr:last-child td {
  @apply border-b-0;
}

/* Horizontal rules */
.blog-content hr {
  @apply border-0 h-0.5 bg-gradient-to-r from-transparent via-brand-primary to-transparent my-8 md:my-12;
}

/* Lists with custom styling for better readability */
/* Removed ::marker styles for compatibility */

/* Mobile-specific adjustments */
@media (max-width: 768px) {
  .blog-content h1 {
    @apply text-2xl mt-8 pt-4;
  }
  
  .blog-content h2 {
    @apply text-xl mt-6 pt-4 pl-4;
    margin-left: -1rem;
    margin-right: -1rem;
    padding-left: 1rem;
    padding-right: 1rem;
  }
  
  .blog-content h2::before {
    left: 0.5rem;
  }
  
  .blog-content h3 {
    @apply text-lg mt-4 pt-2 pl-3;
  }
  
  .blog-content h4 {
    @apply text-base;
  }
  
  .blog-content p {
    @apply text-base;
  }
  
  .blog-content li {
    @apply text-base;
  }
  
  /* Ensure content doesn't overflow on mobile */
  .blog-content {
    word-wrap: break-word;
    overflow-wrap: break-word;
    hyphens: auto;
  }
  
  /* Better table wrapper positioning */
  .blog-content .table-wrapper {
    position: relative;
    max-width: 100vw;
  }
}

/* Enhanced styling for the expanded blog post - Using Tailwind classes */
/* All styling now handled by Tailwind classes above */

/* Prose styling for better readability */
.prose {
  max-width: none;
}

.prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
  color: #ffffff;
}

.prose p {
  color: #d1d5db;
}

.prose ul, .prose ol {
  color: #d1d5db;
}

.prose li {
  color: #d1d5db;
}

.prose strong {
  color: #ffffff;
}

.prose a {
  color: #e6007a;
}

.prose a:hover {
  color: #f472b6;
}

/* Markdown table styles with better mobile handling */
.blog-content .table-wrapper {
  @apply my-8 -mx-4 px-4 md:mx-0 md:px-0 overflow-x-auto;
}

.blog-content .responsive-table {
  @apply min-w-full border-collapse text-sm;
}

.blog-content .responsive-table thead {
  @apply bg-gray-800 border-b-2 border-brand-primary;
}

.blog-content .responsive-table th {
  @apply text-brand-primary font-bold text-xs md:text-sm p-2 md:p-3 text-left;
  white-space: nowrap;
}

.blog-content .responsive-table td {
  @apply bg-gray-900 text-gray-300 text-xs md:text-sm p-2 md:p-3 border-b border-gray-800;
}

.blog-content .responsive-table tbody tr:nth-child(even) {
  @apply bg-gray-800;
}

.blog-content .responsive-table tbody tr:hover {
  @apply bg-gray-700;
}

/* Mobile-specific table handling */
@media (max-width: 640px) {
  .blog-content .responsive-table {
    font-size: 0.75rem;
  }
  
  .blog-content .responsive-table th,
  .blog-content .responsive-table td {
    padding: 0.5rem;
  }
}

/* Enhanced code block styles for better readability */
.blog-content .code-block {
  @apply bg-gray-900 border border-gray-700 rounded-lg my-8 overflow-x-auto;
}

.blog-content .code-block code {
  @apply text-gray-200 text-xs md:text-sm font-mono block p-4;
  line-height: 1.6;
}

.blog-content .inline-code {
  @apply bg-gray-800 text-brand-primary px-1 py-0.5 rounded text-xs md:text-sm font-mono;
}

/* Mobile-specific code block handling */
@media (max-width: 640px) {
  .blog-content .code-block {
    @apply -mx-4 rounded-none border-x-0;
  }
  
  .blog-content .code-block code {
    @apply text-xs p-3;
  }
}

/* Enhanced heading styles with better visual hierarchy */
.blog-content .heading-1 {
  @apply text-3xl md:text-4xl font-bold text-white mb-6 mt-12 pb-4 border-b-2 border-brand-primary;
}

.blog-content .heading-2,
.blog-content .section-header {
  @apply text-2xl md:text-3xl font-bold text-white mb-6 mt-12 pt-8 pb-2 border-t border-gray-800;
}

.blog-content .heading-3,
.blog-content .subsection-header {
  @apply text-lg md:text-xl font-bold text-brand-primary mb-4 mt-8 pl-4 border-l-4 border-brand-primary;
}

.blog-content .heading-4 {
  @apply text-base md:text-lg font-semibold text-gray-100 mb-3 mt-6;
}

.blog-content .heading-5,
.blog-content .heading-6 {
  @apply text-sm md:text-base font-semibold text-gray-300 mb-2 mt-4;
}

/* Paragraph styles with adjusted sizing */
.blog-content p {
  @apply mb-4 text-gray-400 text-sm md:text-base leading-relaxed;
}

/* Add spacing after horizontal rules */
.blog-content hr {
  @apply my-12 border-t border-gray-700;
}

.blog-content .unordered-list,
.blog-content .ordered-list {
  @apply my-6 pl-6 space-y-2 text-sm md:text-base;
}

.blog-content .unordered-list li {
  @apply list-disc text-gray-400;
}

.blog-content .ordered-list li {
  @apply list-decimal text-gray-400;
}

/* List styles use default markers */

.blog-content .blockquote {
  @apply border-l-4 border-brand-primary pl-6 my-8 italic text-gray-300 bg-gray-800 py-4 pr-4 rounded-r-lg;
}

.blog-content .blockquote p {
  @apply mb-0 text-sm md:text-base;
}

/* Simple text styles */
.blog-content strong {
  @apply text-white font-bold;
}

.blog-content em {
  @apply italic;
}

.blog-content hr {
  @apply my-8 border-t border-gray-700;
}

/* Simple link styles */
.blog-content a {
  @apply text-brand-primary hover:text-pink-400 underline;
}

/* Keep mobile styles minimal */
@media (max-width: 768px) {
  .blog-content .heading-1 {
    @apply text-2xl;
  }
  
  .blog-content .heading-2,
  .blog-content .section-header {
    @apply text-xl;
  }
  
  .blog-content .heading-3,
  .blog-content .subsection-header {
    @apply text-lg;
  }
  
  .blog-content p {
    @apply text-sm;
  }
  
  .blog-content .code-block {
    @apply rounded-none mx-0;
  }
}
</style>