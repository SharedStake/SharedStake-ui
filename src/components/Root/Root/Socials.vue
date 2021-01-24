<template>
  <div
    class="grid-container"
    :style="
      dir == 'down'
        ? { 'grid-template-rows': '1fr 1fr 1fr 1fr 1fr' }
        : { 'grid-template-columns': '1fr 1fr 1fr 1fr 1fr' }
    "
  >
    <div class="Social" v-for="(logo, i) in logos" :key="i">
      <a :href="logo.link" target="_blank" rel="noopener noreferrer">
        <imageVue v-show="logo.link" :src="logo.img" :size="size" class="logo"
      /></a>
    </div>
  </div>
</template>

<script>
import imageVue from "../../Handlers/image.vue";
export default {
  props: { dir: String },
  data: () => ({
    logos: [
      //   { img: "medium.png", link: "" },
      { img: "twitter.png", link: "https://twitter.com/SharedStake" },
      { img: "discord.png", link: "https://discord.gg/VezkjY9udC" },
      {
        img: "medium.png",
        link:
          "https://medium.com/@AlexMasmej/introducing-sharedstake-the-easiest-way-to-stake-for-eth2-790d6283a55b",
      },
      {
        img: "notion.png",
        link:
          "https://www.notion.so/SharedStake-b795e062fcb54f89a79b98f09a922c05",
      },
      {
        img: "github.png",
        link: "https://github.com/SharedStake/SharedStake-ui",
      },
    ],
    size: "32px",
  }),
  components: { imageVue },
};
</script>

<style scoped>
.grid-container {
  margin-top: 2vh;
  display: grid;
  justify-items: center;
  align-items: center;
}
.Social {
  transition: 0.3s ease-in-out;
}
.Social:hover {
  transform: scale(1.11);
  transition: 0.3s ease-in-out;
}
@media only screen and (max-width: 700px) {
  .grid-container {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
    gap: 2vh 0px;
  }
}
</style>