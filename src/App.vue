<template>
  <div id="app">
    <router-view />
    <notifications group="foo" classes="my-notification" />
  </div>
</template>

<script>
import { mapActions } from "vuex";

export default {
  name: "App",
  methods: {
    ...mapActions(["tryToAutoConnect"]),
  },
  mounted() {
    // Connect wallet.
    this.tryToAutoConnect();
  },
};
</script>
<style lang="css">
@import url("https://fonts.googleapis.com/css2?family=Ubuntu:wght@300;400;500;700&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,400;0,700;0,900;1,300;1,400&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Roboto+Mono:ital,wght@0,300;0,400;0,500;0,700;1,700&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;700&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Work+Sans:wght@300&display=swap");

body {
  scroll-behavior: smooth;
  margin: 0;
  padding: 0;
  font-size: 30px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-family: "Inter", -apple-system, "Roboto", BlinkMacSystemFont, "Segoe UI",
    Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji",
    "Segoe UI Symbol";
  font-weight: 300;
}
.flex_row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-evenly;
}
.flex_column {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;
}
.bn-onboard-custom.bn-onboard-modal {
  z-index: 990;
}
a {
  text-decoration: none;
  font-family: "Roboto";
  color: #fff;
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
