<template>
  <div
    class="flex_row notifier"
    :id="success ? '' : 'error'"
    v-bind:style="{ bottom: index * 4 + 2 + 'rem' }"
  >
    <div :class="success ? 'sider' : 'sider-error'"></div>
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
const networks = {
  0: "Olympic",
  1: "",
  2: "Expanse.",
  3: "Ropsten.",
  4: "Rinkeby.",
  5: "Goerli.",
  6: "Kotti Classic",
  7: "Mordor Classic",
  8: "Ubiq",
  10: "Quorum",
  42: "Kovan",
  60: "GoChain",
  77: "Sokol",
  99: "Core",
  100: "xDai",
};
export default {
  props: ["msg", "id", "index", "success"],
  data: () => ({ network: "" }),
  mounted: async function () {
    let network = await window.web3.eth.net.getId();
    this.network = networks[network];
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
}
.sider-error {
  width: 1rem;
  height: 2rem;
  background: #e56b73;
}
.text {
  width: 10rem;
  padding: 0 0.5rem 0 0.5rem;
}
</style>