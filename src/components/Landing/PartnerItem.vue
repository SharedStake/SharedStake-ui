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
  @apply flex flex-col items-center p-6 rounded-xl transition-all duration-300;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.partner:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(230, 0, 122, 0.3);
  transform: translateY(-4px);
}

.header {
  @apply text-xl font-medium mb-3;
  color: rgba(255, 255, 255, 0.95);
}

.partner-text {
  @apply text-sm text-center mb-4 px-4;
  color: rgba(255, 255, 255, 0.6);
  min-height: 48px;
  line-height: 1.6;
}

.link {
  @apply transition-all duration-300;
  opacity: 0.6;
}

.link:hover {
  opacity: 1;
  transform: translateY(2px);
}
</style>