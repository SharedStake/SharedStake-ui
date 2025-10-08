<template>
  <div class="chooser">
    <div class="navbar">
      <button
        v-for="(route, index) in this.routes"
        :key="route.id"
        class="switch"
        :class="{ switch_active: activeRoute == index }"
        @click="onClick(index, route.cb)"
      >
        <span>{{ route.text }}</span>
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useWalletStore } from '@/stores/wallet'
import { toWei } from "../../utils/common";

export default {
  name: "Chooser",
  props: ["routes", "currentActive"],
  setup(props) {
    const walletStore = useWalletStore()
    const activeRoute = ref(parseInt(props.currentActive))

    const userConnectedWalletAddress = computed(() => walletStore.userAddress)

    const isActive = (index) => {
      return activeRoute.value == index;
    }

    const ethAmt = (amount) => {
      return toWei(amount);
    }

    const onClick = (index, cb) => {
      activeRoute.value = index;
      return cb(index, props.routes);
    }

    const asyncOnClick = async (index, cb) => {
      activeRoute.value = index;
      return await cb(index, props.routes);
    }

    return {
      activeRoute,
      userConnectedWalletAddress,
      isActive,
      ethAmt,
      onClick,
      asyncOnClick
    }
  }
};
</script>

<style scoped>
.chooser {
  /* background-color: rgb(15, 16, 19); */
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
}

.navbar {
  display: flex;
  border: 1px solid #3c3c3c;
  box-sizing: border-box;
  border-radius: 100px;
  width: 100%;
}

.switch {
  height: 40px;
  padding: 0 20px;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  border-color: transparent;
  color: #fff;
  border-radius: 100px;
  line-height: 24px;
  box-sizing: border-box;
  white-space: nowrap;
  text-align: center;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
  user-select: none;
  touch-action: manipulation;
}

.switch_active {
  border: 2px solid rgb(37, 167, 219);
  border-radius: 100px;
  color: #fff;
  cursor: pointer;
  font-weight: bold;
}

.switch_active:hover,
.switch:hover {
  transform: scale(0.98);
}
</style>
