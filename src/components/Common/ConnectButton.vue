<template>
  <button
    type="button"
    class="text-lg text-white btn-gradient"
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
