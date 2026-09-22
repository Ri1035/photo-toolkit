/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // jSquash / gifsicle / imgly 均为 WASM 包，预打包会导致 WASM URL 解析失败，必须排除
    exclude: [
      '@jsquash/jpeg',
      '@jsquash/png',
      '@jsquash/webp',
      '@jsquash/avif',
      '@jsquash/oxipng',
      '@jsquash/resize',
      'gifsicle-wasm-browser',
      '@imgly/background-removal',
      'onnxruntime-web',
    ],
  },
  worker: { format: 'es' },
  build: { target: 'es2022' },
  test: {
    environment: 'node',
    include: ['src/test/**/*.spec.ts'],
    setupFiles: ['src/test/setup.ts'],
  },
})
