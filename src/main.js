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

// Global warning handler
app.config.warnHandler = (msg, instance, trace) => {
  if (process.env.NODE_ENV === 'development') {
    console.warn('Vue warning:', msg, trace)
  }
}

// Global error handler (single unified handler)
app.config.errorHandler = (err, vm, info) => {
  try {
    console.error('⚠️ [Global Vue Error]', err);

    // Try to extract useful component information for debugging
    const compName = vm?.type?.name || vm?.$options?.name || vm?.name || 'unknown'
    console.log('🧱 Component name:', compName)
    console.log('ℹ️ Info:', info)

    // If we have a component instance, attempt to print a small component stack
    if (vm && vm.$) {
      // Vue 3 component internal instance
      const type = vm.$.type
      if (type) console.log('🔎 Component type:', type.name || type.__name || type)
    }

    // Show user-friendly error message via store (if available)
    try {
      store.dispatch('showError', "Une erreur inattendue s'est produite. Veuillez actualiser la page.")
    } catch (e) {
      // ignore store errors during error handling
    }
  } catch (e) {
    console.error('Error in global errorHandler:', e)
  }
};
app.mount('#app')
