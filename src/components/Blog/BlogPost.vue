<template>
  <div class="BlogPost min-h-screen bg-gray-900 text-white">
    <!-- Import global blog styles -->
    <BlogStyles />
    
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
        <p class="text-gray-400">Loading post...</p>
      </div>
    </div>

    <!-- Post Not Found -->
    <div v-else-if="!post" class="flex items-center justify-center min-h-screen">
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
      <!-- Hero Section -->
      <div class="relative pt-32 pb-12 md:pt-36 md:pb-16 px-4">
        <div class="max-w-4xl mx-auto">
          <!-- Featured Image -->
          <div v-if="featuredImageUrl" class="mb-8">
            <LazyImage
              :src="featuredImageUrl"
              :alt="featuredImageAlt"
              class="w-full h-64 md:h-80 object-cover rounded-lg shadow-lg"
              container-class="w-full"
            />
          </div>
          
          <!-- Post Header -->
          <div class="mb-6 md:mb-8">
            <div class="flex items-center gap-2 mb-3 md:mb-4 flex-wrap">
              <span 
                v-for="tag in post.tags" 
                :key="tag"
                class="bg-brand-primary/20 text-brand-primary px-3 py-1 rounded-full text-sm font-medium"
              >
                {{ formatTag(tag) }}
              </span>
            </div>
            
            <h1 class="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 leading-tight">
              {{ post.title }}
            </h1>
            
            <div class="flex items-center gap-4 text-sm md:text-base text-gray-400">
              <span>By {{ post.author }}</span>
              <span>•</span>
              <span>{{ formatDate(post.publishDate) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Post Content -->
      <div class="py-6 md:py-8 px-4">
        <div class="max-w-4xl mx-auto">
          <article class="prose prose-lg prose-invert max-w-none overflow-hidden">
            <div v-html="post.content" class="blog-content"></div>
          </article>

          <!-- Post Footer -->
          <div class="mt-12 pt-8 border-t border-gray-800">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <!-- Share Buttons -->
              <div class="flex items-center gap-4">
                <span class="text-gray-400 font-medium">Share:</span>
                <a 
                  :href="twitterShareUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                  Twitter
                </a>
              </div>

              <!-- Back to Blog -->
              <router-link 
                to="/blog"
                class="inline-flex items-center gap-2 text-brand-primary hover:text-pink-400 transition-colors font-medium"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                </svg>
                Back to Blog
              </router-link>
            </div>
          </div>

          <!-- Related Posts -->
          <div v-if="relatedPosts.length > 0" class="mt-16">
            <h3 class="text-2xl font-bold mb-8">Related Articles</h3>
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <router-link 
                v-for="relatedPost in relatedPosts" 
                :key="relatedPost.id"
                :to="`/blog/${relatedPost.slug}`"
                class="group bg-gray-800/50 hover:bg-gray-800/80 rounded-xl p-6 transition-all duration-300 hover:scale-105"
              >
                <div class="flex items-center gap-2 mb-3">
                  <span 
                    v-for="tag in relatedPost.tags.slice(0, 2)" 
                    :key="tag"
                    class="bg-brand-primary/20 text-brand-primary px-2 py-1 rounded-full text-xs font-medium"
                  >
                    {{ formatTag(tag) }}
                  </span>
                </div>
                <h4 class="text-lg font-semibold mb-2 group-hover:text-brand-primary transition-colors">
                  {{ relatedPost.title }}
                </h4>
                <p class="text-gray-400 text-sm mb-3 line-clamp-2">
                  {{ relatedPost.excerpt }}
                </p>
                <div class="flex items-center justify-between text-xs text-gray-500">
                  <span>{{ formatDate(relatedPost.publishDate) }}</span>
                  <span class="group-hover:text-brand-primary transition-colors">Read more →</span>
                </div>
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { blogPosts, getBlogPostBySlug } from './data/index.js';
import BlogStyles from './BlogStyles.vue';
import LazyImage from '../Common/LazyImage.vue';

export default {
  name: 'BlogPost',
  components: {
    BlogStyles,
    LazyImage
  },
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
    featuredImageUrl() {
      if (!this.post) return null;
      return `/images/blog-${this.post.slug}.jpg`;
    },
    featuredImageAlt() {
      if (!this.post) return '';
      return `${this.post.title} - SharedStake Blog Post`;
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
          // Set page title
          document.title = `${this.post.title} - SharedStake Blog`;
          
          // Set meta description
          this.setMetaDescription();
          
          // Set Open Graph tags
          this.setOpenGraphTags();
          
          // Set Twitter Card tags
          this.setTwitterCardTags();
          
          // Add structured data
          this.addStructuredData();
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
    setMetaDescription() {
      const description = this.post.meta?.description || this.post.excerpt || `${this.post.title} - Learn about Ethereum staking with SharedStake`;
      this.updateMetaTag('description', description);
      this.updateMetaTag('keywords', this.post.meta?.keywords || this.post.tags?.join(', ') || 'ethereum staking, liquid staking, defi');
    },
    setOpenGraphTags() {
      const baseUrl = window.location.origin;
      const postUrl = `${baseUrl}/blog/${this.post.slug}`;
      
      this.updateMetaTag('og:title', this.post.title, 'property');
      this.updateMetaTag('og:description', this.post.excerpt || this.post.meta?.description, 'property');
      this.updateMetaTag('og:url', postUrl, 'property');
      this.updateMetaTag('og:type', 'article', 'property');
      this.updateMetaTag('og:image', `${baseUrl}${this.featuredImageUrl}`, 'property');
      this.updateMetaTag('og:site_name', 'SharedStake', 'property');
      this.updateMetaTag('og:locale', 'en_US', 'property');
      
      // Article specific tags
      this.updateMetaTag('article:author', this.post.author, 'property');
      this.updateMetaTag('article:published_time', new Date(this.post.publishDate).toISOString(), 'property');
      this.updateMetaTag('article:section', 'Ethereum Staking', 'property');
      
      // Add tags as article:tag
      if (this.post.tags) {
        this.post.tags.forEach(tag => {
          this.updateMetaTag('article:tag', tag, 'property');
        });
      }
    },
    setTwitterCardTags() {
      const baseUrl = window.location.origin;
      
      this.updateMetaTag('twitter:card', 'summary_large_image', 'name');
      this.updateMetaTag('twitter:title', this.post.title, 'name');
      this.updateMetaTag('twitter:description', this.post.excerpt || this.post.meta?.description, 'name');
      this.updateMetaTag('twitter:image', `${baseUrl}${this.featuredImageUrl}`, 'name');
      this.updateMetaTag('twitter:site', '@sharedstake', 'name');
      this.updateMetaTag('twitter:creator', '@sharedstake', 'name');
    },
    addStructuredData() {
      const baseUrl = window.location.origin;
      const postUrl = `${baseUrl}/blog/${this.post.slug}`;
      
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": this.post.title,
        "description": this.post.excerpt || this.post.meta?.description,
        "image": `${baseUrl}${this.featuredImageUrl}`,
        "author": {
          "@type": "Organization",
          "name": this.post.author,
          "url": baseUrl
        },
        "publisher": {
          "@type": "Organization",
          "name": "SharedStake",
          "logo": {
            "@type": "ImageObject",
            "url": `${baseUrl}/images/logo-white.svg`
          }
        },
        "datePublished": new Date(this.post.publishDate).toISOString(),
        "dateModified": new Date(this.post.publishDate).toISOString(),
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": postUrl
        },
        "url": postUrl,
        "keywords": this.post.tags?.join(', ') || 'ethereum staking, liquid staking, defi',
        "articleSection": "Ethereum Staking",
        "wordCount": this.post.content ? this.post.content.replace(/<[^>]*>/g, '').split(' ').length : 0
      };
      
      // Remove existing structured data
      const existingScript = document.querySelector('script[type="application/ld+json"][data-blog-post]');
      if (existingScript) {
        existingScript.remove();
      }
      
      // Add new structured data
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-blog-post', 'true');
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    },
    updateMetaTag(name, content, attribute = 'name') {
      if (!content) return;
      
      let meta = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    }
  }
};
</script>