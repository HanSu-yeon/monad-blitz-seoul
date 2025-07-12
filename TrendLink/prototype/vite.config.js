import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    alias: {
      '@widget': path.resolve(__dirname, '../widget'),
      '@': path.resolve(__dirname, '.')
    }
  },
  optimizeDeps: {
    include: ['@web3auth/modal', '@web3auth/base', '@web3auth/ethereum-provider']
  }
})
