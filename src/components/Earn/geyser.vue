<template>
  <div class="flex_column geyser">{{ pool.name }}</div>
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
}
</style>