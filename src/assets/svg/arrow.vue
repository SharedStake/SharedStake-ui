<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#565A69"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="arrow"
    :id="direction"
  >
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <polyline points="19 12 12 19 5 12"></polyline>
  </svg>
</template>

<script>
export default { props: { direction: String, size: Number } };
</script>

<style scoped>
.arrow {
  justify-content: center;
  justify-self: center;
  align-self: center;
  align-content: center;
  justify-items: center;
  align-items: center;
  padding: 0;
}
#up {
  transform: rotate(180deg);
}
#right {
  transform: rotate(270deg);
}
#left {
  transform: rotate(90deg);
}
</style>