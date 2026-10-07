function readBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback
  if (value === 'true') return true
  if (value === 'false') return false
  throw new Error('VITE_MOCKS_ENABLED deve ser true ou false.')
}

export const env = Object.freeze({
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  mocksEnabled: readBoolean(import.meta.env.VITE_MOCKS_ENABLED, true),
  mockScenario: import.meta.env.VITE_MOCK_SCENARIO || 'SCN-01',
})
