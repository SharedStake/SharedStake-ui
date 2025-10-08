import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { plugin as markdown } from 'vite-plugin-markdown'

export default defineConfig({
  plugins: [
    vue(),
    markdown({ mode: 'html' })
  ],
  base: '/',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 8080,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate Vue ecosystem
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          // Separate Web3 ecosystem
          'web3-vendor': ['ethers', '@web3-onboard/core', '@web3-onboard/injected-wallets'],
          // Separate UI libraries
          'ui-vendor': ['vue-toastification', 'vue-ellipse-progress', 'axios'],
          // Separate utility libraries
          'utils-vendor': ['bignumber.js', 'core-js', 'bnc-notify', 'marked']
        }
      }
    }
  },
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      'ethers',
      '@web3-onboard/core',
      '@web3-onboard/injected-wallets',
      'vue-toastification',
      'vue-ellipse-progress',
      'bignumber.js',
      'marked'
    ]
  }
})