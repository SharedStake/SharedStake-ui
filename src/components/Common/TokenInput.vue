<template>
  <div class="token-input-container">
    <label v-if="label" class="token-input-label">
      {{ label }}
    </label>
    
    <div class="token-input-wrapper">
      <input
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        class="token-input"
        inputmode="decimal"
        autocomplete="off"
        autocorrect="off"
        type="text"
        pattern="^[0-9]*[.,]?[0-9]*$"
        minlength="1"
        maxlength="39"
        spellcheck="false"
        @input="handleInput"
      >
      
      <div class="token-symbol">
        {{ tokenSymbol }}
      </div>
      
      <button
        v-if="showMaxButton && !disabled"
        class="max-button"
        @click="handleMaxClick"
      >
        MAX
      </button>
    </div>
    
    <div
      v-if="showBalance"
      class="balance-display"
      @click="handleMaxClick"
    >
      Balance: {{ balanceDisplay }}
    </div>
  </div>
</template>

<script>
import { useBigNumber } from "@/composables/useBigNumber";

export default {
  name: "TokenInput",
  props: {
    modelValue: {
      type: [String, Number],
      default: ""
    },
    tokenSymbol: {
      type: String,
      default: "ETH"
    },
    label: {
      type: String,
      default: ""
    },
    placeholder: {
      type: String,
      default: "0.0"
    },
    balance: {
      type: [String, Number, Object],
      default: 0
    },
    showBalance: {
      type: Boolean,
      default: true
    },
    showMaxButton: {
      type: Boolean,
      default: true
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  emits: ["update:modelValue", "max-click"],
  setup(props, { emit }) {
    const { formatBN, parseBN } = useBigNumber();

    const balanceDisplay = computed(() => {
      if (!props.balance) return "0";
      if (props.balance.isBigNumber) {
        return formatBN(props.balance);
      }
      return formatBN(parseBN(props.balance));
    });

    const handleInput = (event) => {
      const value = event.target.value;
      
      // Basic validation
      if (value.length > 40) {
        event.target.value = props.modelValue;
        return;
      }
      
      // Allow decimal point
      if (value[value.length - 1] === "." && value[value.length - 2] !== ".") {
        emit("update:modelValue", value);
        return;
      }
      
      // Check if valid number
      if (isNaN(value) && value !== "") {
        event.target.value = props.modelValue;
        return;
      }
      
      emit("update:modelValue", value || "0");
    };

    const handleMaxClick = () => {
      emit("max-click");
    };

    return {
      balanceDisplay,
      handleInput,
      handleMaxClick
    };
  }
};
</script>

<style scoped>
.token-input-container {
  width: 100%;
}

.token-input-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #d1d5db;
  margin-bottom: 0.5rem;
}

.token-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  border: 1px solid #374151;
  border-radius: 0.75rem;
  background-color: #0f1013;
  padding: 0.5rem;
}

.token-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #ffffff;
  font-size: 1.5rem;
  line-height: 2rem;
  text-align: right;
  padding: 0.25rem 0.5rem;
  min-width: 0;
}

.token-symbol {
  font-size: 0.875rem;
  color: #9ca3af;
  margin: 0 0.5rem;
  white-space: nowrap;
}

.max-button {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  background: #ffffff;
  color: #2563eb;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.max-button:hover {
  background: #f3f4f6;
}

.balance-display {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #9ca3af;
  text-align: center;
  text-decoration: underline;
  cursor: pointer;
  font-weight: 600;
}

.balance-display:hover {
  color: #ffffff;
}
</style>