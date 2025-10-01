<template>
  <button
    type="button"
    class="text-lg text-white px-6 py-2 border-double border-transparent bg-gradient-to-r from-brand-accent to-brand-secondary bg-origin-border bg-clip-padding transition-all duration-500 ease-out whitespace-nowrap"
    style="border-width: 3px; border-radius: 80px; background-image: linear-gradient(#0d0e21, #0d0e21), radial-gradient(circle at left top, #fa52a0 0%, #25a7db 100%); background-size: 100% 100%;"
    :class="{ 'animate-button-shift': !userAddress }"
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
button:hover {
  filter: drop-shadow(0px 0px 4px rgba(255, 255, 255, 0.7)) brightness(120%);
}
</style>
