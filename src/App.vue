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
@import url("https://fonts.googleapis.com/css2?family=Ubuntu:wght@300;400;500;700&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,400;0,700;0,900;1,300;1,400&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Roboto+Mono:ital,wght@0,300;0,400;0,500;0,700;1,700&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;700&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Work+Sans:wght@300&display=swap");

/* Global styles using Tailwind's @apply directive */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply m-0 p-0 text-3xl antialiased font-inter font-light;
    scroll-behavior: smooth;
  }
  
  a {
    @apply no-underline font-roboto text-white;
  }
}

@layer components {
  .flex_row {
    @apply flex flex-row items-center justify-evenly;
  }
  
  .flex_column {
    @apply flex flex-col items-center justify-evenly;
  }
  
  .bn-onboard-custom.bn-onboard-modal {
    z-index: 990;
  }
  
  .my-notification {
    @apply mx-2.5 my-2.5 p-2.5 text-sm text-white bg-blue-500 border-l-4 border-blue-600;
  }
  
  .my-notification.success {
    @apply bg-green-500 border-green-600;
  }
  
  .my-notification.warn {
    @apply bg-yellow-500 border-yellow-600;
  }
  
  .my-notification.error {
    @apply bg-red-500 border-red-600;
  }
}

@layer utilities {
  @media only screen and (max-width: 700px) {
    .my-notification {
      @apply text-xs;
    }
  }
}
</style>