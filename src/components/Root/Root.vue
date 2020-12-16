<template>
  <div id="main" v-bind:class="'flex_row'">
    <Figure
      v-bind:id="route == '/' || !authenticated ? 'Figure' : 'FigureOut'"
      v-if="componentsIn"
    />

    <Buttons v-if="authenticated" :route="route" />

    <transition name="fade" mode="out-in">
      <router-view
        v-if="authenticated"
        v-bind:class="route == '/' ? 'Container' : 'ContainerFull'"
      ></router-view>
    </transition>

    <Authenticator
      v-if="componentsIn"
      v-bind:class="authenticated ? 'Element-auth' : 'Authenticator'"
      v-bind:id="route == '/' || !authenticated ? '' : 'AuthenticatorOut'"
    />
    <Socials
      v-if="componentsIn"
      :class="authenticated ? 'Socials-auth' : 'Socials'"
      v-bind:id="route == '/' || !authenticated ? '' : 'SocialsOut'"
    />
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import Figure from "./Root/Figure";
import Authenticator from "./Root/Authenticator.vue";
import Buttons from "./Root/Buttons";
import Socials from "./Root/Socials.vue";
export default {
  name: "Root",
  components: {
    Figure,
    Authenticator,
    Buttons,
    Socials,
  },
  data: () => ({
    route: "/",
    Width: 0,
    componentsIn: true,
  }),
  methods: {},
  watch: {
    $route(to) {
      this.route = to.name;
    },
    async route(to) {
      if (to == "/" || !this.authenticated) {
        this.componentsIn = true;
        return;
      }
      if (window.innerWidth < 600) {
        this.componentsIn = false;
      }
    },
    async authenticated() {
      if (this.route == "/" || !this.authenticated) {
        this.componentsIn = true;
        return;
      }
      if (window.innerWidth < 600) this.componentsIn = false;
    },
  },
  created: function () {
    this.route = this.$route.name;
    this.Width = window.innerWidth;
  },
  computed: {
    ...mapGetters({ authenticated: "isAuth" }),
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

#SocialsOut {
  width: 0vw;
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
.Socials {
  width: calc(100vw / 7 * 1.5);
  position: fixed;
  transition: all 1s ease-in;
  bottom: 3vh;
  left: 0vw;
  z-index: 200;
}
.Socials-auth {
  width: calc(100vw / 7 * 1.5);
  position: fixed;
  transition: all 1s ease-in;
  bottom: 3vh;
  left: 0vw;
  z-index: 200;
}
@media only screen and (max-width: 700px) {
  #main {
    flex-direction: column;
    overflow-x: scroll;
    overflow-y: scroll;
  }
  #Figure {
    width: calc(100vw);
    height: 5rem;
  }
  .Element-auth {
    display: none;
    flex: 1;
  }
  #FigureOut {
    width: 100%;
    height: 0%;
    transform: translateY(-20vw);
    transition: all 0s ease-in-out;
    flex: 1;
  }
  #AuthenticatorOut {
    width: 100%;
    height: 0%;
    transform: translateY(20vw);
    transition: all 0s ease-in-out;
    flex: 1;
  }
  .ContainerFull {
    min-width: 100vw;
    flex: 1;
    align-self: baseline;
  }
  .Buttons {
    flex: 1;
    max-height: calc(100vh / 7 * 5.5 - 5rem);
  }
  .Authenticator {
    padding-left: 0;
    flex: 1;
  }
  .Socials {
    width: 100vw;
    flex: 1;
    bottom: 0vh;
    position: relative;
  }
  .Socials-auth {
    width: 100vw;
    bottom: 0vh;
    flex: 1;
    position: relative;
  }
}
</style>