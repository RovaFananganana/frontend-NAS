import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

// Import Tailwind
import './assets/main.css'
//Import fontawesome
import '@fortawesome/fontawesome-free/css/all.css'
import '@fortawesome/fontawesome-free/js/all.js'


const app = createApp(App)
app.use(router)
app.use(store)
app.mount('#app')
