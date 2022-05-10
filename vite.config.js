/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')
const { defineConfig } = require('vite')

module.exports = defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/assetStore.ts'),
      name: 'AssetStore',
      fileName: format => `assetStore.${format}.js`
    }
  },
  rollupOptions: {
    external: ['three'],
    output: {
      globals: {
        three: 'THREE'
      }
    }
  }
})
