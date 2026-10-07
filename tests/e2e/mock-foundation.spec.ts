import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import type { Nft, Page as CatalogPage } from '../../src/contracts/marketplace'

type MockStatus = { nftCount: number; userCount: number; now: string }

async function api<T = unknown>(page: Page, path: string, body?: unknown) {
  const result = await page.evaluate(async ({ path, body }) => {
    const response = await fetch(`/api${path}`, body === undefined ? undefined : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    return { status: response.status, data: await response.json() }
  }, { path, body })
  return { status: result.status, data: result.data as T }
}

test.beforeEach(async ({ page }) => {
  await page.goto('/__proof')
  await expect(page.getByRole('button', { name: 'Executar prova REST' })).toBeVisible()
  await api(page, '/__mock/reset', { scenarioId: 'SCN-01' })
})

test('MSW catalog respects filters, paging and explicit errors', async ({ page }) => {
  const result = await api<CatalogPage<Nft>>(page, '/nfts?network=ethereum&availableOnly=true&pageSize=2&sort=price-asc')
  expect(result.status).toBe(200)
  expect(result.data.items).toHaveLength(2)
  expect(result.data.total).toBeGreaterThan(2)
  expect(result.data.items[0].network).toBe('ethereum')
  expect((await api<CatalogPage<Nft>>(page, '/nfts?q=absent-collection')).data.items).toEqual([])
  expect((await api(page, '/nfts?pageSize=49')).status).toBe(422)
  expect((await api(page, '/nfts/absent')).status).toBe(404)
})

test('IndexedDB persists the simulation across refresh and reset restores its baseline', async ({ page }) => {
  const initial = await api<MockStatus>(page, '/__mock/status')
  expect(initial.data.nftCount).toBe(36)
  expect(initial.data.userCount).toBe(2)
  await api(page, '/__mock/clock', { advanceMs: 86_400_000 })
  await page.reload()
  await expect(page.getByRole('button', { name: 'Executar prova REST' })).toBeVisible()
  const restored = await api<MockStatus>(page, '/__mock/status')
  expect(restored.data.now).toBe('2026-01-16T12:00:00.000Z')
  await api(page, '/__mock/reset', { scenarioId: 'SCN-01' })
  expect((await api(page, '/__mock/status')).data).toEqual(initial.data)
  expect((await api(page, '/__mock/reset', { scenarioId: 'unknown' })).status).toBe(422)
})
