<template>
  <div class="flex_column Earn">
    <geyser :img="'geyser1.jpg'" />
    <geyser :img="'geyser2.jpg'" />
    <geyser :img="'geyser3.jpg'" />
    <geyser :img="'geyser4.jpg'" />
    <span
      >* These pools represent planned incentivised pools that will be deployed
      when our governance token, <span class="logo">SharedStake</span> is
      distributed.</span
    >
  </div>
</template>

<script>
import geyser from "./geyser.vue";
export default { components: { geyser }, data: () => ({}) };
</script>

<style scoped>
.Earn {
  overflow-y: hidden;
  scroll-behavior: smooth;
}
span {
  text-align: left;
  font-size: 18px;
}
.logo {
  font-family: "Big Shoulders Stencil Display", cursive;
  color: #ff007a;
  font-size: 22px;
}
</style>