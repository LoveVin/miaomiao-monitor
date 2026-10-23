import { createMonitor } from '@miaomiao/monitor-vue'
import { createApp } from 'vue'

import App from './App.vue'

createApp(App).use(createMonitor({ dsn: 'http://localhost:3000/api/tracing/vue5oJrl6' })).mount('#app')
