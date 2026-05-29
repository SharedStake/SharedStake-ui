<template>
  <nav
    class="docs-nav"
    aria-label="Documentation sections"
  >
    <div class="docs-nav-title">
      Documentation
    </div>
    <router-link
      v-for="page in pages"
      :key="page.name"
      :to="page.path"
      class="docs-nav-item"
      :class="{ 'docs-nav-item-active': isActive(page.name) }"
    >
      <div class="docs-nav-label">
        {{ page.label }}
      </div>
      <div class="docs-nav-description">
        {{ page.description }}
      </div>
    </router-link>
  </nav>
</template>

<script>
import { docsPages } from "./docsConfig";

export default {
  name: "DocsSideNav",
  data() {
    return {
      pages: docsPages,
    };
  },
  methods: {
    isActive(routeName) {
      return this.$route.name === routeName;
    },
  },
};
</script>

<style scoped>
.docs-nav {
  border: 1px solid #2b3342;
  border-radius: 12px;
  background: #141a25;
  padding: 12px;
}

.docs-nav-title {
  color: #f5f7ff;
  font-size: 0.85rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-bottom: 10px;
  padding: 0 8px;
}

.docs-nav-item {
  display: block;
  text-decoration: none;
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 10px 8px;
  color: #ced6e7;
  transition: background 120ms ease, border-color 120ms ease;
}

.docs-nav-item + .docs-nav-item {
  margin-top: 6px;
}

.docs-nav-item:hover {
  background: #1b2434;
  border-color: #344764;
}

.docs-nav-item-active {
  background: #1a2a45;
  border-color: #4a6a9f;
}

.docs-nav-label {
  font-weight: 600;
  color: #f5f7ff;
}

.docs-nav-description {
  margin-top: 2px;
  font-size: 0.82rem;
  color: #9fb0ce;
  line-height: 1.3;
}
</style>
