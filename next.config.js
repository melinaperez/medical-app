/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    webpack: (config, { isServer }) => {
      // Solo agregar el service worker en el cliente
      if (!isServer) {
        config.output.webassemblyModuleFilename = "static/wasm/[modulehash].wasm"
      }
      return config
    },
  }
  
  module.exports = nextConfig
  
  