<template>
  <div id="app">
    <router-view />
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
  font-weight: 700;
  color: #fff;
}
</style>