<template>
  <div class="flex_column placeHolder">
    <div class="title">{{ title }}</div>
    <ImageVue :src="image" :size="size" class="img" />
    <div class="exp" v-for="(exp, index) in explanation" :key="index">
      <div>{{ exp }}</div>
    </div>
  </div>
</template>

<script>
import ImageVue from "../Handlers/image.vue";
export default {
  components: { ImageVue },
  name: "placeHolder",
  props: ["title", "explanation", "image", "size"],
};
</script>

<style scoped>
.placeHolder {
  width: 100%;
  height: 100%;
  position: relative;
  font-family: "Big Shoulders Stencil Display", cursive;
}
.title {
  position: absolute;
  z-index: 4;
  color: #e56b73c6;
  font-size: 20vw;
  font-weight: 700;
  z-index: 5;
}

.exp {
  font-size: 5vw;
  font-weight: 400;
}
.img {
  opacity: 75%;
}
</style>