import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/__proof')
  await expect(page.getByRole('button', { name: 'Executar prova REST' })).toBeVisible()
  await page.evaluate(async () => {
    const response = await fetch('/api/__mock/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
    if (!response.ok) throw new Error('Reset failed')
  })
})

test('mobile home navigation shows the cart item count', async ({ page, isMobile }) => {
  test.skip(!isMobile)
  await page.goto('/nfts/nft-001')
  await page.getByRole('button', { name: /^Comprar(?: NFT)?$/ }).click()
  await expect(page).toHaveURL(/\/cart$/)
  await page.getByRole('button', { name: 'Aumentar Violet Nomad' }).click()
  await expect(page.getByLabel('Quantidade de Violet Nomad selecionada')).toHaveText('2')
  await page.goto('/')

  const mobileNavigation = page.getByRole('navigation', { name: 'Navegação mobile' })
  const cartLink = mobileNavigation.getByRole('link', { name: 'Carrinho de NFTs, 2 itens' })
  await expect(cartLink.getByText('2', { exact: true })).toBeVisible()
})

test('visitor cart persists, updates quantity and calculates valid coupon totals', async ({ page, isMobile }) => {
  await page.goto('/nfts/nft-001')
  await expect(page.getByRole('heading', { name: 'Violet Nomad', exact: true })).toBeVisible()
  const add = page.getByRole('button', { name: /^Comprar(?: NFT)?$/ })
  await add.click()
  await expect(page).toHaveURL(/\/cart$/)
  if (isMobile) {
    await expect(page.getByRole('heading', { name: 'Carrinho de NFTs' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Voltar ao mercado' })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Caminho da página' })).toBeHidden()
    await expect(page.getByRole('heading', { name: 'Resumo da carteira' })).toHaveClass(/sr-only/)
    await expect(page.getByRole('heading', { name: 'Colecionadores também viram' })).toBeHidden()
    expect(await page.getByRole('complementary').evaluate(element => getComputedStyle(element).position)).toBe('fixed')
  } else {
    await expect(page.getByRole('navigation', { name: 'Caminho da página' })).toContainText('Início / Mercado / Carrinho')
    await expect(page.getByRole('banner').getByRole('link', { name: 'Mercado', exact: true })).toHaveAttribute('aria-current', 'page')
    await expect(page.getByRole('heading', { name: 'Resumo da carteira' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Colecionadores também viram' })).toBeVisible()
  }
  const cartItem = page.getByRole('link', { name: 'Ver Violet Nomad', exact: true })
  await expect(cartItem).toBeVisible()
  await expect(page.getByTestId('cart-item-edition')).toHaveText('Edição: 1/10')
  await page.reload()
  await expect(cartItem).toBeVisible()
  await expect(page.getByTestId('cart-item-edition')).toHaveText('Edição: 1/10')
  await page.getByRole('button', { name: 'Aumentar Violet Nomad' }).click()
  await expect(page.getByLabel('Quantidade de Violet Nomad selecionada')).toHaveText('2')
  await page.getByLabel('Código promocional', { exact: true }).fill('NFT10')
  await page.getByRole('button', { name: 'Aplicar', exact: true }).click()
  await expect(page.getByText('Cupom NFT10')).toBeVisible()
  await expect(page.getByRole('complementary').getByText('0.019 ETH', { exact: true })).toBeVisible()
  const removeItem = page.getByRole('button', { name: 'Remover Violet Nomad' })
  await expect(removeItem).toBeVisible()
  if (isMobile) await expect(removeItem).toContainText('Remover')
  await removeItem.click()
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
})

test('cart query exposes its skeleton during a deterministic delay', async ({ page }) => {
  await page.evaluate(async () => {
    const response = await fetch('/api/__mock/cart-network', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delayMs: 700 }),
    })
    if (!response.ok) throw new Error('Could not configure the cart delay')
    localStorage.removeItem('kurio-guest-id')
  })
  await page.getByRole('link', { name: 'Ir à página inicial' }).click()
  await page.getByRole('link', { name: /Carrinho de NFTs/ }).click()
  await expect(page.getByRole('status', { name: 'Carregando carrinho' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
})

test('cart query recovers from a deterministic network failure after retry', async ({ page }) => {
  await page.evaluate(async () => {
    const response = await fetch('/api/__mock/cart-network', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ failuresRemaining: 5, failureMode: 'network' }),
    })
    if (!response.ok) throw new Error('Could not configure the cart network failure')
    localStorage.removeItem('kurio-guest-id')
  })
  await page.getByRole('link', { name: 'Ir à página inicial' }).click()
  await page.getByRole('link', { name: /Carrinho de NFTs/ }).click()
  await expect(page.getByRole('alert')).toContainText('Não foi possível carregar o carrinho.')

  await page.evaluate(async () => {
    const response = await fetch('/api/__mock/cart-network', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    })
    if (!response.ok) throw new Error('Could not clear the cart network failure')
  })
  await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
})

test('login merges visitor items once and keeps them in the account cart', async ({ page }) => {
  await page.goto('/nfts/nft-001')
  await page.getByRole('button', { name: /^Comprar(?: NFT)?$/ }).click()
  await expect(page).toHaveURL(/\/cart$/)
  await page.goto('/login')
  await page.getByLabel(/^E-mail/).fill('collector-a@example.test')
  await page.getByLabel(/^Senha/).fill('DemoNft!2026')
  const mergeResponsePromise = page.waitForResponse(response => response.url().endsWith('/api/cart/merge'))
  await page.getByRole('main').getByRole('button', { name: 'Entrar', exact: true }).click()
  const mergeResponse = await mergeResponsePromise
  expect(mergeResponse.ok()).toBeTruthy()
  expect((await mergeResponse.json()).items).toHaveLength(1)
  await page.goto('/cart')
  await expect(page.getByRole('link', { name: 'Ver Violet Nomad', exact: true })).toBeVisible()
  await expect(page.getByLabel('Quantidade de Violet Nomad selecionada')).toHaveText('1')
})

test('invalid coupons show an API error without changing cart totals', async ({ page }) => {
  await page.goto('/nfts/nft-001')
  await page.getByRole('button', { name: /^Comprar(?: NFT)?$/ }).click()
  await expect(page).toHaveURL(/\/cart$/)
  const total = page.getByRole('complementary').getByText('0.011 ETH', { exact: true })
  await expect(total).toBeVisible()
  await page.getByLabel('Código promocional', { exact: true }).fill('INVALID')
  await page.getByRole('button', { name: 'Aplicar', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Cupom inválido.')
  await expect(total).toBeVisible()
})
