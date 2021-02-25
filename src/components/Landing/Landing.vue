<template>
  <div class="Landing">
    <div class="Container first">
      <div class="LogoContainer">
        <ImageVue :src="'logo-red.svg'" :size="'180px'" class="Logo" />
      </div>
      <div class="Explanation">
        <div class="main">Staking For Everyone</div>
        <div class="exp">
          SharedStake is an easy to use Decentralized Open Source Protocol that
          allows users to stake any amount of Ether to Ethereum 2 while keeping
          their staked amount valuable and liquid
        </div>
        <div class="social">
          <div class="LearnButton">Learn More</div>
          <ImageVue :src="'twitter.svg'" :size="'30px'" class="socialLogo" />
          <ImageVue :src="'discord.svg'" :size="'30px'" class="socialLogo" />
          <ImageVue :src="'reddit.svg'" :size="'30px'" class="socialLogo" />
          <ImageVue :src="'github.svg'" :size="'30px'" class="socialLogo" />
        </div>
      </div>
    </div>
    <div class="Container second"></div>
    <div class="Container third"></div>
  </div>
</template>

<script>
import ImageVue from "../Handlers/ImageVue.vue";
export default {
  components: { ImageVue },
};
</script>

<style scoped>
.Container {
  min-height: 100vh;
  color: #fff;
}
.LogoContainer {
  background-image: url(bg-11.png);
  background-repeat: no-repeat;
  background-position: center;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
  justify-content: center;
  align-items: center;
}
@keyframes Electrofy {
}
.first {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr;
  gap: 0px 0px;
  grid-template-areas: ". .";
}
.Logo {
  padding: 0 145px 100px 0;
}
.Explanation,
.Logo {
  align-self: center;
  justify-self: center;
}
.Explanation {
  padding: 0 120px 200px 0;
}
.main {
  margin: 4rem 0px 3rem;
  overflow-wrap: normal;
  max-width: 900px;
  font-size: 64px;
  font-weight: 300;
  line-height: 1.2;
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 30px;
}
.exp {
  font-size: 21px;
  line-height: 31px;
  font-weight: 300;
  padding: 0px;
  margin-bottom: 50px;
  color: rgba(255, 255, 255, 0.75);
  transform: translateY(10px);
  text-align: justify;
  text-justify: inter-word;
}
.social {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}
.socialLogo {
  filter: brightness(300%);
}
.LearnButton {
  font-size: 21px;
  padding: 0.5rem 1.5rem 0.5rem 1.5rem;
  border: 2px solid #fff;
  border-radius: 10px;
}
</style>