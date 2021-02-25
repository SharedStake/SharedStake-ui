<template>
  <div class="Stats">
    <div>
      <TotalStaked class="Graph" :explanation="true" />
      <Validators class="Graph" :explanation="true" />
      <Timer class="Graph" :explanation="true" />
    </div>
  </div>
</template>

<script>
import Timer from "./Graphs/Timer";
import Validators from "./Graphs/validators.vue";
import TotalStaked from "./Graphs/TotalStaked.vue";
export default {
  components: {
    Validators,
    Timer,
    TotalStaked,
  },
  data: () => ({
    sharedStaked: 0,
    ethPrice: 0,
    allStaked: 0,
    validators: 0,
    maxValidators: 0,
  }),
};
</script>

<style scoped>
.Stats {
  overflow-y: scroll;
}
</style>