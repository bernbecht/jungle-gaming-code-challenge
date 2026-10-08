import { expect, test } from '@playwright/test'

async function reset(page: import('@playwright/test').Page) {
  await page.goto('/__proof')
  await expect(page.getByRole('button', { name: 'Executar prova REST' })).toBeVisible()
  await page.evaluate(async () => {
    const response = await fetch('/api/__mock/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
    if (!response.ok) throw new Error('Reset failed')
  })
}

async function login(page: import('@playwright/test').Page, email = 'collector-a@example.test') {
  await page.goto('/login')
  await page.getByLabel('E-mail', { exact: true }).fill(email)
  await page.getByLabel('Senha').fill('DemoNft!2026')
  await page.getByRole('main').getByRole('button', { name: 'Entrar', exact: true }).click()
}

test.beforeEach(async ({ page }) => reset(page))

test('protected routes return to their destination after sign-in and session survives refresh', async ({ page }) => {
  await page.goto('/profile')
  await expect(page).toHaveURL(/\/login\?returnTo=%2Fprofile$/)
  await page.getByLabel('E-mail', { exact: true }).fill('collector-a@example.test')
  await page.getByLabel('Senha').fill('DemoNft!2026')
  await page.getByRole('main').getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/profile$/)
  await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible()
})

test('registration creates a session and rejects duplicate accounts', async ({ page }) => {
  await page.goto('/register?returnTo=%2Fprofile')
  await page.getByLabel('Nome de exibição').fill('Nova Pessoa')
  await page.getByLabel('Nome de usuário').fill('nova_pessoa')
  await page.getByLabel('E-mail', { exact: true }).fill('nova@example.test')
  await page.getByLabel('Senha').fill('SenhaNova2026')
  await page.getByRole('button', { name: 'Criar conta' }).click()
  await expect(page).toHaveURL(/\/profile$/)
  await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible()
  await page.getByRole('button', { name: 'Sair' }).click()
  await page.goto('/register?returnTo=%2Fprofile')
  await page.getByLabel('Nome de exibição').fill('Outra Pessoa')
  await page.getByLabel('Nome de usuário').fill('outra_pessoa')
  await page.getByLabel('E-mail', { exact: true }).fill('nova@example.test')
  await page.getByLabel('Senha').fill('SenhaNova2026')
  await page.getByRole('button', { name: 'Criar conta' }).click()
  await expect(page.getByRole('alert')).toContainText('Já existe uma conta')
})

test('favorites update optimistically, roll back on failure and remain isolated by user', async ({ page }) => {
  await login(page)
  await expect(page).toHaveURL(/\/$/)
  await page.goto('/nfts/nft-001')
  const remove = page.getByRole('button', { name: 'Remover Violet Nomad dos favoritos' }).first()
  await expect(remove).toHaveAttribute('aria-pressed', 'true')
  await remove.click()
  const add = page.getByRole('button', { name: 'Favoritar Violet Nomad' }).first()
  await expect(add).toHaveAttribute('aria-pressed', 'false')
  await page.evaluate(async () => {
    const response = await fetch('/api/__mock/favorite-network', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ failuresRemaining: 1 }) })
    if (!response.ok) throw new Error('Network control failed')
  })
  const failedUpdate = page.waitForResponse(response => response.url().endsWith('/api/me/favorites/nft-001') && response.status() === 503)
  await add.click()
  await expect(page.getByRole('button', { name: 'Remover Violet Nomad dos favoritos' }).first()).toHaveAttribute('aria-pressed', 'true')
  await failedUpdate
  await expect(page.getByRole('button', { name: 'Favoritar Violet Nomad' }).first()).toHaveAttribute('aria-pressed', 'false')
  await page.goto('/profile')
  await page.getByRole('button', { name: 'Sair' }).click()
  await login(page, 'collector-b@example.test')
  await page.goto('/nfts/nft-001')
  await expect(page.getByRole('button', { name: 'Favoritar Violet Nomad' }).first()).toHaveAttribute('aria-pressed', 'false')
})
