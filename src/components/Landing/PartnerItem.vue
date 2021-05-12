<template>
  <div class="partner">
    <ImageVue :src="imageUrl" size="128px" />
    <div class="header">{{ name }}</div>
    <div class="partner-text">{{ text }}</div>
    <a class="link" :href="link" target="_blank" rel="noopener noreferrer">
      <ImageVue :src="'down.svg'" :size="'30px'" />
    </a>
  </div>
</template>

<script>
import ImageVue from "../Handlers/ImageVue";

export default {
  components: { ImageVue },
  props: {
    name: String,
    imageUrl: String,
    text: String,
    link: String,
  },
};
</script>

<style scoped>
.partner {
  color: rgba(255, 255, 255, 0.95);
  display: flex;
  /* justify-content: center; */
  flex-direction: column;
  align-items: center;
}

.header {
  font-size: 22px;
  line-height: 31px;
  font-weight: 300;
  margin-bottom: 1rem;
}

.partner-text {
  margin-bottom: 10px;
  font-size: 16px;
  color: rgb(143, 143, 143);
  width: 60%;
  text-align: center;
  min-height: 40px;
}
</style>