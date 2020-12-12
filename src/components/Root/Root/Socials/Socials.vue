<template>
  <div class="flex_row">
    <div class="flex_row Social" v-for="(logo, i) in logos" :key="i">
      <a :href="logo.link" target="_blank" rel="noopener noreferrer">
        <imageVue v-show="logo.link" :src="logo.img" :size="size" class="logo"
      /></a>
    </div>
  </div>
</template>

<script>
import imageVue from "../../../Handlers/image.vue";
export default {
  data: () => ({
    logos: [
      //   { img: "medium.png", link: "" },
      { img: "twitter.png", link: "https://twitter.com/SharedStake" },
      { img: "discord.png", link: "https://discord.gg/VezkjY9udC" },
      {
        img: "notion.png",
        link:
          "https://www.notion.so/SharedStake-b795e062fcb54f89a79b98f09a922c05#ad81c52153ae4972839332255a2dcd39",
      },
    ],
    size: "32px",
  }),
  components: { imageVue },
};
</script>

<style scoped>
.Social {
  transition: 0.3s ease-in-out;
}
.Social:hover {
  transform: scale(1.11);
  transition: 0.3s ease-in-out;
}
</style>