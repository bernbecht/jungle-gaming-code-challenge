import { expect, test } from '@playwright/test'

async function resetAndLogin(page: import('@playwright/test').Page, email = 'collector-a@example.test') {
  await page.goto('/__proof')
  await expect(page.getByRole('button', { name: 'Executar prova REST' })).toBeVisible()
  const reset = await page.evaluate(async () => {
    const response = await fetch('/api/__mock/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenarioId: 'SCN-01' }) })
    return { ok: response.ok, status: response.status, body: await response.text() }
  })
  if (!reset.ok) throw new Error(`Mock reset failed (${reset.status}): ${reset.body}`)
  await page.goto('/login')
  await page.getByLabel(/^E-mail/).fill(email)
  await page.getByLabel(/^Senha/).fill('DemoNft!2026')
  await page.getByRole('main').getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect.poll(() => new URL(page.url()).pathname).toBe('/')
}

test.beforeEach(async ({ page }) => resetAndLogin(page))

test('wallet address follows its selected network and invalid values are rejected by the API', async ({ page }) => {
  await page.goto('/wallets')
  const address = page.getByLabel('Endereço da carteira').nth(1)
  await page.getByLabel('Rede').nth(1).selectOption('solana')
  await address.fill('not-a-solana-address')
  const invalidResponsePromise = page.waitForResponse(response => response.url().endsWith('/api/wallets/wallet-a-reserve') && response.request().method() === 'PATCH')
  await page.getByRole('button', { name: 'Salvar carteira' }).nth(1).click()
  const invalidResponse = await invalidResponsePromise
  expect(invalidResponse.status()).toBe(422)
  await expect(page.getByText('Informe um endereço Solana válido.')).toBeVisible()
  await expect(page.getByLabel('Endereço da carteira').nth(1)).toHaveValue('not-a-solana-address')
})

test('edited wallet persists and its address is used by checkout', async ({ page }) => {
  await page.goto('/wallets')
  const address = '1'.repeat(32)
  await page.getByLabel('Rede').nth(1).selectOption('solana')
  await page.getByLabel('Endereço da carteira').nth(1).fill(address)
  const responsePromise = page.waitForResponse(response => response.url().endsWith('/api/wallets/wallet-a-reserve') && response.request().method() === 'PATCH')
  await page.getByRole('button', { name: 'Salvar carteira' }).nth(1).click()
  expect((await responsePromise).ok()).toBeTruthy()
  await page.reload()
  await expect(page.getByLabel('Endereço da carteira').nth(1)).toHaveValue(address)
  const addToCart = await page.evaluate(async () => {
    const token = sessionStorage.getItem('kurio-session-token')
    const response = await fetch('/api/cart/items', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ nftId: 'nft-003', editionId: 'nft-003-limited', quantity: 1, expectedVersion: 1 }) })
    return response.ok
  })
  expect(addToCart).toBeTruthy()
  await page.goto('/checkout?network=solana')
  await expect(page.getByLabel('Endereço da carteira')).toHaveValue(address)
})

test('a user without a secondary wallet can create one and keep the primary separate', async ({ page }) => {
  await page.goto('/profile')
  await page.getByRole('button', { name: 'Sair' }).click()
  await resetAndLogin(page, 'collector-b@example.test')
  await page.goto('/wallets')
  await expect(page.getByRole('heading', { name: 'Carteira secundária' })).toBeVisible()
  await page.getByLabel('Nome do perfil').nth(1).fill('Reserva B')
  await page.getByLabel('Rede').nth(1).selectOption('polygon')
  await page.getByLabel('Endereço da carteira').nth(1).fill(`0x${'d'.repeat(40)}`)
  const responsePromise = page.waitForResponse(response => response.url().endsWith('/api/wallets') && response.request().method() === 'POST')
  await page.getByRole('button', { name: 'Salvar carteira' }).nth(1).click()
  expect((await responsePromise).status()).toBe(201)
  await expect(page.getByRole('status').filter({ hasText: 'Carteira salva.' })).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('Endereço da carteira').nth(0)).toHaveValue(`0x${'c'.repeat(40)}`)
  await expect(page.getByLabel('Endereço da carteira').nth(1)).toHaveValue(`0x${'d'.repeat(40)}`)
})
