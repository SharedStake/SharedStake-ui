<template>
  <div id="app">
    <router-view />
    <notifications group="foo" classes="my-notification" />
  </div>
</template>

<script>
export default {
  name: "App",
};
</script>
<style lang="css">
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;700&display=swap");

body {
  scroll-behavior: smooth;
  margin: 0;
  padding: 0;
  font-size: 30px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-family: var(--font-family-primary);
  font-weight: 300;
}

/* Legacy flex utilities - use Tailwind classes instead */
.flex_row {
  @apply flex flex-row items-center justify-evenly;
}
.flex_column {
  @apply flex flex-col items-center justify-evenly;
}
.bn-onboard-custom.bn-onboard-modal {
  z-index: 990;
}
a {
  text-decoration: none;
  font-family: var(--font-family-primary);
  color: var(--color-white);
}

.my-notification {
  margin: var(--spacing-sm) var(--spacing-xs) var(--spacing-xs);
  padding: var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--color-white);
  background: #44a4fc;
  border-left: 5px solid #187fe7;
  border-radius: var(--radius-sm);
}

.my-notification.success {
  background: #68cd86;
  border-left-color: #42a85f;
}

.my-notification.warn {
  background: #ffb648;
  border-left-color: #f48a06;
}

.my-notification.error {
  background: #e54d42;
  border-left-color: #b82e24;
}

@media only screen and (max-width: 700px) {
  .my-notification {
    font-size: var(--font-size-xs);
  }
}
</style>