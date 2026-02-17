<template>
  <div class="gas-selector">
    <span class="gas-label">Gas</span>
    <Chooser
      :routes="gasRoutes"
      :current-active="selectedIndex"
      @update:current-active="handleGasChange"
    />
  </div>
</template>

<script>
import Chooser from "./Chooser.vue";
import { useGas } from "@/composables/useGas";

export default {
  name: "GasSelector",
  components: { Chooser },
  props: {
    gasPrices: {
      type: Object,
      required: true
    },
    modelValue: {
      type: Object,
      default: null
    }
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    const { getGasPriceDisplay, getGasLevels } = useGas();

    const gasLevels = getGasLevels();

    const gasRoutes = computed(() => {
      return gasLevels.map(level => ({
        text: getGasPriceDisplay(props.gasPrices[level]),
        cb: () => handleGasChange(gasLevels.indexOf(level))
      }));
    });

    const selectedIndex = computed(() => {
      if (!props.modelValue) return 1; // Default to medium
      
      const level = gasLevels.find(level => {
        const gasPrice = props.gasPrices[level];
        return gasPrice && 
               gasPrice.maxFeePerGas === props.modelValue.maxFeePerGas &&
               gasPrice.maxPriorityFeePerGas === props.modelValue.maxPriorityFeePerGas;
      });
      
      return level ? gasLevels.indexOf(level) : 1;
    });

    const handleGasChange = (index) => {
      const level = gasLevels[index];
      const gasPrice = props.gasPrices[level];
      emit("update:modelValue", gasPrice);
    };

    return {
      gasRoutes,
      selectedIndex,
      handleGasChange
    };
  }
};
</script>

<style scoped>
.gas-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.gas-label {
  font-size: 1rem;
  color: #ffffff;
  font-weight: 500;
}
</style>