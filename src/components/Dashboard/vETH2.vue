<template>
  <div class="object">
    <div class="grid-container">
      <div class="head">vEth2 Profits</div>
      <div class="flex_row stat">
        ${{ profit }}.
        <div class="extra">
          {{ extra.toFixed(0).toString().padStart(3, "0") }}
        </div>
      </div>
      <div class="flex_row earned">Earned all time.</div>
      <div class="blank2"></div>
      <div class="flex_row staked">
        <div class="cont">${{ staked }}</div>
      </div>
      <div class="flex_row apy">{{ APY }} <span>%</span></div>
      <div class="blank"></div>
      <div class="bottom"></div>
    </div>
  </div>
</template>

<script>
import { timeout } from "../../utils/helpers";
export default {
  data: () => ({
    profit: 47,
    staked: 10000,
    extra: 123,
    APY: 9,
  }),
  mounted: async function () {
    let i = 1;
    while (i > 0) {
      let num = Number(this.extra) + this.staked / 31536;
      this.extra = num;
      if (this.extra > 1000) {
        this.profit += 1;
        this.extra = this.extra - 1000;
      }
      await timeout(Math.random() * 1000);
    }
  },
};
</script>

<style scoped>
span {
  font-size: 42px;
  line-height: 80px;
}
.object {
  padding: 5px;
  background: #2a2a2a;
  color: #ecf3fb;
}
.head {
  background: #272727;
  color: #d0d0d0;
  padding: 10px;
  white-space: nowrap;
}
.earned {
  color: #d0d0d0;
  padding: 10px;
  white-space: nowrap;
}
.stat {
  font-size: 200px;
  padding: 0 10px;
}
.grid-container {
  height: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 0.5fr 2fr 1fr 1.3fr 0.2fr;
  gap: 10px 10px;
  grid-template-areas:
    "head head head "
    "stat stat stat "
    "blank2 earned earned"
    "staked  blank apy "
    "botom botom botom ";
}
.head {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  grid-area: head;
}
.stat {
  font-weight: bolder;
  padding: 0 10px;
  grid-area: stat;
  align-items: flex-end;
  justify-content: center;
}
.earned {
  grid-area: earned;
  align-items: flex-start;
  justify-content: flex-end;
}
.extra {
  line-height: 160px;
  font-size: 80px;
}
.bottom {
  border-bottom: 20px solid #25a7db;
  grid-area: botom;
}
.apy {
  grid-area: apy;
  color: #25a7db;
  font-weight: bolder;
  align-items: flex-end;
  justify-content: flex-end;
  margin-right: 30px;
  font-size: 80px;
}
.staked {
  color: #2a2a2a;
  grid-area: staked;
  font-weight: bolder;
  align-items: flex-end;
  justify-content: flex-end;
  margin-left: 30px;
  font-size: 60px;
}
.blank {
  grid-area: blank;
}
.blank2 {
  grid-area: blank2;
}
.cont {
  background: #889293;
}
</style>