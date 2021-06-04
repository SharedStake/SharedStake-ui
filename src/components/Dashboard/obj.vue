<template>
  <div class="object">
    <div class="grid-container">
      <div class="head">{{ head }}</div>
      <div class="stat">{{ stat }}</div>
      <div v-if="graph" class="graph">{{ graph }}</div>
      <div v-else-if="growth" class="graph">{{ growth }}</div>
    </div>
  </div>
</template>

<script>
export default {
  props: ["head", "stat", "graph", "growth"],
};
</script>

<style scoped>
.object {
  padding: 5px;
  background: #2a2a2a;
  color: #ecf3fb;
}
.head {
  background: #272727;
  color: #d0d0d0;
  padding: 10px;
  white-space: nowrap;
}
.stat {
  font-size: 60px;
  padding: 0 10px;
}
.grid-container {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr 2fr 1.5fr;
  gap: 5px 10px;
  grid-template-areas:
    "head"
    "stat"
    "graph";
}
.head {
  grid-area: head;
}
.stat {
  font-weight: bolder;
  padding: 0 10px;
  grid-area: stat;
}
.graph {
  padding: 0 10px;
  grid-area: graph;
}
</style>