import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-native': 'react-native-web',
    },
  },
  // 1. Fix for Development Server
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  // 2. Fix for Production Build (VERCEL FIX)
  esbuild: {
    loader: "jsx",
    // This Regex tells Vite: "Check ALL files (.js, .jsx, etc) for JSX code"
    // even if they are in node_modules
    include: /.*\.(js|jsx|ts|tsx)$/, 
    exclude: [], 
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
})