import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const API_SERVER = 'http://localhost:3005'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // the server builds email links from FRONTEND_URL, so the port must not drift
    port: 5179,
    strictPort: true,
    // one address for the browser: the login cookie needs no cross-site setup
    proxy: {
      '/api': API_SERVER,
    },
  },
})
