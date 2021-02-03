<template>
  <div
    class="flex_row notifier"
    :id="success ? '' : 'error'"
    v-bind:style="{ bottom: index * 4 + 2 + 'rem' }"
  >
    <div :class="success ? 'sider' : 'sider-error'">
      <span v-if="success" style="font-size: 14px; font-weight: 700"> ↗</span>
    </div>
    <div class="text">{{ msg }}</div>
    <a
      v-if="success"
      :href="`https://${network}etherscan.io/tx/` + id"
      target="_blank"
      rel="noopener noreferrer"
    >
    </a>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
export default {
  props: ["msg", "id", "index", "success"],
  data: () => ({ network: "" }),
  mounted: async function () {
    this.network = this.getNetwork;
    console.log(this.getNetwork);
    if (this.getNetwork == "Mainnet") this.network = "";
  },
  computed: {
    ...mapGetters(["getNetwork"]),
  },
};
</script>

<style scoped>
a {
  position: absolute;
  width: 100%;
  height: 100%;
}
.notifier {
  cursor: pointer;
  border: solid 0px transparent;
  position: fixed;
  justify-content: space-between;
  border-radius: 2px;
  min-width: 13rem;
  background: #fff;
  color: #00d395;
  right: calc(100vw / 7);
  font-size: 20px;
  font-family: "Big Shoulders Stencil Display", cursive;
  z-index: 10;
  box-shadow: 5px 0 10px 2px #00d3953d, 10px 10px 10px 2px rgba(0, 0, 0, 0.204);
  transition: box-shadow 0.5s ease, transform 0.5s ease;
}

.notifier:hover {
  box-shadow: 0 0 10px 2px #00d3953d, 15px 15px 10px 2px rgba(0, 0, 0, 0.204);
  transform: scale(1.1);
}
.notifier:active,
.notifier:focus {
  box-shadow: 5px 0 10px 2px #00d3953d, 3px 3px 10px 2px rgba(0, 0, 0, 0.204);
  transform: scale(0.9);
}
#error {
  color: #ec9197;
  box-shadow: 5px 0 10px 2px #ec91973d, 10px 10px 10px 2px rgba(0, 0, 0, 0.204);
  transition: box-shadow 0.5s ease, transform 0.5s ease;
}
#error:hover {
  box-shadow: 0 0 10px 2px #ec91973d, 15px 15px 10px 2px rgba(0, 0, 0, 0.204);
  transform: scale(1.1);
}
#error:active,
#error:focus {
  box-shadow: 5px 0 10px 2px #ec91973d, 3px 3px 10px 2px rgba(0, 0, 0, 0.204);
  transform: scale(0.9);
}
.sider {
  width: 1rem;
  height: 2rem;
  background: #007bff;
  color: #fff;
}
.sider-error {
  width: 1rem;
  height: 2rem;
  color: #fff;
  background: #e56b73;
}
.text {
  width: 10rem;
  padding: 0 0.5rem 0 0.5rem;
}
</style>