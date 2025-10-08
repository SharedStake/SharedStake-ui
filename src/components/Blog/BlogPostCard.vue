<template>
  <div 
    :class="[
      'group transition-all duration-300',
      variant === 'featured' 
        ? 'bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl hover:transform hover:scale-105' 
        : 'bg-gray-800/50 hover:bg-gray-800/80 rounded-xl p-6'
    ]"
  >
    <div v-if="variant === 'featured'" class="p-6">
      <div class="flex items-center mb-4">
        <span class="bg-brand-primary text-white px-3 py-1 rounded-full text-sm font-semibold">
          Featured
        </span>
      </div>
      <h3 class="text-xl font-bold mb-3 line-clamp-2">{{ post.title }}</h3>
      <p class="text-gray-300 mb-4 line-clamp-3">{{ post.excerpt }}</p>
      <div class="flex items-center justify-between text-sm text-gray-400">
        <span>{{ formatDate(post.publishDate) }}</span>
        <span>{{ post.author }}</span>
      </div>
      <router-link 
        :to="`/blog/${post.slug}`"
        class="inline-block mt-4 text-brand-primary hover:text-pink-400 font-semibold transition-colors"
      >
        Read More →
      </router-link>
    </div>

    <div v-else-if="variant === 'list'" class="flex flex-col md:flex-row md:items-start gap-4">
      <div class="flex-1">
        <div class="flex items-center gap-2 mb-3">
          <span 
            v-if="post.featured"
            class="bg-brand-primary text-white px-2 py-1 rounded text-xs font-semibold"
          >
            Featured
          </span>
          <span class="text-sm text-gray-400">{{ formatDate(post.publishDate) }}</span>
        </div>
        <h3 class="text-xl font-bold mb-3 hover:text-brand-primary transition-colors">
          <router-link :to="`/blog/${post.slug}`">
            {{ post.title }}
          </router-link>
        </h3>
        <p class="text-gray-300 mb-4 line-clamp-2">{{ post.excerpt }}</p>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4 text-sm text-gray-400">
            <span>By {{ post.author }}</span>
            <div class="flex gap-2">
              <span 
                v-for="tag in post.tags.slice(0, 3)" 
                :key="tag"
                class="bg-gray-700 px-2 py-1 rounded text-xs"
              >
                {{ formatTag(tag) }}
              </span>
            </div>
          </div>
          <router-link 
            :to="`/blog/${post.slug}`"
            class="text-brand-primary hover:text-pink-400 font-semibold transition-colors"
          >
            Read More →
          </router-link>
        </div>
      </div>
    </div>

    <div v-else-if="variant === 'related'" class="group">
      <div class="flex items-center gap-2 mb-3">
        <span 
          v-for="tag in post.tags.slice(0, 2)" 
          :key="tag"
          class="bg-brand-primary/20 text-brand-primary px-2 py-1 rounded-full text-xs font-medium"
        >
          {{ formatTag(tag) }}
        </span>
      </div>
      <h4 class="text-lg font-semibold mb-2 group-hover:text-brand-primary transition-colors">
        {{ post.title }}
      </h4>
      <p class="text-gray-400 text-sm mb-3 line-clamp-2">
        {{ post.excerpt }}
      </p>
      <div class="flex items-center justify-between text-xs text-gray-500">
        <span>{{ formatDate(post.publishDate) }}</span>
        <span class="group-hover:text-brand-primary transition-colors">Read more →</span>
      </div>
    </div>
  </div>
</template>

<script>
import { formatDate, formatTag } from '@/utils/blogUtils.js';

export default {
  name: 'BlogPostCard',
  props: {
    post: {
      type: Object,
      required: true
    },
    variant: {
      type: String,
      default: 'list',
      validator: (value) => ['featured', 'list', 'related'].includes(value)
    }
  },
  methods: {
    formatDate,
    formatTag
  }
};
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>