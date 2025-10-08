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
import { ref, computed, onMounted, watch } from 'vue'
import { useWalletStore } from '@/stores/wallet'
import DappTxBtn from "../Common/DappTxBtn.vue";

import BN from "bignumber.js";
import { toWei } from "../../utils/common";
BN.config({ ROUNDING_MODE: BN.ROUND_DOWN });
BN.config({ EXPONENTIAL_AT: 100 });

export default {
  name: "ApprovalButton",
  props: ["ABI_spender", "ABI_token", "amount", "cb", "autoHide"],
  components: { DappTxBtn },
  setup(props) {
    const walletStore = useWalletStore()
    const userApproved = ref(BN(0))

    const userConnectedWalletAddress = computed(() => walletStore.userAddress)

    const enoughApproved = computed(() => {
      return userApproved.value.gte(props.amount);
    })

    const ethAmt = computed(() => {
      if (!props.amount) return 0;
      return toWei(props.amount);
    })

    const getApproved = async () => {
      try {
        const tokenContract = props.ABI_token();
        const spenderContract = props.ABI_spender();
        if (!tokenContract || !spenderContract) {
          console.error("Contracts not available");
          return;
        }
        const spenderAddress = await spenderContract.getAddress();
        let approved = await tokenContract.allowance(
          userConnectedWalletAddress.value,
          spenderAddress
        );
        userApproved.value = BN(approved.toString());
      } catch (error) {
        console.error("Error getting approved amount:", error);
        userApproved.value = BN(0);
      }
    }

    const genProps = async () => {
      const spenderContract = props.ABI_spender();
      const spenderAddress = await spenderContract.getAddress();
      
      return {
        abiCall: async (...args) => {
          const tokenContract = props.ABI_token(true); // Use signer for write operations
          if (!tokenContract) {
            throw new Error("Token contract not available");
          }
          return await tokenContract.approve(...args);
        },
        argsArr: [spenderAddress, ethAmt.value],
        cb: wrappedCb,
      };
    }

    const wrappedCb = async () => {
      await getApproved();
      await props.cb();
    }

    // Watch for wallet address changes
    watch(userConnectedWalletAddress, async () => {
      await getApproved();
    }, { immediate: true })

    // Get approved amount on mount
    onMounted(async () => {
      await getApproved();
    })

    return {
      userApproved,
      userConnectedWalletAddress,
      enoughApproved,
      ethAmt,
      genProps,
      wrappedCb,
      getApproved
    }
  }
};
</script>
