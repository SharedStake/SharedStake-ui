<template>
  <BaseButton
    :variant="userAddress ? 'connect' : 'animated'"
    size="medium"
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
import { mapActions, mapGetters } from "vuex";
import BaseButton from "./BaseButton.vue";

export default {
  components: {
    BaseButton
  },
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

