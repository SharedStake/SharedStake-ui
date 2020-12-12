<template>
  <div class="flex_row">
    <div v-if="!authenticated" class="auth flex_column">
      <Landing v-if="!authenticated" class="landing" />
      <button @click="Authenticate" class="button-login">Connect!</button>
    </div>
    <div v-else class="auth-in">
      <button @click="Authenticate" class="button-logout">E X I T</button>
    </div>
  </div>
</template>

<script>
import Web3 from "web3";
import Landing from "./Landing/Landing.vue";
export default {
  name: "Authenticator",
  components: { Landing },
  props: {
    authenticated: Boolean,
  },
  data: () => ({}),
  methods: {
    async Authenticate() {
      if (window.ethereum) {
        window.web3 = new Web3(window.ethereum);
        await window.ethereum.enable();
        this.$emit("authenticated");
        return true;
      }
      return false;
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.auth {
  height: 555px;
  margin-top: 20px;
  justify-content: space-around;
}
.auth-in {
  width: calc(100vw / 7);
  height: 100%;
}

input {
  margin: 5px;
  margin-top: 0;
  padding: 10px;
  font-size: 20px;
  border: solid 1px #00d395;
  background: #fafafa;
}

button {
  margin: 0;
  font-size: 20px;
  border: none;
  cursor: pointer;
}
.button-login {
  background-color: #00d395;
  padding: 15px;
  box-shadow: 5px 0 10px 2px #00d3953d, 10px 10px 10px 2px rgba(0, 0, 0, 0.204);
  transition: box-shadow 0.5s ease, transform 0.5s ease;
  z-index: 100;
}

.button-logout {
  height: 100%;
  background-color: #1d3c7a;
  width: calc(100%);
  color: #fafafa;
  font-size: 22px;
  word-break: break-all;
}
.button-login:hover {
  box-shadow: 0 0 10px 2px #00d3953d, 15px 15px 10px 2px rgba(0, 0, 0, 0.204);
  transform: scale(1.1);
}
.button-login:active,
.button-login:focus {
  box-shadow: 5px 0 10px 2px #00d3953d, 3px 3px 10px 2px rgba(0, 0, 0, 0.204);
  transform: scale(0.9);
}
.landing {
  z-index: 100;
  text-align: left;
}

@media only screen and (max-width: 600px) {
  .auth-in {
    width: 100vw;
    height: calc(100vh / 7);
  }
  .button-login {
    background-color: #00d395;
    box-shadow: 5px 0 10px 2px #00d3953d,
      10px 10px 10px 2px rgba(0, 0, 0, 0.204);
    transition: box-shadow 0.5s ease, transform 0.5s ease;
    z-index: 100;
  }
  .button-login::after {
    content: "Not Fully Mobile Optimazed";
    display: block;
    color: #fafafa;
    font-size: 12px;
  }
  .button-logout {
    width: 100%;
    height: calc(100vh / 7);
  }
}
</style>
