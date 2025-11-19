<template>
  <div class="loading-container">
    <ImageVue
      :src="'loading.svg'"
      :size="size"
      class="loading-spinner"
    />
    <p v-if="text" class="loading-text">
      {{ text }}
    </p>
  </div>
</template>

<script>
import ImageVue from "../Handlers/ImageVue.vue";

export default {
  name: "LoadingSpinner",
  components: { ImageVue },
  props: {
    size: {
      type: String,
      default: "45px"
    },
    text: {
      type: String,
      default: ""
    }
  }
};
</script>

<style scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

.loading-text {
  color: #9ca3af;
  font-size: 0.875rem;
  margin: 0;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>