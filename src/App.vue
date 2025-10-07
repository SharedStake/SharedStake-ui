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
/* Optimized font imports - only what we need */
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500&display=swap");

/* CSS Reset and Base Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  padding: 0;
  font-size: 16px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI",
    "Roboto", Helvetica, Arial, sans-serif;
  font-weight: 400;
  color: #fff;
  background: rgb(15, 16, 19);
}
/* Global Styles */
.bn-onboard-custom.bn-onboard-modal {
  z-index: 990;
}

a {
  text-decoration: none;
  color: inherit;
  transition: opacity 0.2s ease;
}

a:hover {
  opacity: 0.8;
}

/* Utility Classes */
.text-gradient {
  background: linear-gradient(135deg, #e6007a 0%, #e2539e 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.glass-effect {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.my-notification {
  margin: 10px 5px 5px;
  padding: 10px;
  font-size: 14px;
  color: #ffffff;

  background: #44a4fc;
  border-left: 5px solid #187fe7;
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
    font-size: 10px;
  }
}
</style>