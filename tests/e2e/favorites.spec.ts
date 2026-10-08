import { expect, test, type Page } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/__proof')
  await expect(page.getByRole('button', { name: 'Executar prova REST' })).toBeVisible()
  await page.evaluate(async () => {
    const response = await fetch('/api/__mock/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
    if (!response.ok) throw new Error('Reset failed')
  })
})

async function signIn(page: Page, email = 'collector-a@example.test') {
  await page.getByLabel(/^E-mail/).fill(email)
  await page.getByLabel(/^Senha/).fill('DemoNft!2026')
  await page.getByRole('main').getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Meus favoritos' })).toBeVisible()
}

test('navigation requires sign-in, returns to favorites and opens the NFT detail', async ({ page, isMobile }, testInfo) => {
  await page.goto('/')
  const navigation = isMobile ? page.getByRole('navigation', { name: 'Navegação mobile' }) : page.getByRole('banner')
  await navigation.getByRole('link', { name: 'Favoritos', exact: true }).click()
  await expect(page).toHaveURL(/\/login\?returnTo=%2Ffavorites$/)
  await signIn(page)
  await expect(page.getByRole('link', { name: 'Ver Violet Nomad' })).toBeVisible()
  if (isMobile) {
    await expect(navigation).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Voltar ao início' })).toBeVisible()
  } else {
    await expect(navigation.getByRole('link', { name: 'Favoritos', exact: true })).toHaveAttribute('aria-current', 'page')
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
  await page.screenshot({ path: testInfo.outputPath('favorites.png') })
  if (!isMobile) {
    await page.setViewportSize({ width: 768, height: 1024 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
    await page.screenshot({ path: testInfo.outputPath('favorites-tablet.png') })
  }
  await page.reload()
  await expect(page.getByRole('link', { name: 'Ver Violet Nomad' })).toBeVisible()
  await page.getByRole('link', { name: 'Ver Violet Nomad' }).click()
  await expect(page).toHaveURL(/\/nfts\/nft-001$/)
})

test('failed removal restores the card; retry persists the empty list', async ({ page }) => {
  await page.goto('/favorites')
  await signIn(page)
  await page.evaluate(async () => {
    const response = await fetch('/api/__mock/favorite-network', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ failuresRemaining: 1, delayMs: 800 }) })
    if (!response.ok) throw new Error('Network control failed')
  })
  const failed = page.waitForResponse(response => response.url().endsWith('/api/me/favorites/nft-001') && response.status() === 503)
  await page.getByRole('button', { name: 'Remover Violet Nomad dos favoritos' }).click()
  await expect(page.getByRole('heading', { name: 'Você ainda não tem favoritos' })).toBeVisible()
  await failed
  await expect(page.getByRole('alert')).toContainText('Sua lista foi restaurada')
  const remove = page.getByRole('button', { name: 'Remover Violet Nomad dos favoritos' })
  await expect(remove).toBeEnabled()
  const saved = page.waitForResponse(response => response.url().endsWith('/api/me/favorites/nft-001') && response.ok())
  await remove.click()
  await saved
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Você ainda não tem favoritos' })).toBeVisible()
  await page.getByRole('link', { name: 'Descobrir NFTs' }).click()
  await expect(page).toHaveURL(/#colecoes$/)
})

test('favorites added on detail appear in the list and another account has its own list', async ({ page }) => {
  await page.goto('/favorites')
  await signIn(page)
  await page.goto('/nfts/nft-003')
  const favorite = page.getByRole('button', { name: /^Favoritar / }).first()
  const saved = page.waitForResponse(response => response.url().endsWith('/api/me/favorites/nft-003') && response.ok())
  await favorite.click()
  await saved
  await page.goto('/favorites')
  await expect(page.getByTestId('favorites-grid').getByRole('article')).toHaveCount(2)
  await page.goto('/profile')
  await page.getByRole('button', { name: 'Sair' }).click()
  await expect.poll(() => new URL(page.url()).pathname).toBe('/')
  await page.goto('/favorites')
  await signIn(page, 'collector-b@example.test')
  await expect(page.getByTestId('favorites-grid').getByRole('article')).toHaveCount(1)
  await expect(page.getByRole('link', { name: 'Ver Violet Nomad' })).toHaveCount(0)
})
