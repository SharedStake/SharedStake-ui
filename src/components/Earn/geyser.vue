<template>
  <div class="flex_column geyser">{{ pool }}</div>
</template>

<script>
export default { components: {}, props: ["pool"] };
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
</style>