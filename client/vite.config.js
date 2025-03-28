import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import eslint from 'vite-plugin-eslint';
import path from 'path'

// https://vite.dev/config/

export default defineConfig({
  plugins: [react(), tailwindcss(), eslint()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  esbuild: {
    loader: 'jsx', // Ensures ESBuild recognizes JSX in .jsx files
    include: /src\/.*\.[tj]sx?$/, // Applies to both .js and .jsx files in src folder
  },
  server: {
    port: 5173, // Match the port allowed in your backend CORS config
    open: true,
    proxy: {
      // If needed, you can set up a proxy for API requests
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})


