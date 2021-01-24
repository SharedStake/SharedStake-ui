<template>
  <div class="flex_column Earn">
    <geyser v-for="pool in pools" :pool="pool" v-bind:key="pool.name" />
  </div>
</template>

<script>
import geyser from "./geyser.vue";
export default {
  components: { geyser },
  data: () => ({
    pools: {
      pool1: { name: "oh no1" },
      pool2: { name: "oh no2" },
      pool3: { name: "oh no3" },
      pool4: { name: "oh no4" },
    },
  }),
};
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