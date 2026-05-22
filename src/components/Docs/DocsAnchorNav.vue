<template>
  <aside
    v-if="items.length"
    class="anchor-nav"
    aria-label="On this page"
  >
    <div class="anchor-nav-title">
      On This Page
    </div>
    <a
      v-for="item in items"
      :key="item.id"
      :href="`#${item.id}`"
      class="anchor-link"
    >
      {{ item.label }}
    </a>
  </aside>
</template>

<script>
export default {
  name: "DocsAnchorNav",
  props: {
    items: {
      type: Array,
      default: () => [],
    },
  },
};
</script>

<style scoped>
.anchor-nav {
  border: 1px solid #2b3342;
  border-radius: 12px;
  background: #141a25;
  padding: 12px;
}

.anchor-nav-title {
  color: #f5f7ff;
  font-size: 0.8rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.anchor-link {
  display: block;
  color: #b7c4de;
  text-decoration: none;
  padding: 6px 0;
  font-size: 0.92rem;
}

.anchor-link:hover {
  color: #ffffff;
}
</style>
