// plugins/vuetify.js
import '@mdi/font/css/materialdesignicons.css' // Ensure you are using css-loader
import { createVuetify } from 'vuetify'
import type { ThemeDefinition } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import { fa } from 'vuetify/iconsets/fa'

const nonEncryptedTheme: ThemeDefinition = {
  dark: true,
  colors: {
    fhenix: "#7686D7",
    background: '#FFFFFF',
    surface: '#FFFFFF',
    primary: "#7686D7",
    'primary-darken-1': '#3700B3',
    secondary: '#03DAC6',
    'secondary-darken-1': '#018786',
    error: '#B00020',
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#FB8C00',
    'button-text-color': "#FFFFFF"
  },
}

const encryptedTheme: ThemeDefinition = {
  dark: true,
  colors: {
    fhenix: "#E79A4D",
    background: '#FFFFFF',
    surface: '#FFFFFF',
    primary: "#E79A4D",
    'primary-darken-1': '#3700B3',
    secondary: '#03DAC6',
    'secondary-darken-1': '#018786',
    error: '#B00020',
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#FB8C00',
    'button-text-color': "#FFFFFF"
  },
}

export default defineNuxtPlugin(nuxtApp => {
  const vuetify = createVuetify({
    components: { ...components },
    directives,
    theme: {
      defaultTheme: 'nonEncryptedTheme',
      themes: {
        nonEncryptedTheme,
        encryptedTheme
      },
    },
      icons: {
      defaultSet: 'mdi',
      aliases,
      sets: {
        fa,
        mdi,
      },
    }
  })

  nuxtApp.vueApp.use(vuetify)
})
