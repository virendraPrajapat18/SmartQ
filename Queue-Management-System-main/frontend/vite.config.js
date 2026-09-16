import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://127.0.0.1:5001',
        ws: true,
        configure: (proxy, options) => {
          // Suppress common WebSocket errors in development terminal
          proxy.on('error', (err, req, res) => {
            if (err.code === 'ECONNRESET') return;
            console.error('[vite ws proxy error]', err.message);
          });
          proxy.on('proxyReqWs', (proxyReq, req, socket, options, head) => {
            socket.on('error', (err) => {
              if (err.code === 'ECONNRESET') return;
            });
          });
        }
      }
    }
  }
})
