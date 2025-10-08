<template>
  <div class="Blog min-h-screen bg-gray-900 text-white">
    <!-- Hero Section -->
    <div class="relative pt-32 pb-12 md:pt-36 md:pb-20 px-4 text-center">
      <div class="max-w-4xl mx-auto">
        <!-- Breadcrumb -->
        <Breadcrumb :items="breadcrumbItems" class="mb-8" />
        <h1 class="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-brand-primary to-pink-400 bg-clip-text text-transparent">
          SharedStake Blog
        </h1>
        <p class="text-lg md:text-xl lg:text-2xl text-gray-300 mb-6 md:mb-8 px-4">
          Stay updated with the latest developments in Ethereum liquid staking, DeFi innovations, and the SharedStake ecosystem.
        </p>
      </div>
    </div>

    <!-- Featured Posts Section -->
    <div v-if="featuredPosts.length > 0" class="py-8 md:py-12 px-4">
      <div class="max-w-6xl mx-auto">
        <h2 class="text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-center">Featured Posts</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
          <BlogPostCard 
            v-for="post in featuredPosts" 
            :key="post.id"
            :post="post"
            variant="featured"
          />
        </div>
      </div>
    </div>

    <!-- All Posts Section -->
    <div class="py-8 md:py-12 px-4">
      <div class="max-w-6xl mx-auto">
        <div class="flex flex-col lg:flex-row gap-6 lg:gap-8">
          <!-- Main Content -->
          <div class="lg:w-2/3">
            <h2 class="text-2xl md:text-3xl font-bold mb-6 md:mb-8">All Posts</h2>
            
            <!-- Filter Tabs -->
            <div class="flex flex-wrap gap-2 mb-6 md:mb-8">
              <button 
                @click="selectedTag = null"
                :class="[
                  'px-3 py-2 md:px-4 rounded-full text-xs md:text-sm font-semibold transition-colors',
                  selectedTag === null 
                    ? 'bg-brand-primary text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                ]"
              >
                All Posts
              </button>
              <button 
                v-for="tag in allTags" 
                :key="tag"
                @click="selectedTag = tag"
                :class="[
                  'px-3 py-2 md:px-4 rounded-full text-xs md:text-sm font-semibold transition-colors',
                  selectedTag === tag 
                    ? 'bg-brand-primary text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                ]"
              >
                {{ formatTag(tag) }}
              </button>
            </div>

            <!-- Posts List -->
            <div class="space-y-4 md:space-y-6">
              <BlogPostCard 
                v-for="post in filteredPosts" 
                :key="post.id"
                :post="post"
                variant="list"
              />
            </div>

            <!-- No Posts Message -->
            <div v-if="filteredPosts.length === 0" class="text-center py-12">
              <p class="text-gray-400 text-lg">No posts found for the selected filter.</p>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="lg:w-1/3">
            <div class="bg-gray-800 rounded-lg p-4 md:p-6 sticky top-40">
              <h3 class="text-lg md:text-xl font-bold mb-4 md:mb-6">About Our Blog</h3>
              <p class="text-gray-300 mb-4 md:mb-6 text-sm md:text-base">
                Stay informed about the latest developments in Ethereum liquid staking, 
                DeFi innovations, and the SharedStake ecosystem. Our blog covers everything 
                from technical updates to market insights.
              </p>
              
              <h4 class="text-base md:text-lg font-semibold mb-3 md:mb-4">Popular Tags</h4>
              <div class="flex flex-wrap gap-2">
                <span 
                  v-for="tag in allTags.slice(0, 8)" 
                  :key="tag"
                  @click="selectedTag = tag"
                  class="bg-gray-700 hover:bg-brand-primary text-gray-300 hover:text-white px-2 py-1 md:px-3 rounded-full text-xs md:text-sm cursor-pointer transition-colors"
                >
                  {{ formatTag(tag) }}
                </span>
              </div>
            </div>
          </div>
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
</template>

<script>
import Breadcrumb from '@/components/Common/Breadcrumb.vue';
import BlogPostCard from './BlogPostCard.vue';
import { useBlog } from '@/composables/useBlog.js';

export default {
  name: 'Blog',
  components: {
    Breadcrumb,
    BlogPostCard
  },
  data() {
    const blogUtils = useBlog();
    return {
      selectedTag: null,
      ...blogUtils
    };
  },
  computed: {
    breadcrumbItems() {
      return this.getBreadcrumbItems();
    },
    featuredPosts() {
      return this.getFeaturedPosts();
    },
    allTags() {
      return this.getAllTags();
    },
    filteredPosts() {
      return this.getFilteredPosts(this.selectedTag);
    }
  },
  mounted() {
    this.setPageMeta(
      'Blog - SharedStake',
      'Stay updated with the latest developments in Ethereum liquid staking, DeFi innovations, and the SharedStake ecosystem.'
    );
  }
};
</script>

<style scoped>
/* Smooth scrolling for anchor links */
html {
  scroll-behavior: smooth;
}
</style>