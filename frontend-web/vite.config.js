import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Cho phép truy cập từ môi trường bên ngoài container
    port: 5173,
    allowedHosts: [
      'host.docker.internal',
      'localhost'
    ]
  },
  // Khắc phục lỗi "Uncaught ReferenceError: global is not defined" khi dùng sockjs-client
  define: {
    global: 'window',
  }
})