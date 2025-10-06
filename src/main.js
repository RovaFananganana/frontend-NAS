import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

// Import Tailwind
import './assets/main.css'
//Import fontawesome
import '@fortawesome/fontawesome-free/css/all.css'
import '@fortawesome/fontawesome-free/js/all.js'

// Initialize theme
import { initializeTheme } from './utils/themeUtils.js'
initializeTheme()
console.log("Theme appliqué:", document.documentElement.getAttribute("data-theme"));


const app = createApp(App)

app.use(store)
app.use(router)

// Initialize app-wide features
store.dispatch('initializeApp')

// Global error handler
app.config.errorHandler = (error, instance, info) => {
  console.error('Global error:', error, info)
  
  // Show user-friendly error message
  store.dispatch('showError', 'Une erreur inattendue s\'est produite. Veuillez actualiser la page.')
}

// Global warning handler
app.config.warnHandler = (msg, instance, trace) => {
  if (process.env.NODE_ENV === 'development') {
    console.warn('Vue warning:', msg, trace)
  }
}

app.config.errorHandler = (err, vm, info) => {
  console.error("⚠️ [Global Vue Error]", err);
  console.log("🧱 Component name:", vm?.$options?.name);
  console.log("ℹ️ Info:", info);
};
app.mount('#app')
