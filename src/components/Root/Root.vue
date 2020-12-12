<template>
  <div id="main" v-bind:class="'flex_row'">
    <Figure
      :address="address"
      @address="(val) => (address = val)"
      :authenticated="authenticated"
      v-bind:id="route == '/' || !authenticated ? 'Figure' : 'FigureOut'"
    />

    <Buttons v-if="authenticated" :route="route" />

    <transition name="fade" mode="out-in">
      <router-view
        v-if="authenticated"
        v-bind:class="route == '/' ? 'Container' : 'ContainerFull'"
      ></router-view>
    </transition>

    <Authenticator
      @authenticated="Authenticate"
      :authenticated="authenticated"
      v-bind:class="authenticated ? 'Element-auth' : 'Authenticator'"
      v-bind:id="route == '/' || !authenticated ? '' : 'AuthenticatorOut'"
    />
  </div>
</template>

<script>
import Figure from "./Root/Figure";
import Authenticator from "./Root/Authenticator.vue";
import Buttons from "./Root/Buttons";
export default {
  name: "Root",
  components: {
    Figure,
    Authenticator,
    Buttons,
  },
  data: () => ({
    authenticated: false,
    route: "/",
    address: null,
    Width: 0,
  }),
  methods: {
    Authenticate() {
      this.authenticated = !this.authenticated;
      if (this.address) this.address = null;
    },
  },
  watch: {
    $route(to) {
      this.route = to.name;
    },
  },
  created: function () {
    this.route = this.$route.name;
    this.Width = window.innerWidth;
  },
};
</script>

<style>
@import url("https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,400;0,700;0,900;1,300;1,400&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Work+Sans:wght@100;300;400&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Graduate&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Big+Shoulders+Stencil+Display:wght@400;700;900&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Open+Sans+Condensed:wght@300;700&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Major+Mono+Display&display=swap");
a {
  text-decoration: none;
  font-family: BrandonGrotesque, sans-serif;
  font-weight: 700;
  font-size: 26px;
  color: #2c3e50;
}
::-webkit-scrollbar {
  width: 10px;
}

/* Track */
::-webkit-scrollbar-track {
  background: #f1f1f1;
}

/* Handle */
::-webkit-scrollbar-thumb {
  background: #888;
}

/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background: #555;
}
#main {
  overflow: hidden;
  height: 100vh;
  margin: 0;
  /* background: #e56b73; */
  background: #fafafa;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
    Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
}

.Authenticator {
  width: calc(100vw / 7 * 5.5);
  padding-left: calc(100vw / 7 * 1.5);
  height: 100%;
  text-align: center;
  background: #fafafa;
}
.Element-auth {
  height: 100%;
  text-align: center;
  transition: transform 1s ease-in-out 0s;
  width: calc(100vw / 7 * 0.5);
}
#AuthenticatorOut {
  height: 100%;
  text-align: center;
  width: 0vw;
  transform: translateX(20vw);
  transition: transform 1s ease-in-out 0s, width 1s ease-in-out 0s;
}
#Figure {
  height: 100%;
  text-align: center;
  width: calc(100vw / 7 * 1.5);
  background: #1d3c7a;
  transition: all 1s ease-in-out;
}
#FigureOut {
  width: 0vw;
  height: 100%;
  text-align: center;
  background: #1d3c7a;
  transform: translateX(-20vw);
  transition: all 1s ease-in-out;
}

.Container {
  height: 100%;
  width: calc(100vw / 7 * 5);
  text-align: center;
  background-color: #fafafa;
}

.ContainerFull {
  height: 100%;
  width: calc(100vw / 7 * 6);
  text-align: center;
  background-color: #fafafa;
}

.fade-enter-active {
  transition: all 0s ease-in 0s;
}
.fade-leave-to {
  display: none;
}
.fade-enter /* .fade-leave-active below version 2.1.8 */ {
  display: none;
}
@media only screen and (max-width: 600px) {
  #main {
    position: flex;
    flex-direction: column;
    overflow-x: scroll;
    min-height: 480px;
  }
  #Figure {
    position: fixed;
    top: 0;
    width: calc(100vw);
    height: 5rem;
  }
  .Element-auth {
    display: none;
  }
  #FigureOut {
    width: 100%;
    height: 0%;
    transform: translateY(-20vw);
    transition: all 0s ease-in-out;
  }
  #AuthenticatorOut {
    width: 100%;
    height: 0%;
    transform: translateY(20vw);
    transition: all 0s ease-in-out;
  }
  .ContainerFull {
    min-width: 100vw;
    align-self: baseline;
  }
  .Buttons {
    max-height: calc(100vh / 7 * 5.5 - 5rem);
  }
  .Authenticator {
    padding-left: 0;
  }
}
</style>