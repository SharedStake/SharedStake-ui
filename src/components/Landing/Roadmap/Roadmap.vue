<template>
  <div class="flex_column landingPage">
    <div id="Launcher">
      <imageVue :src="'logo-2.png'" :size="'14vw'" class="myLogo" />
      <div class="flex_row upButtons">
        <router-link class="nonclickable" to="/">Introduction </router-link>
        <router-link class="nonclickable" to="/roadmap">Roadmap </router-link>
        <a
          href="https://github.com/SharedStake/SharedStake-ui"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div class="nonclickable">Contribute</div>
        </a>
        <router-link class="loginButton" to="/app">Launch Dapp </router-link>
      </div>
    </div>
    <div class="wrapper">
      <diamond />
    </div>
  </div>
</template>

<script scoped>
import imageVue from "../../Handlers/image.vue";
import Diamond from "./diamond.vue";

export default {
  components: { imageVue, Diamond },
};
</script>

<style scoped>
a {
  text-decoration: none;
  color: #666;
  font-family: "Roboto";
  font-weight: 300;
}
.wrapper {
  width: 100vw;
  font-family: "Roboto";
  max-width: 1000px;
  font-weight: 300;
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
}
#Launcher {
  overflow: hidden;
  width: 99.9vw;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 0;
  position: fixed;
  top: 0;
  background: rgba(0, 0, 0, 0);
  z-index: 100;
  backdrop-filter: blur(5px);
}
.loginButton {
  font-size: 14px;
}
.nonclickable:hover {
  transform: scale(0.95);
}
.landingPage {
  background-image: url(../guilloche.svg);
  align-items: center;
  background-size: cover;
  justify-content: center;
  font-family: "Roboto";
  width: 100%;
  overflow-x: hidden;
}

.loginButton {
  margin-right: 20px;
  background: #6296ff;
  border: 1px #6296ff solid;
  border-radius: 5px;
  text-decoration: none;
  padding: 0 10px 0 10px;
  font-size: 18px;
  color: #f5f5f5;
  text-align: center;
  line-height: 50px; /* same as height! */
  max-height: 50px;
  transition: transform 0.2s ease-in-out;
}
.loginButton:hover {
  transform: scale(0.95);
}
.myLogo {
  min-width: 60px;
  max-width: 100px;
}
.nonclickable {
  border-radius: 5px;
  font-size: 3vw;
  text-align: left;
  vertical-align: text-top;
  display: flex;
  transition: transform 0.2s ease-in-out;
  flex-direction: row;
  cursor: pointer;
  align-items: flex-start;
  justify-content: space-between;
  backdrop-filter: blur(5px);
  padding: 1vw;
}
@media only screen and (min-width: 820px) {
  #title,
  .hodl {
    font-size: 107px;
    line-height: 80%;
  }
  .header,
  #exp,
  .content {
    font-size: 48px;
  }
  #solution {
    font-size: 32px;
  }
  .nonclickable,
  #continue,
  #notion {
    font-size: 20px;
  }
  #subtitle {
    font-size: 32px;
  }
}
@media only screen and (max-width: 540px) {
  #title,
  .hodl {
    font-size: 64px;
  }
  .header,
  .content,
  #exp {
    line-height: 100%;
    font-size: 8vw;
  }
  #rainbow {
    line-height: 100%;
    word-break: break-all;
  }
  .loginButton {
    font-size: 14px;
  }

  #subtitle {
    font-size: 5vw;
  }
}
@media only screen and (max-width: 680px) {
  .Wrapper {
    flex-direction: column;
  }
  #W3 {
    flex-direction: column-reverse;
  }
}
</style>