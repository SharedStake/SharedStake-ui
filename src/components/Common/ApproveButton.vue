<template>
  <span>
    <dapp-tx-btn
      v-if="autoHide ? !enoughApproved : true"
      :click="genProps"
      :cb="wrappedCb"
    >
      <span>Approve</span>
    </dapp-tx-btn>
  </span>
</template>

<script>
import { mapGetters } from "vuex";
import DappTxBtn from "../Common/DappTxBtn.vue";

import BN from "bignumber.js";
import { toWei } from "../../utils/common";
BN.config({ ROUNDING_MODE: BN.ROUND_DOWN });
BN.config({ EXPONENTIAL_AT: 100 });

export default {
  name: "ApprovalButton",
  props: ["ABI_spender", "ABI_token", "amount", "cb", "autoHide"],
  components: { DappTxBtn },
  data() {
    return {
      userApproved: BN(0),
    };
  },

  mounted: async function() {
    await this.getApproved();
  },

  watch: {
    userConnectedWalletAddress: {
      immediate: true,
      async handler() {
        await this.getApproved();
      },
    },
  },

  computed: {
    ...mapGetters({ userConnectedWalletAddress: "userAddress" }),

    enoughApproved() {
      return this.userApproved.gte(this.amount);
    },

    ethAmt() {
      if (!this.amount) return 0;
      return toWei(this.amount);
    },
  },

  methods: {
    async genProps() {
      const spenderContract = this.ABI_spender();
      const spenderAddress = await spenderContract.getAddress();
      
      return {
        abiCall: async (...args) => {
          const tokenContract = this.ABI_token(true); // Use signer for write operations
          if (!tokenContract) {
            throw new Error("Token contract not available");
          }
          return await tokenContract.approve(...args);
        },
        argsArr: [spenderAddress, this.ethAmt],
        cb: this.wrappedCb,
      };
    },

    async wrappedCb() {
      await this.getApproved();
      await this.cb();
    },

    async getApproved() {
      try {
        const tokenContract = this.ABI_token();
        const spenderContract = this.ABI_spender();
        if (!tokenContract || !spenderContract) {
          console.error("Contracts not available");
          return;
        }
        const spenderAddress = await spenderContract.getAddress();
        let userApproved = await tokenContract.allowance(
          this.userConnectedWalletAddress,
          spenderAddress
        );
        this.userApproved = BN(userApproved.toString());
      } catch (error) {
        console.error("Error getting approved amount:", error);
        this.userApproved = BN(0);
      }
    },
  },
};
</script>
