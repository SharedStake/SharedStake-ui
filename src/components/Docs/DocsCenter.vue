<template>
  <div class="docs-center">
    <div class="docs-shell">
      <aside class="docs-left">
        <DocsSideNav />
      </aside>

      <main class="docs-main">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script>
import DocsSideNav from "./DocsSideNav.vue";

export default {
  name: "DocsCenter",
  components: {
    DocsSideNav,
  },
};
</script>

<style scoped>
.docs-center {
  width: 92%;
  max-width: 1320px;
  margin: 0 auto;
  padding-top: 132px;
  padding-bottom: 32px;
}

.docs-shell {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 20px;
}

.docs-left {
  position: sticky;
  top: 92px;
  align-self: start;
}

.docs-main {
  min-width: 0;
}

@media (max-width: 1120px) {
  .docs-center {
    padding-top: 118px;
  }

  .docs-shell {
    grid-template-columns: 1fr;
  }

  .docs-left {
    position: static;
  }
}
</style>
