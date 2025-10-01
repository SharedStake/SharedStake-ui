<template>
  <button
    type="button"
    class="text-lg text-white px-6 py-2 border-[3px] border-double border-transparent rounded-[80px] bg-gradient-to-r from-[#0d0e21] to-[#0d0e21] bg-gradient-to-r from-brand-accent to-brand-secondary bg-origin-border bg-clip-padding bg-[length:100%_100%] transition-all duration-500 ease-out whitespace-nowrap hover:drop-shadow-[0px_0px_4px_rgba(255,255,255,0.7)] hover:brightness-[120%]"
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
/* All styles are now handled by Tailwind classes in the template */
</style>
