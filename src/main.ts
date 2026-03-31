import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'
import Cookies from 'js-cookie';

import App from './App.vue'
import router from './router'
import { createI18n } from 'vue-i18n'
import { de } from './i18n/de'

const app = createApp(App)
const pinia = createPinia()
pinia.use(createPersistedState({
  key: (storeKey) => `persisted_${storeKey}`,
  storage: {
    getItem(key) {
      return Cookies.get(key) || null;
    },
    setItem(key, value) {
      Cookies.set(key, value);
    }
  }
}))

const i18n = createI18n({
  missingWarn: false,
  fallbackWarn: false,
  legacy: false,
  fallbackLocale: 'en',
  messages: {
    en: {
      'employees-selected': 'You have queued to upload {count} employees',
      'employees-duplicates':
        '{count} of them already exist in the project. Their details will be updated.',
      'validation-heading': 'Upload not possible – mandatory fields are missing',
      Row: 'Row',
    },
    de,
  },
})

app.use(pinia)
app.use(router)
app.use(i18n)

app.mount('#app')
