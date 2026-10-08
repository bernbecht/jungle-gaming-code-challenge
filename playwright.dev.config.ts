import { defineConfig } from '@playwright/test'
import base from './playwright.config'

// Exercise initial route loading with React Strict Mode enabled by Vite dev.

export default defineConfig({
  ...base,
  outputDir: 'artifacts/playwright-development',
  reporter: [['list']],
  use: { ...base.use, baseURL: 'http://127.0.0.1:4175' },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4175 --strictPort',
    url: 'http://127.0.0.1:4175',
    reuseExistingServer: false,
  },
})
