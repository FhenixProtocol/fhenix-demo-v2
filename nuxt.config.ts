// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      ENC_ERC20_CONTRACT: process.env.NUXT_ENV_ENC_ERC20_CONTRACT || "0x2CCb455a574763740e34Ec489b2EA043571dDc46",
      NON_ENC_ERC20_CONTRACT: process.env.NUXT_ENV_NON_ENC_ERC20_CONTRACT || "0x2CCb455a574763740e34Ec489b2EA043571dDc46",
      CHAIN_ID: process.env.NUXT_ENV_NETWORK_CHAIN_ID || "8008135",
      RPC_DEFAULT_ENDPOINT: process.env.NUXT_ENV_NETWORK_RPC_URL || "https://api.helium.fhenix.zone",
      BLOCK_EXPLORER: process.env.NUXT_ENV_NETWORK_EXPLORER_URL || "https://explorer.helium.fhenix.zone",
      FAUCET_ENDPOINT: process.env.NUXT_ENV_FAUCET_API || "https://faucet-api.helium.fhenix.zone",
    },
  },
  ssr: false,
  devServer: {
    port: 2222,
  },
  css: ['vuetify/lib/styles/main.sass', 'material-design-icons-iconfont/dist/material-design-icons.css'],
  build: {
    transpile: ['vuetify','globalMixin'],
    
  },
  modules: [
    '@nuxt/ui',
  ],
  app: {
    head: {
      link: [{ rel: 'icon', type: 'image/svg', href: "favicon.svg" }]
    }
  },
})
