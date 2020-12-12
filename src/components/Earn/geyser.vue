<template>
  <div class="flex_column geyser">
    <ImageVue :src="img" :size="'90%'" class="image" />
    <div class="inactive">coming soon</div>
  </div>
</template>

<script>
import ImageVue from "../Handlers/image";
export default { components: { ImageVue }, props: ["img"] };
</script>

<style scoped>
.geyser {
  cursor: pointer;
  position: relative;
  transition: transform 0.2s ease-in-out;
}
.geyser:hover {
  transform: scale(0.95);
}
.inactive {
  padding: 0.4rem 1rem 0.4rem 1rem;
  position: absolute;
  /* background-color: #e56b73; */
  background-color: #e56b73; /*error color*/
  color: #fafafa;
  transform: rotate(25deg);
}
</style>