<template>
  <div>
    <comingSoon
      :title="title"
      :image="image"
      :size="size"
      :explanation="explanation"
    />
  </div>
</template>

<script>
import comingSoon from "../Handlers/placeHolder";
export default {
  components: { comingSoon },
  data: () => ({
    title: "Coming soon",
    image: "logo-2.png",
    size: "500px",
    explanation: [
      "This page will include all information and polls regarding sharedStake governance.",
      " We are already working on it 😎",
    ],
  }),
};
</script>

<style scoped>
</style>