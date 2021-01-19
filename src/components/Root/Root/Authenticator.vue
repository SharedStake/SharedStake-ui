<template>
  <div>
    <div v-if="!isAuth" class="auth flex_column">
      <Landing v-if="!isAuth" class="landing" />
      <button @click="Authenticate" class="button-login">Connect!</button>
    </div>
    <div v-else class="auth-in">
      <router-link @click="Authenticate" to="/"
        ><button @click="Authenticate" class="button-logout">
          E X I T
        </button></router-link
      >
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
// import Landing from "./Landing/Landing.vue";
export default {
  name: "Authenticator",
  // components: { Landing },
  // data: () => ({}),
  methods: {
    ...mapActions(["setAddress", "exit"]),
    Authenticate() {
      if (this.isAuth) this.exit();
      else {
        this.setAddress();
      }
    },
  },
  computed: {
    ...mapGetters(["userAddress", "isAuth"]),
  },
};
</script>

<style scoped>
.auth-in {
  width: calc(100vw / 7 * 0.5);
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
  flex: 1;
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
  flex: 1;
  text-align: left;
  margin-bottom: 5vh;
}

@media only screen and (max-width: 700px) {
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
    /* content: "Not Fully Mobile Optimazed"; */
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
