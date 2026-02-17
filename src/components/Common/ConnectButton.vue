<template>
  <button
    type="button"
    class="text-lg text-white btn-connect"
    :class="{ 'btn-animated': !isConnected }"
    @click="handleConnect"
  >
    <template v-if="isConnected">
      {{ getFormattedAddress() }}
    </template>
    <template v-else>
      Connect Wallet
    </template>
  </button>
</template>

<script>
import { useWallet } from "@/composables/useWallet";

export default {
  setup() {
    const { isConnected, connect, getFormattedAddress } = useWallet();
    
    return {
      isConnected,
      connect,
      getFormattedAddress
    };
  },

  methods: {
    async handleConnect() {
      if (!this.isConnected) {
        await this.connect();
      }
    },
  },
};
</script>

<style scoped>
.btn-connect {
  padding: 0.5rem 1.5rem;
  border: 3px double transparent;
  border-radius: 80px;
  background: linear-gradient(rgb(13, 14, 33), rgb(13, 14, 33)),
    radial-gradient(
      circle at left top,
      rgb(250, 82, 160) 0%,
      rgb(37, 167, 219) 100%
    );
  background-origin: border-box;
  background-clip: padding-box, border-box;
  background-size: 100% 100%;
  transition: filter 0.5s ease-out;
  white-space: nowrap;
}

.btn-animated {
  animation: animatedButton 3s ease-out backwards infinite;
}

.btn-connect:hover {
  -webkit-filter: drop-shadow(0px 0px 4px rgba(255, 255, 255, 0.7))
    brightness(200%);
  filter: drop-shadow(0px 0px 4px rgba(255, 255, 255, 0.7)) brightness(120%);
}
@keyframes animatedButton {
  from {
    background-position: 0px;
  }

  to {
    background-position: 168.6px;
  }
}
</style>

