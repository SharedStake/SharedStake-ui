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
      {{ address ? address.toLowerCase() : "" }}
    </div>
    <div v-if="authenticated" class="network" v-show="network">
      on {{ network }}
    </div>
    <Socials :class="authenticated ? 'Socials-auth' : 'Socials'" />
  </div>
</template>

<script>
import ImageVue from "../../Handlers/image";
import Socials from "./Socials/Socials";
const networks = {
  0: "Olympic",
  1: "Mainnet",
  2: "Expanse",
  3: "Ropsten",
  4: "Rinkeby",
  5: "Goerli",
  6: "Kotti Classic",
  7: "Mordor Classic",
  8: "Ubiq",
  10: "Quorum",
  42: "Kovan",
  60: "GoChain",
  77: "Sokol",
  99: "Core",
  100: "xDai",
};
export default {
  name: "Figure",
  props: {
    authenticated: Boolean,
    address: String,
  },
  components: { ImageVue, Socials },
  data() {
    return {
      network: false,
    };
  },
  watch: {
    address: function (val) {
      console.log("s", val);
    },
    authenticated: async function (newVal) {
      if (newVal) {
        let walletAddress = await window.web3.eth.getAccounts();
        this.$emit("address", walletAddress[0]);
        let network = await window.web3.eth.net.getId();
        this.network = networks[network];
      } else {
        this.network = false;
      }
    },
  },
  created: function () {
    var self = this;
    window.ethereum.on("accountsChanged", function (walletAddress) {
      console.log(walletAddress);
      self.$emit("address", walletAddress[0]);
    });
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
  margin-left: 100px;
  max-width: 40vw;
  min-width: 5rem;
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
.Socials {
  width: calc(100vw / 7 * 1.5);
  position: fixed;
  transition: all 1s ease-in;
  top: 90%;
  z-index: 200;
}
.Socials-auth {
  width: calc(100vw / 7 * 1.5);
  position: fixed;
  transition: all 1s ease-in;
  top: 90%;
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
@media only screen and (max-width: 600px) {
  .Socials {
    width: 100vw;
  }
  .Socials-auth {
    width: 100vw;
  }
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
