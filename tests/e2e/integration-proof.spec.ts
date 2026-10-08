import { expect, test } from '@playwright/test'

test('intercepts an Axios REST request through the MSW worker', async ({ page }) => {
  await page.goto('/__proof')
  await page.getByRole('button', { name: 'Executar prova REST' }).click()
  await expect(page.getByTestId('rest-proof-result')).toContainText('axios → msw · SCN-01')
})

test('delivers a mocked event to the Socket.IO client through MSW', async ({ page }) => {
  await page.goto('/__proof')
  await page.getByRole('button', { name: 'Executar prova Socket.IO' }).click()
  await expect(page.getByTestId('socket-proof-result')).toContainText('socket.io → msw')
})

test('evaluation reset restores the default scenario and clears browser session and attempts', async ({ page }) => {
  await page.goto('/__proof')
  await page.evaluate(() => {
    sessionStorage.setItem('kurio-session-token', 'expired-demo-token')
    localStorage.setItem('kurio-guest-id', 'guest-demo-0001')
    localStorage.setItem('kurio-order-attempt:user-a', JSON.stringify({ key: 'attempt-demo', input: {} }))
  })

  await page.getByRole('button', { name: 'Resetar demonstração' }).click()
  await expect.poll(() => new URL(page.url()).pathname).toBe('/')
  await expect(page.getByRole('button', { name: 'Abrir busca de NFTs' })).toBeVisible()
  const browserState = await page.evaluate(() => ({
    token: sessionStorage.getItem('kurio-session-token'),
    guestId: localStorage.getItem('kurio-guest-id'),
    attempts: Object.keys(localStorage).filter(key => key.startsWith('kurio-order-attempt:')),
  }))
  expect(browserState.token).toBeNull()
  expect(browserState.guestId).toMatch(/^[0-9a-f-]{36}$/i)
  expect(browserState.guestId).not.toBe('guest-demo-0001')
  expect(browserState.attempts).toEqual([])

  const resetStatus = await page.evaluate(async () => {
    const response = await fetch('/api/__mock/status')
    return response.json() as Promise<{ scenarioId: string; now: string; nftCount: number }>
  })
  expect(resetStatus).toMatchObject({ scenarioId: 'SCN-01', now: '2026-01-15T12:00:00.000Z', nftCount: 36 })
})
