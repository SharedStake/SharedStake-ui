import Vue from 'vue'
import App from './App.vue'

import router from './router'
import store from "./store"

import Notifications from 'vue-notification'
import VueEllipseProgress from 'vue-ellipse-progress';
import VueApexCharts from 'vue-apexcharts'

Vue.config.productionTip = false
Vue.use(Notifications)
Vue.use(VueEllipseProgress, "vep");// you can define a name and use the plugin like <vep/>
Vue.use(VueApexCharts)

Vue.component('apexchart', VueApexCharts)

new Vue({
  store,
  router,
  render: h => h(App),
}).$mount('#app')
