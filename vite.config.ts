import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    global: 'window',
  },
  plugins: [react()],
  resolve: {
    alias: {
      'react-native': 'react-native-web',
    },
    extensions: ['.web.js', '.js', '.ts', '.tsx', '.jsx'],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  // SMART FIX: Sirf .js files ko JSX maano. 
  // .tsx aur .ts files ko Normal rehne do.
  esbuild: {
    loader: "jsx",
    include: /src\/.*\.jsx?$|node_modules\/.*\.js$/, 
    exclude: [],
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
})