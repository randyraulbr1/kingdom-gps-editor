import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@main': resolve(__dirname, 'src/main'),
      '@renderer': resolve(__dirname, 'src/renderer/src'),
      '@shared-types': resolve(__dirname, 'src/shared-types')
    }
  },
  test: {
    environment: 'node',
    include: ['src/main/**/*.test.ts', 'src/renderer/**/*.test.ts']
  }
})
