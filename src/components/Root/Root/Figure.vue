<template>
  <div class="flex_column authenticator">
    <div v-bind:id="authenticated ? 'Result-auth' : 'Result'">
      <div v-if="!authenticated" class="Draw" id="output">
        <ImageVue :src="'logo-1.png'" :size="'100%'" class="image" />
      </div>
      <div v-else class="Draw" id="output">
        <ImageVue :src="'logo.png'" :size="'100%'" class="image" />
      </div>
    </div>
    <div v-if="authenticated" class="address">
      {{ userAddress }}
    </div>
    <div v-if="authenticated" class="network" v-show="getNetwork">
      on {{ getNetwork }}
    </div>
  </div>
</template>

<script>
import ImageVue from "../../Handlers/image";
import { mapGetters } from "vuex";
export default {
  name: "Figure",
  components: { ImageVue },
  computed: {
    ...mapGetters({
      userAddress: "userAddress",
      authenticated: "isAuth",
      getNetwork: "getNetwork",
    }),
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
#Result {
  cursor: default;
  z-index: 20;
  font-family: monospace;
  background-color: #1d3c7a;
  width: 200.1ch;
  align-items: center;
  box-sizing: border-box;
  box-shadow: 2px 2px 5px #33333382;
  flex-shrink: 0;
  word-break: break-all;
  font-size: 5px;
  transform: scale(1);
  transition: transform 0.5s ease-in-out 0.5s, margin 0.5s ease-in-out;
  margin-left: 120px;
  max-width: 40vw;
  min-width: 5rem;
}
#Result:hover {
  transition: transform 0.5s ease-in-out;
  transform: scale(0.8);
  cursor: pointer;
}
#Result-auth {
  cursor: default;
  z-index: 20;
  width: calc(100vw / 7);
  font-family: monospace;
  margin-left: 0px;
  width: 200.1ch;
  align-items: center;
  box-sizing: border-box;
  /* box-shadow: 2px 2px 5px #33333382; */
  flex-shrink: 0;
  word-break: break-all;
  font-size: 5px;
  transform: scale(0.5);
  max-width: 40vw;
  transition: transform 0.5s ease-in-out, margin 0.5s ease-in-out 0.5s;
  min-width: 5rem;
}
#output {
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  word-break: break-all;
  max-width: 40vw;
  /* background-color: #1d3c7a;
  color: #fafafa; */
}
.authenticator {
  justify-content: center;
}
.network {
  text-align: right;
  width: 1.5vw;
  color: #fafafa;
  font-size: 21px;
  text-emphasis: center;
  transform: translate(-7px, -100px);
  padding: 0.1rem 0.1rem 0.1rem 0;
  width: 90%;
}
.address {
  cursor: default;
  width: 90%;
  font-family: monospace;
  background-color: transparent;
  color: #fafafa;
  text-align: start;
  box-sizing: border-box;
  /* box-shadow: 2px 2px 5px #33333382; */
  font-size: 24px;
  transform: translate(-7px, -100px);
  padding: 0.1rem 0.1rem 0.1rem 0;
  margin: 0 0 0 1rem;
  overflow-y: hidden;
  overflow-x: scroll;
}
::-webkit-scrollbar {
  height: 2.5px;
}
/* Track */
::-webkit-scrollbar-track {
  background-color: transparent;
}

/* Handle */
::-webkit-scrollbar-thumb {
  background: #fafafa;
}

/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background: #fff;
}
@media only screen and (max-width: 700px) {
  .authenticator {
    flex-direction: row;
  }
  #Result {
    margin: 5vw 5vw 0 80vw;
    width: 20vw;
    z-index: 200;
  }
  #Result-auth {
    margin: 5vw 5vw 0 0vw;
    transform: scale(1);
    box-shadow: 0 0 0 0 rgb(84, 84, 84);
    width: 20vw;
    transition: transform 0.5s ease-in-out, margin 0.5s ease-in-out 0.5s;
    z-index: 200;
  }
  .address {
    transform: translate(0px, 0px);
  }
  .network {
    padding-left: 5px;
    transform: translate(0px, 0px);
  }
}
</style>
