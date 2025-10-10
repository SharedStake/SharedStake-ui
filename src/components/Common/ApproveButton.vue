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
import { useWallet } from "@/composables/useWallet";
import { useTokenBalance } from "@/composables/useTokenBalance";
import DappTxBtn from "../Common/DappTxBtn.vue";
import { toWei } from "../../utils/common";

export default {
  name: "ApprovalButton",
  components: { DappTxBtn },
  props: ["ABI_spender", "ABI_token", "amount", "cb", "autoHide"],
  setup() {
    const { userAddress } = useWallet();
    const { getTokenAllowance, BN } = useTokenBalance();
    return {
      userAddress,
      getTokenAllowance,
      BN
    };
  },
  data() {
    return {
      userApproved: null,
    };
  },

  computed: {
    enoughApproved() {
      return this.userApproved && this.userApproved.gte(this.amount);
    },

    ethAmt() {
      if (!this.amount) return 0;
      return toWei(this.amount);
    },
  },

  watch: {
    userAddress: {
      immediate: true,
      async handler() {
        await this.getApproved();
      },
    },
  },

  mounted: async function() {
    await this.getApproved();
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
        this.userApproved = await this.getTokenAllowance(tokenContract, spenderAddress);
      } catch (error) {
        console.error("Error getting approved amount:", error);
        this.userApproved = this.BN(0);
      }
    },
  },
};
</script>
