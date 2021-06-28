<template>
  <div class="object">
    <div class="grid-container">
      <div class="head">{{ head }}</div>
      <div class="stat">{{ stat }}</div>
      <apexchart
        :style="{ color: '#000' }"
        v-if="type == 'graph'"
        width="100%"
        type="area"
        :options="options"
        :series="series"
      ></apexchart>
      <div
        v-else-if="(type == 'growth' || type == 'percentage') && input > 0"
        class="growth positive"
      >
        <ImageVue :src="'up-arrow.svg'" :size="'40px'" />
        {{ input }}
        <span v-if="type == 'percentage'">%</span>
      </div>
      <div
        v-else-if="type == 'growth' || type == 'percentage'"
        class="growth negative"
      >
        <ImageVue :src="'down-arrow.svg'" :size="'40px'" />
        {{ input * -1 }}
        <span v-if="type == 'percentage'">%</span>
      </div>
      <div v-else-if="type == 'explanation'">
        <div v-for="el in input" v-bind:key="el" class="flex_row explanation">
          <ImageVue :src="'down.svg'" :size="'10px'" class="arrow" />
          {{ el }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ImageVue from "../Handlers/ImageVue.vue";
export default {
  components: { ImageVue },
  props: ["head", "stat", "type", "width", "input"],
  data: function () {
    return {
      options: {
        fill: {
          type: "gradient",
          gradient: {
            shade: "dark",
            type: "vertical",
            shadeIntensity: 0.5,
            gradientToColors: undefined,
            opacityFrom: 1,
            opacityTo: 0,
          },
        },
        grid: {
          show: false,
        },
        legend: {
          show: false,
        },
        dataLabels: {
          enabled: false,
        },
        chart: {
          selection: { enabled: false },
          toolbar: {
            show: false,
          },
          zoom: {
            enabled: false,
          },
          id: "vuechart",
        },
        xaxis: {
          show: false,
          labels: {
            show: false,
          },
          axisBorder: {
            show: false,
          },
          axisTicks: {
            show: false,
          },
          crosshairs: {
            show: false,
          },
        },
        yaxis: {
          show: false,
          labels: {
            show: false,
          },
          axisBorder: {
            show: false,
          },
          axisTicks: {
            show: false,
          },
          crosshairs: {
            show: false,
          },
        },
      },
      series: [],
    };
  },
  mounted: function () {
    let series = [
      {
        name: " ",
        data: this.input,
      },
    ];
    this.series = series;
  },
};
</script>

<style scoped>
.object {
  padding: 5px;
  background: #2a2a2a;
  color: #ecf3fb;
}
.head {
  background: #272727;
  color: #d0d0d0;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  white-space: nowrap;
}
.stat {
  font-size: 60px;
  padding: 0 10px;
}
.grid-container {
  height: 100%;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 0.5fr 0.5fr 1.5fr;
  gap: 10px 10px;
  grid-template-areas:
    "head"
    "stat"
    "graph";
}
.head {
  grid-area: head;
}
.stat {
  font-weight: bolder;
  padding: 0 10px;
  grid-area: stat;
}
.graph {
  padding: 0 10px;
  grid-area: graph;
}
.growth {
  font-size: 42px;
  padding: 0 10px;
  grid-area: graph;
}
.explanation {
  padding: 0 10px;
  grid-area: graph;
  font-size: 30px;
  align-items: center;
  justify-content: flex-start;
}
.positive {
  color: #8cc95f;
}
.negative {
  color: #dc5847;
}
.arrow {
  transform: rotate(-90deg);
}
</style>