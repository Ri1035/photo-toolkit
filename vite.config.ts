/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as { version: string }

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 版本号唯一来源：package.json，构建期注入，避免打包整个 JSON
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
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
