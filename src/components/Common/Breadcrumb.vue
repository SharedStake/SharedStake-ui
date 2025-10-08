<template>
  <nav class="breadcrumb" aria-label="Breadcrumb">
    <ol class="breadcrumb-list">
      <li 
        v-for="(crumb, index) in breadcrumbs" 
        :key="index"
        class="breadcrumb-item"
        :class="{ 'breadcrumb-item--active': index === breadcrumbs.length - 1 }"
      >
        <router-link 
          v-if="index < breadcrumbs.length - 1"
          :to="crumb.url"
          class="breadcrumb-link"
        >
          {{ crumb.name }}
        </router-link>
        <span 
          v-else
          class="breadcrumb-current"
          aria-current="page"
        >
          {{ crumb.name }}
        </span>
        <svg 
          v-if="index < breadcrumbs.length - 1"
          class="breadcrumb-separator"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </li>
    </ol>
  </nav>
</template>

<script>
import { useStructuredData } from '@/composables/useStructuredData.js';

export default {
  name: 'Breadcrumb',
  props: {
    items: {
      type: Array,
      required: true,
      validator: (items) => {
        return items.every(item => 
          typeof item === 'object' && 
          typeof item.name === 'string' && 
          typeof item.url === 'string'
        );
      }
    }
  },
  setup() {
    const { generateBreadcrumbSchema, injectSchema, removeSchema } = useStructuredData();
    return { generateBreadcrumbSchema, injectSchema, removeSchema };
  },
  computed: {
    breadcrumbs() {
      return this.items;
    }
  },
  mounted() {
    this.injectBreadcrumbSchema();
  },
  updated() {
    this.injectBreadcrumbSchema();
  },
  beforeUnmount() {
    this.removeSchema('breadcrumb-schema');
  },
  methods: {
    injectBreadcrumbSchema() {
      // Remove existing breadcrumb schema
      this.removeSchema('breadcrumb-schema');
      
      // Generate and inject new breadcrumb schema
      const breadcrumbSchema = this.generateBreadcrumbSchema(this.breadcrumbs);
      if (breadcrumbSchema) {
        this.injectSchema(breadcrumbSchema, 'breadcrumb-schema');
      }
    }
  }
};
</script>

<style scoped>
.breadcrumb {
  margin-bottom: 1rem;
}

.breadcrumb-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 0.875rem;
  color: #9ca3af;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
}

.breadcrumb-item:not(:last-child) {
  margin-right: 0.5rem;
}

.breadcrumb-link {
  color: #9ca3af;
  text-decoration: none;
  transition: color 0.2s ease;
}

.breadcrumb-link:hover {
  color: #ff6b6b;
}

.breadcrumb-current {
  color: #ffffff;
  font-weight: 500;
}

.breadcrumb-separator {
  width: 1rem;
  height: 1rem;
  margin-left: 0.5rem;
  color: #6b7280;
}

.breadcrumb-item--active .breadcrumb-separator {
  display: none;
}

/* Mobile responsive */
@media (max-width: 640px) {
  .breadcrumb-list {
    font-size: 0.75rem;
  }
  
  .breadcrumb-separator {
    width: 0.875rem;
    height: 0.875rem;
    margin-left: 0.25rem;
  }
}
</style>