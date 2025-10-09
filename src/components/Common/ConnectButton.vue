<template>
  <BaseButton
    variant="connect"
    :animated="!userAddress"
    @click="handleConnect"
  >
    <template v-if="userAddress">
      {{ userAddress.slice(0, 4) + "..." + userAddress.slice(-4) }}
    </template>
    <template v-else>
      Connect Wallet
    </template>
  </BaseButton>
</template>

<script>
import { useWallet } from '@/composables/useWallet';
import BaseButton from './BaseButton.vue';

export default {
  components: { BaseButton },
  setup() {
    const { userAddress, connect } = useWallet();
    return {
      userAddress,
      connect
    };
  },
  methods: {
    async handleConnect() {
      if (!this.userAddress) {
        await this.connect();
      }
    },
  },
};
</script>
