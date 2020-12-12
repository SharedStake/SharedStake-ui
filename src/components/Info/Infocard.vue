<template>
  <div class="card">
    <div class="title">{{ title }}</div>
    <div class="content" v-for="(paragraph, i) in content" :key="i">
      {{ paragraph }}
    </div>
  </div>
</template>

<script>
export default { name: "Infocard", props: ["title", "content"] };
</script>

<style scoped>
.card {
  width: 100%;
  padding: 1rem;
  margin: 0.5rem;
}
.title {
  color: #00d394a0;
  font-size: 25px;
}
.content {
  padding: 0.5rem;
  font-size: 15px;
}
</style>