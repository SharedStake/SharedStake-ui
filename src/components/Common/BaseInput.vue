<template>
  <div class="input-container">
    <div class="input-body">
      <div class="flex flex-row items-center justify-evenly">
        <input
          :class="inputClasses"
          :type="type"
          :placeholder="placeholder"
          :value="value"
          :disabled="disabled"
          :readonly="readonly"
          :minlength="minlength"
          :maxlength="maxlength"
          :pattern="pattern"
          :inputmode="inputmode"
          :autocomplete="autocomplete"
          :autocorrect="autocorrect"
          :spellcheck="spellcheck"
          @input="handleInput"
          @focus="handleFocus"
          @blur="handleBlur"
        />
        <div class="token-symbol" v-if="symbol">
          {{ symbol }}
        </div>
      </div>
      
      <div 
        v-if="showBalance && balance !== null" 
        class="balance" 
        @click="handleMaxClick"
      >
        wallet: {{ balance }}
      </div>
      
      <div :class="backgroundClass" />
    </div>
  </div>
</template>

<script>
export default {
  name: "BaseInput",
  props: {
    value: {
      type: [String, Number],
      default: ""
    },
    type: {
      type: String,
      default: "text"
    },
    placeholder: {
      type: String,
      default: "0.0"
    },
    symbol: {
      type: String,
      default: ""
    },
    balance: {
      type: [String, Number],
      default: null
    },
    showBalance: {
      type: Boolean,
      default: true
    },
    disabled: {
      type: Boolean,
      default: false
    },
    readonly: {
      type: Boolean,
      default: false
    },
    variant: {
      type: String,
      default: "default",
      validator: (value) => ["default", "deposit", "withdraw"].includes(value)
    },
    // Input attributes
    minlength: {
      type: [String, Number],
      default: 1
    },
    maxlength: {
      type: [String, Number],
      default: 39
    },
    pattern: {
      type: String,
      default: "^[0-9]*[.,]?[0-9]*$"
    },
    inputmode: {
      type: String,
      default: "decimal"
    },
    autocomplete: {
      type: String,
      default: "off"
    },
    autocorrect: {
      type: String,
      default: "off"
    },
    spellcheck: {
      type: [String, Boolean],
      default: false
    }
  },
  computed: {
    inputClasses() {
      const baseClasses = "token-amount-input";
      const variantClasses = this.getVariantClasses();
      const stateClasses = this.getStateClasses();
      
      return [
        baseClasses,
        variantClasses,
        stateClasses
      ].filter(Boolean).join(" ");
    },
    backgroundClass() {
      const variantMap = {
        default: "background1",
        deposit: "background2",
        withdraw: "background3"
      };
      return variantMap[this.variant] || variantMap.default;
    }
  },
  methods: {
    getVariantClasses() {
      // Add any variant-specific classes here
      return "";
    },
    getStateClasses() {
      const classes = [];
      if (this.disabled) classes.push("disabled");
      if (this.readonly) classes.push("readonly");
      return classes.join(" ");
    },
    handleInput(event) {
      this.$emit("input", event.target.value);
    },
    handleFocus(event) {
      this.$emit("focus", event);
    },
    handleBlur(event) {
      this.$emit("blur", event);
    },
    handleMaxClick() {
      if (this.balance && !this.disabled && !this.readonly) {
        this.$emit("max-click", this.balance);
      }
    }
  }
};
</script>

<style scoped>
.input-container {
  @apply relative;
}

.input-body {
  @apply relative;
}

.token-amount-input {
  @apply w-full bg-transparent border-none outline-none text-white text-lg font-medium;
}

.token-amount-input:focus {
  @apply outline-none;
}

.token-amount-input.disabled {
  @apply opacity-50 cursor-not-allowed;
}

.token-amount-input.readonly {
  @apply cursor-default;
}

.token-symbol {
  @apply text-white text-lg font-medium ml-2;
}

.balance {
  @apply text-sm text-gray-400 cursor-pointer hover:text-gray-300 mt-1;
}

.background1 {
  @apply absolute bottom-0 left-0 right-0 h-px bg-gray-600;
}

.background2 {
  @apply absolute bottom-0 left-0 right-0 h-px bg-blue-500;
}

.background3 {
  @apply absolute bottom-0 left-0 right-0 h-px bg-green-500;
}
</style>