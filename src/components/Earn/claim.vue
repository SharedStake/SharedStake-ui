<template>
  <div class="geyserwrapper">
    <div class="geyserChooser">
      <ImageVue
        :src="'tokens/SGT.png'"
        :size="innerWidth > 700 ? '40px' : '8vw'"
        class="headerPart poolIcon"
      />
      <div class="headerPart poolName">
        Airdrop
        <div class="minitext">Claim SGT</div>
      </div>
      <div class="headerPart poolAddress">
        <div class="minitext">Address:</div>
        <div :class="'stakePage'">
          <input
            class="token-amount-input"
            title="address"
            autocomplete="off"
            autocorrect="off"
            type="text"
            pattern="^[0-9]*[.,]?[0-9]*$"
            placeholder="0x0"
            minlength="1"
            spellcheck="false"
            v-model="address"
          />
        </div>
      </div>
      <div class="headerPart poolClaim">
        <span v-if="!userAddress">
          <div class="minitext">Status:</div>
          Connect
        </span>
        <span v-else-if="!address">
          <div class="minitext">Status:</div>
          ←
        </span>
        <span v-else-if="!eligible">
          <div class="minitext">Status:</div>
          Not Eligible
        </span>
        <span v-else-if="isClaimed">
          <div class="minitext">Status:</div>
          Claimed
        </span>
        <span v-else>
          <div class="minitext">Available:</div>
          {{ available }}
        </span>
      </div>
      <div v-show="eligible && !isClaimed" class="headerPart poolButton">
        <button class="mainButton" @click="Claim">Claim</button>
      </div>
    </div>
  </div>
</template>

<script>
import ImageVue from "../Handlers/ImageVue.vue";
import { airdrop } from "@/contracts";
import { notify } from "@/utils/common";
import { ethers } from "ethers";
// import { merkle } from "./airdrop.js";
import { useWalletStore } from "@/stores/wallet";

export default {
  components: { ImageVue },
  setup() {
    const walletStore = useWalletStore();
    return {
      walletStore
    };
  },
  data: () => ({
    innerWidth: 0,
    address: "",
    isClaimed: false,
    txs: [],
    available: 0,
    eligible: false,
    claim: {},
  }),
  watch: {
    async userAddress() {
      await this.isEligible();
    },
    async address() {
      await this.isEligible();
    },
  },
  created: function () {
    this.innerWidth = window.innerWidth;
    window.addEventListener("resize", this.onResize);
    var self = this;
    if (window.ethereum)
      window.ethereum.on("accountsChanged", async function () {
        await self.mounted();
      });
  },
  mounted: async function () {
    await this.mounted();
  },
  unmounted() {
    window.removeEventListener("resize", this.onResize);
  },
  computed: {
    userAddress() {
      return this.walletStore.userAddress;
    },
  },
  methods: {
    async mounted() {
      await this.isEligible();
    },
    onResize() {
      this.innerWidth = window.innerWidth;
    },
    async isEligible() {
      try {
        if (!this.address || this.address.trim() === '') {
          this.eligible = false;
          return;
        }
        
        // Validate and checksum the address using ethers.js
        let address;
        try {
          address = ethers.getAddress(this.address);
        } catch (error) {
          console.error("Invalid Ethereum address:", this.address);
          this.eligible = false;
          return;
        }
        
        // Dynamically import merkle data to reduce initial bundle size
        const { merkle } = await import("./airdrop.js");
        const claims = merkle.claims;
        let claim = null;
        for (let key in claims) {
          if (key == address) {
            claim = claims[key];
          }
        }
        if (claim) {
          this.eligible = true;
          const airdropContract = airdrop();
          if (!airdropContract) {
            console.error("Airdrop contract not available");
            return;
          }
          
          // Convert claim index to hex format
          const claimIndexHex = ethers.toQuantity(claim.index);
          let isClaimed = await airdropContract.isClaimed(claimIndexHex);
          if (isClaimed) this.isClaimed = true;
          else {
            this.isClaimed = false;
            this.available = (parseInt(claim.amount, 16) / 1e18).toFixed(2);
            this.claim = claim;
          }
        } else this.eligible = false;
      } catch (error) {
        console.error("Error checking eligibility:", error);
        this.eligible = false;
      }
    },
    async Claim() {
      try {
        const airdropContract = airdrop(true); // Use signer for write operations
        if (!airdropContract) {
          throw new Error("Airdrop contract not available");
        }
        
        // Convert claim index to hex format using ethers.js
        const claimIndexHex = ethers.toQuantity(this.claim.index);
        
        const tx = await airdropContract.claim(
          claimIndexHex,
          this.address,
          this.claim.amount,
          this.claim.proof
        );
        
        // Notify with transaction hash
        notify.hash(tx.hash);
        
        // Wait for confirmation
        await tx.wait();
        
        this.loading = false;
        await this.mounted();
      } catch (error) {
        console.error("Error claiming airdrop:", error);
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.geyserwrapper {
  position: relative;
  transition: transform 0.2s ease-in-out;
  margin: 3vh 1vw 2vh 1vw;
  width: 60vw;
  border-radius: 49px;
  border: 1px rgb(37, 167, 219) solid;
  background-color: #181818;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  transition: 0.42s ease-in-out;
}

.geyserChooser {
  width: 90%;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
  padding: 1vh 2vw 1vh 2vw;
  grid-template-rows: 1fr;
  gap: 0px 0px;
  grid-template-areas: "icon poolname poolname poolAddress poolAddress poolAddress poolAddress  status status button ";
  justify-items: start;
  align-items: center;
  margin: 15px 0 15px 0;
}

.geyserStats {
  width: 100%;
  padding: 15px 0 15px 0;
  margin: 0;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 1fr;
  gap: 0px 10px;
  color: #fafafa;
  background-color: #00ff84;
}
.geyserMain,
.geyserUser {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr;
  gap: 0px 10px;
}
.geyserMain {
  border-top: 1px #00ff84 solid;
}
.headerPart,
.statsPart,
.userPart {
  text-align: left;
  font-weight: 500;
  line-height: 1.2;
  width: 97%;
  color: #fff;
  word-break: break-all;
}

.mainPart,
.statsPart,
.userPart {
  padding: 1vh 2vw 1vh 2vw;
}

.mainPart,
.userPart {
  margin: 2vh 0 2vh 0;
  font-size: 32px;
}
.userPart {
  text-shadow: 1px 1px #00ff84;
}
#rightBorder {
  border-right: 1px #ff007a solid;
}
#whiteBorder {
  border-right: 1px #fafafa solid;
}
.poolIcon {
  grid-area: icon;
  transition: all 0.2s ease-in-out;
}
#headDown {
  transition: all 0.2s ease-in-out;
  transform: rotate(180deg);
}
#headUp {
  transition: all 0.2s ease-in-out;
  transform: rotate(0);
}
.poolAddress {
  grid-area: poolAddress;
}
.poolName {
  grid-area: poolname;
}
.poolClaim {
  grid-area: status;
}
.poolButton {
  grid-area: button;
  justify-self: right;
  display: inline-block;
  font-size: 1.5rem;
}
.poolBalance {
  grid-area: balance;
}
.label {
  grid-area: label;
  justify-self: right;
  fill: currentColor;
  width: 1em;
  height: 1em;
  display: inline-block;
  font-size: 1.5rem;
  transition: fill 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  flex-shrink: 0;
  user-select: none;
}
.minitext {
  font-weight: 700;
  font-size: 14px;
  color: #00ff849c;
}

/* stake input part */
.stakePage {
  display: flex;
  align-items: center;
  max-width: 18vw;
  justify-content: space-between;
  min-height: 20%;
  border: 1px solid #afb2b6;
  padding: 0.5rem 0.5rem 0.5rem 0.5rem;
  text-align: center;
}
.token-amount-input {
  color: #fff;
  position: relative;
  font-weight: 500;
  outline: none;
  border: none;
  -webkit-flex: 1 1 auto;
  -ms-flex: 1 1 auto;
  flex: 1 1 auto;
  background-color: transparent;
  font-size: 17px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0px;
  -webkit-appearance: textfield;
  cursor: pointer;
}

.mainButton {
  width: 100%;
  min-height: 15%;
  border-radius: 15px;
  border: none;
  align-items: center;
  margin: 15px 0 15px 0;
  padding: 0.5rem 0.75rem 0.5rem 0.75rem;
  font-size: 20px;
  font-weight: 500;
  text-align: center;
  border-bottom: 1px solid #afb2b6;
  transition: all 0.2s linear, transform 0.1s ease-in-out;
  cursor: pointer;
  color: #0b8f92;
}
.mainButton:hover {
  background-color: #0b8f92;
  color: #fafafa;
}
@media only screen and (max-width: 700px) {
  .geyserwrapper {
    position: relative;
    transition: transform 0.2s ease-in-out;
    margin: 4vh 1vw 2vh 1vw;
    width: 90vw;
    border: 1px #00ff84 solid;
    border-radius: 49px;
    background-color: #181818;
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    transition: 0.42s ease-in-out;
  }
  .geyserChooser {
    padding: 0;
  }
  .headerPart {
    font-size: 20px;
    width: 90%;
    word-break: break-all;
  }
  .minitext {
    font-size: 10px;
  }
  .mainButton {
    font-size: 10px;
  }
}
</style>