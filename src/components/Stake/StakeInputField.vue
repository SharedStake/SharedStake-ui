<template>
  <input
    :value="inputValue"
    class="token-amount-input"
    inputmode="decimal"
    title="Token Amount"
    autocomplete="off"
    autocorrect="off"
    type="text"
    pattern="^[0-9]*[.,]?[0-9]*$"
    placeholder="0.0"
    minlength="1"
    maxlength="39"
    spellcheck="false"
    :readonly="isReadonly"
    v-on:input="updateValue($event.target.value)"
  />
</template>

<script>

export default {
  props: { isReadonly: Boolean },
  data: () => ({
    inputValue: "",
  }),
  methods:  {
    updateValue(value) {
      this.$emit('input', value);
    }
  } 
}
</script>

<style scoped>
.token-amount-input {
  box-sizing: border-box;
  z-index: 10;
  margin: 0;
  padding: 0;
  font-variant: tabular-nums;
  list-style: none;
  font-feature-settings: "tnum";
  position: relative;
  display: inline-block;
  width: 70%;
  padding: 4px 11px;
  color: #fff;
  background-color: transparent;
  outline-width: 0;
  font-size: 34px;
  line-height: 40px;
  text-align: right;
  height: 40px;
  padding-bottom: 0;
  text-overflow: ellipsis;
  border-radius: 2px;
  border: none;
  touch-action: manipulation;
}
</style>