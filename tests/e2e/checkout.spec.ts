import { expect, test, type Page } from '@playwright/test'

async function reset(page: Page) {
  await page.goto('/__proof')
  await expect(page.getByRole('button', { name: 'Executar prova REST' })).toBeVisible()
  await page.evaluate(async () => {
    const response = await fetch('/api/__mock/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
    if (!response.ok) throw new Error('Reset failed')
  })
}

async function loginAndAddItem(page: Page) {
  await page.goto('/login')
  await page.getByLabel(/^E-mail/).fill('collector-a@example.test')
  await page.getByLabel(/^Senha/).fill('DemoNft!2026')
  await page.getByRole('main').getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/$|\/\?.*/) // AuthForm redirects to the market after the login and cart merge finish.
  await page.goto('/nfts/nft-001')
  await page.getByRole('button', { name: /^Comprar(?: NFT)?$/ }).click()
  await expect(page).toHaveURL(/\/cart$/)
  await page.getByRole('link', { name: /^Finalizar Ethereum/ }).click()
  await expect(page.getByRole('heading', { name: 'Pagamento', exact: true }).or(page.getByRole('heading', { name: 'Pagamento com carteira' }))).toBeVisible()
}

test.beforeEach(async ({ page }) => reset(page))

test('checkout connects a saved wallet and shows a confirmed order receipt', async ({ page, isMobile }) => {
  await loginAndAddItem(page)
  if (isMobile) await expect(page.getByRole('banner')).toBeHidden()
  else await expect(page.getByRole('banner')).toBeVisible()
  if (isMobile) await expect(page.getByRole('contentinfo')).toBeHidden()
  else await expect(page.getByRole('contentinfo')).toBeVisible()
  const reviewPurchase = page.getByRole('button', { name: 'Revisar compra' })

  if (isMobile) {
    await page.getByRole('button', { name: 'Continuar', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Carteiras cadastradas' })).toBeVisible()
    await expect(reviewPurchase).toHaveCSS('position', 'static')
  } else {
    await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
    await expect(reviewPurchase).toBeVisible()
    await expect(reviewPurchase).toBeEnabled()
  }
  await reviewPurchase.click()
  await expect(page.getByRole('status').filter({ hasText: 'cotação atualizada' })).toBeVisible()
  await expect(page.getByRole('heading', { name: isMobile ? 'Revisão da compra' : 'Seus NFTs' })).toBeVisible()
  if (isMobile) {
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
    const viewport = page.viewportSize()
    if (viewport && viewport.width > 320) {
      await page.setViewportSize({ width: 320, height: viewport.height })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
      await page.setViewportSize(viewport)
    }
  }
  const confirmPurchase = page.getByRole('button', { name: 'Confirmar compra' })
  await expect(confirmPurchase).toBeEnabled()
  if (isMobile) await expect(confirmPurchase).toHaveCSS('position', 'static')
  const orderResponse = page.waitForResponse(response => response.url().endsWith('/api/orders') && response.request().method() === 'POST')
  await confirmPurchase.click()
  const response = await orderResponse
  expect(response.status()).toBe(201)
  const order = await response.json()
  expect(order.id).toEqual(expect.any(String))
  expect(order.id).not.toBe('')
  await expect(page).toHaveURL(new RegExp(`/orders/${order.id}$`))
  await expect(page.getByRole('heading', { name: 'Aguardando confirmação do pagamento' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible({ timeout: 10_000 })
  await expect(page.getByText('ID da transação')).toBeVisible()
  const transactionId = page.getByRole('definition').filter({ hasText: `simulated-${order.id}` })
  await expect(transactionId).toHaveText(`simulated-${order.id}`)
  await expect(page.getByRole('button', { name: 'Ver no Etherscan' })).toBeDisabled()
  await expect(page.getByText('Seu pedido foi confirmado na simulação.')).toHaveCount(0)
  await expect(page.getByText('não corresponde a uma transação em blockchain')).toBeVisible()
})

test('declined payment keeps the items in the cart and does not show a receipt', async ({ page }) => {
  await page.evaluate(async () => {
    const response = await fetch('/api/__mock/payment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ outcome: 'declined', delayMs: 0 }) })
    if (!response.ok) throw new Error('Payment scenario setup failed')
  })
  await loginAndAddItem(page)
  const reviewPurchase = page.getByRole('button', { name: 'Revisar compra' })
  if (await page.getByRole('button', { name: 'Continuar', exact: true }).isVisible().catch(() => false))
    await page.getByRole('button', { name: 'Continuar', exact: true }).click()
  await reviewPurchase.click()
  await expect(page.getByRole('status').filter({ hasText: 'cotação atualizada' })).toBeVisible()
  const confirmPurchase = page.getByRole('button', { name: 'Confirmar compra' })
  await confirmPurchase.click()
  await expect(page.getByRole('heading', { name: 'Pagamento não confirmado' })).toBeVisible({ timeout: 10_000 })
  await expect(page.getByRole('link', { name: 'Voltar ao carrinho' })).toBeVisible()
  await page.getByRole('link', { name: 'Voltar ao carrinho' }).click()
  const cartItems = page.getByRole('region', { name: 'Carrinho de NFTs' }).getByRole('list')
  await expect(cartItems.getByRole('link', { name: 'Ver Violet Nomad', exact: true })).toBeVisible()
})

test('checkout reconciles a missed cart change after the socket reconnects and requires a fresh review', async ({ page, isMobile }) => {
  await loginAndAddItem(page)
  if (isMobile) await page.getByRole('button', { name: 'Continuar', exact: true }).click()
  await page.getByRole('button', { name: 'Revisar compra' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'cotação atualizada' })).toBeVisible()

  const couponResponse = await page.evaluate(async () => {
    const token = sessionStorage.getItem('kurio-session-token')
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    const cartResponse = await fetch('/api/cart', { headers })
    const cart = await cartResponse.json()
    const response = await fetch('/api/cart/coupon', { method: 'PUT', headers, body: JSON.stringify({ code: 'NFT10', expectedVersion: cart.version }) })
    return { status: response.status, body: await response.json() }
  })
  expect(couponResponse.status).toBe(200)

  await page.context().setOffline(true)
  await expect.poll(() => page.evaluate(() => navigator.onLine)).toBe(false)
  // Let Socket.IO detect the dropped transport and enter its retry cycle
  // before restoring connectivity.
  await page.waitForTimeout(2_500)
  await page.context().setOffline(false)

  await expect(page.getByRole('status').filter({ hasText: 'A cotação mudou enquanto a conexão estava instável' })).toBeVisible({ timeout: 20_000 })
  await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeEnabled()
  await expect(page.getByRole('region', { name: 'Seus NFTs' }).getByText('Cupom NFT10 aplicado', { exact: true })).toBeVisible()
})

test('mixed-network cart finalizes one network and preserves the other group', async ({ page, isMobile }) => {
  await page.goto('/login')
  await page.getByLabel(/^E-mail/).fill('collector-a@example.test')
  await page.getByLabel(/^Senha/).fill('DemoNft!2026')
  await page.getByRole('main').getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/$|\/\?.*/)

  for (const nftId of ['nft-001', 'nft-002']) {
    await page.goto(`/nfts/${nftId}`)
    await page.getByRole('button', { name: /^Comprar(?: NFT)?$/ }).click()
    await expect(page).toHaveURL(/\/cart$/)
  }

  await page.goto('/cart')
  await expect(page.getByRole('heading', { name: 'NFTs na rede Ethereum (1)' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'NFTs na rede Polygon (1)' })).toBeVisible()
  await page.getByRole('link', { name: 'Finalizar Polygon (1)' }).click()
  await expect(page).toHaveURL(/\/checkout\?network=polygon$/)
  if (isMobile) await page.getByRole('button', { name: 'Continuar', exact: true }).click()

  const reviewPurchase = page.getByRole('button', { name: 'Revisar compra' })
  await reviewPurchase.click()
  await expect(page.getByRole('status').filter({ hasText: 'cotação atualizada' })).toBeVisible()
  const confirmPurchase = page.getByRole('button', { name: 'Confirmar compra' })
  const checkout = page.getByRole('main')
  await expect(checkout).toContainText('Ivory Baron')
  await expect(checkout).not.toContainText('Violet Nomad')
  await confirmPurchase.click()
  await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible({ timeout: 10_000 })

  await page.goto('/cart')
  const cartItems = page.getByRole('region', { name: 'Carrinho de NFTs' }).getByRole('list')
  await expect(cartItems.getByRole('link', { name: 'Ver Violet Nomad', exact: true })).toBeVisible()
  await expect(cartItems.getByRole('link', { name: 'Ver Ivory Baron', exact: true })).toHaveCount(0)
})
