<template>
  <div class="Root">
    <div class="Header">
      <div class="flex_row LogoContainer">
        <ImageVue :src="'logo-white.svg'" :size="'30px'" class="Logo" />
        <div class="main">SharedStake</div>
      </div>
      <div class="links">
        <span class="link">Stake</span>
        <span class="link">Earn</span>
        <span class="link">Dashboard</span>
      </div>
      <div class="links">
        <span class="link">Dao</span>
        <span class="link">Docs</span>
        <span class="link" v-bind:style="{ opacity: 1 }">
          <div class="ConnectButton">Connect Wallet</div>
        </span>
      </div>
    </div>
    <router-view />
    <div class="footer">
      <div class="flex_column LogoContainer">
        <ImageVue :src="'logo-white.svg'" :size="'80px'" class="FooterLogo" />
      </div>
      <div class="link disclaimer">
        <p>
          Please note that this is a Beta version of the SharedStake protocol.
          The platform, its software, and all content found on it are provided
          on an “as is” and “as available” basis.
        </p>
        <p>
          While we have made reasonable efforts to ensure the security and
          functionality of the SharedStake platform, nothing approaching the
          rigor of a formal audit has been conducted at this time and the
          front-end is actively being tested.
        </p>
        <p>
          We strongly advise caution to anyone who chooses to use the current
          experimental version.
        </p>
        <p>PLEASE DO NOT RISK ANY FUNDS YOU CANNOT AFFORD TO LOSE</p>
      </div>
      <div class="footerLinks">
        <div class="footerGroup">
          <div class="footerGroupName">Developers</div>
          <span class="link footerLink">Documentation</span>
          <span class="link footerLink">Github</span>
        </div>
        <div class="footerGroup">
          <div class="footerGroupName">About</div>
          <span class="link footerLink">Privacy Policy</span>
          <span class="link footerLink">Terms of Service</span>
        </div>
        <div class="footerGroup">
          <div class="footerGroupName">Community</div>
          <span class="link footerLink">Twitter</span>
          <span class="link footerLink">Discord</span>
          <span class="link footerLink">Reddit</span>
          <span class="link footerLink">Medium</span>
        </div>
      </div>
      <div class="bottom">SharedStake © 2021</div>
    </div>
  </div>
</template>

<script>
import ImageVue from "./components/Handlers/ImageVue.vue";
export default {
  components: { ImageVue },
};
</script>

<style scoped>
.Root {
  min-height: 100vh;
  background: rgb(15, 16, 19);
}
.Header {
  display: flex;
  flex-direction: row;
  -webkit-box-pack: justify;
  justify-content: space-between;
  -webkit-box-align: center;
  align-items: center;
  box-sizing: border-box;
  padding: 1.5rem;
  width: 100%;
  z-index: 3;
  position: sticky;
  top: -1px;
  background: rgb(15, 16, 19);
  border-bottom: 1px solid rgb(41, 44, 47);
  transition: background-color 0.25s ease 0s;
  color: rgb(255, 255, 255);
}
.LogoContainer {
  margin-left: 1vw;
  font-size: 24px;
  align-items: center;
  cursor: pointer;
  grid-area: Logo;
}

.Logo {
  transition: all 0.25s ease 0s;
}
.FooterLogo,
.Logo:hover {
  -webkit-filter: drop-shadow(0px 0px 4px rgba(255, 255, 255, 0.7));
  filter: drop-shadow(0px 0px 4px rgba(255, 255, 255, 0.7));
  /* Similar syntax to box-shadow */
}
.FooterLogo {
  margin-bottom: 50px;
}
.main {
  padding: 0 0 0 10px;
  font-weight: 400;
}
.footerGroup,
.links {
  box-sizing: border-box;
  display: flex;
  -webkit-box-align: center;
  align-items: center;
  -webkit-box-pack: center;
  justify-content: center;
  transition: right 0.25s ease 0s;
}
.link {
  text-decoration: none;
  margin: 0px;
  --tw-space-x-reverse: 0;
  margin-right: calc(2.5rem * var(--tw-space-x-reverse));
  margin-left: calc(2.5rem * (1 - var(--tw-space-x-reverse)));
  color: rgb(255, 255, 255);
  opacity: 0.5;
  padding: 15px 0px;
  border-radius: 0.5rem;
  font-weight: 400;
  width: fit-content;
  font-size: 16px;
  cursor: pointer;
  transition: opacity 0.35s ease 0s;
}
.link:hover {
  opacity: 1;
}
.ConnectButton {
  padding: 0.5rem 1.5rem;
  border: 3px double transparent;
  border-radius: 80px;
  background-image: linear-gradient(rgb(13, 14, 33), rgb(13, 14, 33)),
    radial-gradient(circle at left top, rgb(37, 167, 219), rgb(250, 82, 160));
  background-origin: border-box;
  background-clip: padding-box, border-box;
}
.footer {
  padding: 40px 30px 30px;
  margin-top: 30px;
  background-color: rgb(24, 24, 24);
  color: rgb(255, 255, 255);
  min-height: 350px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr 0.2fr;
  gap: 0px 0px;
  grid-template-areas:
    "Disclaimer Logo"
    "Disclaimer Info"
    "bottom bottom ";
  align-items: center;
}

.disclaimer {
  grid-area: Disclaimer;
  width: 35vw;
  font-size: 14px;
  padding: 0;
  text-align: justify;
  text-justify: inter-word;
  line-height: 22px;
}
.footerLinks {
  grid-area: Info;
  max-width: 1500px;
  width: calc(100% - 60px);
  margin: 0px auto;
  display: flex;
  flex-wrap: wrap;
  -webkit-box-pack: justify;
  justify-content: space-between;
}
.footerGroup {
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
}
.footerGroupName {
  color: inherit;
  font-weight: 700;
  font-size: 16px;
  margin-bottom: 1.25em;
  opacity: 0.75;
}
.footerLink {
  margin: 0;
  padding: 0 0 14px 0;
}
.bottom {
  text-align: center;
  font-size: 12px;
  grid-area: bottom;
  color: #afafaf;
}
@media only screen and (max-width: 900px) {
}
</style>