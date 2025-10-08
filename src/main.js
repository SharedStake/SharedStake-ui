import Vue from 'vue'
import App from './App.vue'

import router from './router'
import store from "./store"
import '../public/assets/styles/main.css';

import Notifications from 'vue-notification'
import VueEllipseProgress from 'vue-ellipse-progress';
import { performanceMonitoring } from './utils/performanceMonitoring.js';

Vue.config.productionTip = false
Vue.use(Notifications)
Vue.use(VueEllipseProgress, "vep");// you can define a name and use the plugin like <vep/>

// Handle unhandled promise rejections (e.g., ENS resolution errors)
window.addEventListener('unhandledrejection', (event) => {
  // Check if it's an ENS-related error
  if (event.reason && (
    event.reason.message?.includes('reverse') || 
    event.reason.message?.includes('ENS') ||
    event.reason.message?.includes('Internal error')
  )) {
    console.warn('ENS resolution failed (non-critical):', event.reason.message);
    event.preventDefault(); // Prevent the error from bubbling up
  }
});

new Vue({
  store,
  router,
  render: h => h(App),
  mounted() {
    // Initialize performance monitoring
    performanceMonitoring.init();
  }
}).$mount('#app')
