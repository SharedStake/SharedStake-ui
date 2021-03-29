<template>
  <div class="chooser">
    <div class="navbar">
      <button
        class="switch"
        :class="{ switch_active: isDeposit }"
        @click="handleSwitch(true)">
        <span>Stake</span>
      </button>
      <button
        class="switch"
        :class="{ switch_active: !isDeposit }"
        @click="handleSwitch(false)">
        <span>Unstake</span>
      </button>
    </div>
  </div>
</template>

<script>

export default {
  data: () => ({
    isDeposit: true,
  }),
  methods: {
    handleSwitch(depositMode) {
      this.isDeposit = depositMode;
      this.$emit('isDeposit', this.isDeposit);
    }
  }
}

</script>

<style scoped>
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
  box-shadow: 0 2px 0 rgb(0 0 0 / 2%);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
  user-select: none;
  touch-action: manipulation;
  background: transparent;
}
.switch_active {
  border: 2px solid rgb(37, 167, 219);
  border-radius: 100px;
  color: #fff;
  cursor: pointer;
}
.switch_active:hover,
.switch:hover {
  background-color: rgba(37, 167, 219, 0.1);
}
.navbar {
  display: flex;
  border: 1px solid #3c3c3c;
  box-sizing: border-box;
  border-radius: 100px;
  width: 100%;
}
</style>
