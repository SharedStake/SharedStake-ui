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
/* Import global styles */
@import url("/assets/styles/main.css");

/* Component specific styles */
.bn-onboard-custom.bn-onboard-modal {
  z-index: 990;
}

/* Use new notification classes from main.css */
.my-notification {
  @apply notification-info;
}
.my-notification.success {
  @apply notification-success;
}
.my-notification.warn {
  @apply notification-warn;
}
.my-notification.error {
  @apply notification-error;
}
</style>