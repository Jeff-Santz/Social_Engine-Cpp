import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { i18n } from './i18n'

import './assets/styles/variables.css'
import './assets/styles/base.css'
import './assets/styles/components.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)

// Igual ao original: o app é montado de imediato (síncrono) e o bootstrap
// (traduções, idioma, sessão salva) roda em onMounted do App.vue — preserva
// o mesmo comportamento de "flash" de conteúdo não traduzido no 1º paint.
app.mount('#app')
