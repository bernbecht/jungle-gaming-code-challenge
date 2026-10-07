import { defineConfig } from '@playwright/test'

// Pure domain tests use Playwright's runner without a browser or HTTP server.
export default defineConfig({ testDir: './tests/unit', retries: 0, reporter: 'list', fullyParallel: true })
