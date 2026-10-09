import { expect, test, type Page } from '@playwright/test'

const now = '2026-01-15T12:00:00.000Z'

test.use({ locale: 'pt-BR', timezoneId: 'America/Sao_Paulo', reducedMotion: 'reduce' })

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date(now))
  await page.goto('/__proof')
  await expect(page.getByRole('button', { name: 'Executar prova REST' })).toBeVisible()
  await page.evaluate(async fixedTime => {
    const response = await fetch('/api/__mock/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioId: 'SCN-01', seed: 1, now: fixedTime }),
    })
    if (!response.ok) throw new Error(`Visual scenario reset failed: ${response.status}`)
  }, now)
})

async function capture(page: Page, name: string) {
  await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0)
  // Full-page captures include lazy images below the viewport. Load and decode
  // them without changing layout or hiding any application content.
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all(Array.from(document.images, async image => {
      image.loading = 'eager'
      await image.decode()
      if (!image.naturalWidth) throw new Error(`Image did not load: ${image.src}`)
    }))
  })
  await page.mouse.move(0, 0)
  await expect(page).toHaveScreenshot(name, {
    fullPage: true,
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixels: 0,
  })
}

async function populateCart(page: Page) {
  await page.goto('/login')
  await page.getByLabel(/^E-mail/).fill('collector-a@example.test')
  await page.getByLabel(/^Senha/).fill('DemoNft!2026')
  await page.getByRole('main').getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/$|\/\?.*/)
  await page.goto('/nfts/nft-001')
  await page.getByRole('button', { name: /^Comprar(?: NFT)?$/ }).click()
  await expect(page).toHaveURL(/\/cart$/)
  await expect(page.getByRole('link', { name: 'Ver Violet Nomad', exact: true })).toBeVisible()
}

test('home @visual', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('region', { name: 'Destaques da Kurio' }).getByRole('article')).toHaveCount(2)
  await expect(page.getByRole('region', { name: 'Diário da Cunhagem' }).getByRole('article')).toHaveCount(4)
  await capture(page, 'home.png')
})

test('NFT detail @visual', async ({ page }) => {
  await page.goto('/nfts/nft-001')
  await expect(page.getByRole('heading', { name: 'Violet Nomad', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Comprar(?: NFT)?$/ })).toBeEnabled()
  await capture(page, 'nft-detail.png')
})

test('populated cart @visual', async ({ page }) => {
  await populateCart(page)
  await expect(page.getByRole('link', { name: /^Finalizar Ethereum/ })).toBeVisible()
  await capture(page, 'cart.png')
})

test('checkout @visual', async ({ page, isMobile }) => {
  await populateCart(page)
  await page.getByRole('link', { name: /^Finalizar Ethereum/ }).click()
  await expect(page.getByRole('heading', { name: isMobile ? 'Pagamento com carteira' : 'Pagamento', exact: true })).toBeVisible()
  await expect(page.getByLabel(/^E-mail/)).toHaveValue('collector-a@example.test')
  await capture(page, 'checkout.png')
  if (isMobile) await page.getByRole('button', { name: 'Continuar', exact: true }).click()
  await page.getByRole('button', { name: 'Revisar compra' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'cotação atualizada' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeEnabled()
  await capture(page, 'checkout-review.png')
})
