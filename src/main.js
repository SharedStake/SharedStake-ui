import Vue from 'vue'
import App from './App.vue'
import router from './router'
import VueEllipseProgress from 'vue-ellipse-progress';
import store from "./store"
Vue.config.productionTip = false


Vue.use(VueEllipseProgress, "vep");// you can define a name and use the plugin like <vep/>
new Vue({
  store,
  router,
  render: h => h(App),
}).$mount('#app')
