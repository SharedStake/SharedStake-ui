<template>
  <div class="flex items-center justify-center p-4">
    <ImageVue
      :src="'loading.svg'"
      :size="size"
      :class="className"
    />
  </div>
</template>

<script>
import ImageVue from '../Handlers/ImageVue.vue';

export default {
  name: 'LoadingSpinner',
  components: { ImageVue },
  props: {
    size: {
      type: String,
      default: '45px'
    },
    className: {
      type: String,
      default: ''
    }
  }
};
</script>