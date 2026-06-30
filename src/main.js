import { createApp } from 'vue'
import App from './App.vue'

import router from './router'
import { createPinia } from 'pinia'
import '../public/assets/styles/main.css';

import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import VueEllipseProgress from 'vue-ellipse-progress';

// Import performance monitoring and lazy loading
import { initPerformanceMonitoring } from './utils/performanceMonitoring.js'
import { initLazyLoading } from './utils/lazyLoading.js'

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

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(Toast, {
  transition: "Vue-Toastification__bounce",
  maxToasts: 20,
  newestOnTop: true
})
app.use(VueEllipseProgress, "vep");// you can define a name and use the plugin like <vep/>

if (import.meta.env.DEV) {
  const params = new URLSearchParams(window.location.search);
  const e2eAddress = params.get('e2eAddress');
  if (e2eAddress) {
    (async () => {
      try {
        const [{ ethers }, { useWalletStore }] = await Promise.all([
          import('ethers'),
          import('./stores/wallet')
        ]);
        const walletStore = useWalletStore(pinia);
        walletStore.setAddressOnboard(ethers.getAddress(e2eAddress));
      } catch (error) {
        console.warn('Invalid e2eAddress supplied:', e2eAddress, error);
      }
    })();
  }
}

// Initialize performance monitoring and lazy loading
initPerformanceMonitoring({
  enableCoreWebVitals: true,
  enableLazyLoadingMetrics: true,
  enableRealTimeMonitoring: true,
  enableAnalytics: true
});

initLazyLoading({
  rootMargin: '50px',
  threshold: 0.1,
  enablePerformanceMonitoring: true,
  enableAnalytics: true
});

app.mount('#app')
