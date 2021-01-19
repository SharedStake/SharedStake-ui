<template>
  <div class="flex_row Graph">
    <vep
      class="timer"
      id="timer-example"
      :progress="progress"
      color="#7579ff"
      empty-color="#324c7e"
      :emptyColorFill="emptyColorFill"
      thickness="2%"
      emptyThickness="5%"
      :size="180"
      dash="strict 60 0.8"
      lineMode="out 5"
      :legend="false"
      legendClass="legend-custom-style"
      fontSize="1.5rem"
      font-color="white"
      animation="loop 1000 100"
      :loading="loading"
    >
      <span slot="legend-caption">
        <span>{{ day }}</span>
        <span class="mx-2"> days</span>
        <br />
        <span>{{ hour }}</span>
        <span class="mx-2">:</span>
        <span>{{ minPrefix }}{{ min }}</span>
        <span class="mx-2">:</span>
        <span>{{ secPrefix }}{{ sec }}</span>
      </span>
    </vep>
    <div class="explanation" v-show="explanation">
      <div class="title">
        <ImageVue :src="'eth-logo.png'" :size="'30px'" />
        Genesis
      </div>
      <div class="content">
        The Launch of the SGT represents the snopshot date for the First airdrop
        of SharedStake Governance Token!
      </div>
    </div>
  </div>
</template>

<script>
import ImageVue from "../../Handlers/image";
import { timeout } from "../../../utils/helpers";
export default {
  components: { ImageVue },
  props: { explanation: Boolean },
  data: () => ({
    loading: false,
    progress: 0,
    sec: 0,
    min: 0,
    hour: 0,
    day: 0,
    counter: 0,
    tasksDone: 125,
    emptyColor: {
      radial: false,
      colors: [
        {
          color: "#8ec5fc",
          offset: "0",
          opacity: "1",
        },
        {
          color: "#e0c3fc",
          offset: "100",
          opacity: "1",
        },
      ],
    },
    emptyColorFill: {
      radial: true,
      colors: [
        {
          color: "#3260FC",
          offset: "50",
          opacity: "0.2",
        },
        {
          color: "#3260FC",
          offset: "50",
          opacity: "0.15",
        },
        {
          color: "#3260FC",
          offset: "70",
          opacity: "0.15",
        },
        {
          color: "#3260FC",
          offset: "70",
          opacity: "0.1",
        },
        {
          color: "#3260FC",
          offset: "90",
          opacity: "0.1",
        },
        {
          color: "transparent",
          offset: "90",
          opacity: "0.1",
        },
        {
          color: "transparent",
          offset: "95",
          opacity: "0.1",
        },
        {
          color: "transparent",
          offset: "95",
          opacity: "0.1",
        },
      ],
    },
  }),
  computed: {
    tasksDonePercent() {
      return (this.tasksDone * 100) / 200;
    },
    minPrefix() {
      return this.min < 10 ? "0" : "";
    },
    secPrefix() {
      return this.sec < 10 ? "0" : "";
    },
  },
  methods: {
    async runTimer() {
      var now = Math.ceil(Date.now() / 1000);
      var nextAim = new Date("2021-02-02");
      var nextAimSec = nextAim.getTime() / 1000;
      if (nextAimSec > now) {
        while (now > nextAimSec) nextAimSec + 7 * 24 * 3600;
        this.counter = nextAimSec - now;
        while (this.counter > 0) {
          this.counter = this.counter - 1;
          await timeout(1000);
        }
      }
    },
  },
  watch: {
    counter(val) {
      this.sec = val % 60;
      let minutes = Math.floor(val / 60);
      this.min = minutes % 60;
      let hours = Math.floor(minutes / 60);
      this.hour = hours % 24;
      this.day = Math.floor(hours / 24);
      let tw = 14 * 24 * 3600;
      this.progress = 100 - (val * 100) / tw;
    },
  },
  mounted: async function () {
    this.runTimer();
  },
};
</script>

<style scoped>
.timer {
  padding: 0.4rem;
  margin: 0.6rem;
  background: #fafafa;
  min-width: 10rem;
}
.Graph {
  align-items: center;
  justify-content: left;
}
.explanation {
  max-width: 60%;
  padding: 0 0 0 3rem;
  text-align: left;
}
.title {
  color: #1d3c7a;
  font-size: 40px;
}
.content {
  font-size: 15px;
}

@media only screen and (max-width: 700px) {
  .Graph {
    flex-direction: column;
  }
  .explanation {
    max-width: 90%;
  }
}
</style>