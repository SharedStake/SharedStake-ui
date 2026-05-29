<template>
  <article class="docs-page">
    <header class="docs-page-header">
      <p class="docs-kicker">
        SharedStake Docs
      </p>
      <h1 class="docs-title">
        {{ title }}
      </h1>
      <p class="docs-subtitle">
        {{ subtitle }}
      </p>
      <p class="docs-updated">
        Last updated: {{ updatedAt }}
      </p>
    </header>

    <div class="docs-page-body">
      <div class="docs-page-content">
        <slot />
      </div>
      <DocsAnchorNav :items="anchors" />
    </div>
  </article>
</template>

<script>
import DocsAnchorNav from "./DocsAnchorNav.vue";

export default {
  name: "DocsPageFrame",
  components: { DocsAnchorNav },
  props: {
    title: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String,
      required: true,
    },
    updatedAt: {
      type: String,
      required: true,
    },
    anchors: {
      type: Array,
      default: () => [],
    },
  },
};
</script>

<style scoped>
.docs-page {
  color: #d7dfef;
}

.docs-page-header {
  margin-bottom: 18px;
}

.docs-kicker {
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  color: #8ea8d8;
  margin-bottom: 6px;
}

.docs-title {
  color: #ffffff;
  font-size: 2rem;
  line-height: 1.15;
  font-weight: 700;
}

.docs-subtitle {
  color: #b7c4de;
  margin-top: 8px;
  max-width: 840px;
}

.docs-updated {
  color: #8ea2c5;
  margin-top: 10px;
  font-size: 0.9rem;
}

.docs-page-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 240px;
  gap: 20px;
}

.docs-page-content :deep(section) {
  border: 1px solid #263347;
  border-radius: 12px;
  background: #131a25;
  padding: 16px;
}

.docs-page-content :deep(section + section) {
  margin-top: 14px;
}

.docs-page-content :deep(h2) {
  color: #ffffff;
  font-size: 1.25rem;
  line-height: 1.3;
  margin-bottom: 8px;
}

.docs-page-content :deep(h3) {
  color: #ffffff;
  font-size: 1rem;
  margin-bottom: 6px;
}

.docs-page-content :deep(p) {
  color: #d2dbeb;
  line-height: 1.55;
}

.docs-page-content :deep(ul) {
  margin-top: 8px;
  padding-left: 18px;
}

.docs-page-content :deep(li) {
  color: #cfdaed;
  margin-bottom: 5px;
}

.docs-page-content :deep(code) {
  color: #f5f7ff;
  background: #0f1622;
  border: 1px solid #2a3950;
  border-radius: 6px;
  padding: 1px 6px;
  font-size: 0.88em;
}

.docs-page-content :deep(details) {
  border: 1px solid #314462;
  border-radius: 10px;
  background: #172338;
  padding: 10px 12px;
  margin-top: 10px;
}

.docs-page-content :deep(summary) {
  cursor: pointer;
  font-weight: 600;
  color: #ffffff;
}

.docs-page-content :deep(details p),
.docs-page-content :deep(details ul) {
  margin-top: 8px;
}

@media (max-width: 1120px) {
  .docs-page-body {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .docs-title {
    font-size: 1.6rem;
  }
}
</style>
