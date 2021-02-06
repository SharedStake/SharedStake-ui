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
        <div v-if="names" class="name">{{ logo.name }}</div>
        <imageVue
          v-else
          v-show="logo.link"
          :src="logo.img"
          :size="size"
          class="logo"
        />
      </a>
    </div>
  </div>
</template>

<script>
import imageVue from "../../Handlers/image.vue";
export default {
  props: { dir: String, names: Boolean },
  data: () => ({
    logos: [
      //   { img: "medium.png", link: "" },
      {
        name: "Twitter",
        img: "twitter.png",
        link: "https://twitter.com/SharedStake",
      },
      {
        img: "discord.png",
        name: "Discord",
        link: "https://discord.gg/VezkjY9udC",
      },
      {
        name: "Medium",
        img: "medium.png",
        link:
          "https://medium.com/@AlexMasmej/introducing-sharedstake-the-easiest-way-to-stake-for-eth2-790d6283a55b",
      },
      {
        name: "Notion",
        img: "notion.png",
        link:
          "https://www.notion.so/SharedStake-b795e062fcb54f89a79b98f09a922c05",
      },
      {
        name: "Github",
        img: "github.png",
        link: "https://github.com/SharedStake",
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
  justify-items: left;
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
    gap: 2vh 0px;
  }
}
.name {
  padding-left: 10px;
  color: #fff;
  text-shadow: 1px 1px #ff007a;
  font-size: 18px;
  line-height: 22px;
  text-align: left;
}
</style>