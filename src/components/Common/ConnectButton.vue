<template>
  <button
    type="button"
    class="text-lg text-white btn-connect"
    :class="{ 'btn-animated': !userAddress }"
    @click="handleConnect"
  >
    <template v-if="userAddress">
      {{ userAddress.slice(0, 4) + "..." + userAddress.slice(-4) }}
    </template>
    <template v-else>
      Connect Wallet
    </template>
  </button>
</template>

<script>
import { mapActions, mapGetters } from "vuex";

export default {
  computed: {
    ...mapGetters({ userAddress: "userAddress" }),
  },

  methods: {
    ...mapActions(["setAddress"]),

    async handleConnect() {
      if (!this.userAddress) {
        await this.setAddress();
      }
    },
  },
};
</script>

<style scoped>
.btn-connect {
  padding: var(--spacing-sm) var(--spacing-lg);
  border: 3px double transparent;
  border-radius: var(--radius-full);
  background: linear-gradient(rgb(13, 14, 33), rgb(13, 14, 33)),
    radial-gradient(
      circle at left top,
      var(--color-brand-primary) 0%,
      #25a7db 100%
    );
  background-origin: border-box;
  background-clip: padding-box, border-box;
  background-size: 100% 100%;
  transition: filter var(--transition-slow);
  white-space: nowrap;
  font-size: var(--font-size-lg);
}

.btn-animated {
  animation: animatedButton 3s ease-out backwards infinite;
}

.btn-connect:hover {
  filter: drop-shadow(var(--shadow-glow)) brightness(120%);
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
