import { expect, test } from '@playwright/test'

async function resetAndLogin(page: import('@playwright/test').Page) {
  await page.goto('/__proof')
  await page.evaluate(async () => {
    const reset = await fetch('/api/__mock/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
    if (!reset.ok) throw new Error('Reset failed')
  })
  await page.goto('/login')
  await page.getByLabel('E-mail', { exact: true }).fill('collector-a@example.test')
  await page.getByLabel('Senha', { exact: true }).fill('DemoNft!2026')
  await page.getByRole('main').getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect.poll(() => new URL(page.url()).pathname).toBe('/')
}

test.beforeEach(async ({ page }) => resetAndLogin(page))

test('profile fields save through the API and persist after refresh', async ({ page, isMobile }) => {
  await page.goto('/profile')
  const displayName = page.getByLabel('Nome de exibição')
  const username = page.getByLabel('Nome de usuário')
  const email = page.getByLabel('E-mail', { exact: true })
  const ensName = page.getByLabel('Nome ENS')
  await expect(displayName).toHaveValue('Collector A')
  await expect(username).toHaveValue('collector-a')

  await displayName.fill('Colecionadora A')
  await username.fill('colecionadora_a')
  await email.fill('a-colecionadora@example.test')
  await ensName.fill('colecionadora.eth')
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Perfil atualizado.' })).toBeVisible()
  if (isMobile) {
    const accountNavigation = page.getByRole('navigation', { name: 'Navegação da conta' })
    await expect(accountNavigation.getByRole('link', { name: 'Dados do perfil' })).toHaveAttribute('aria-current', 'page')
    await expect(accountNavigation.getByRole('link', { name: 'Carteiras' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible()
  }
  else await expect(page.getByRole('banner').getByRole('link', { name: 'Colecionadora A' })).toBeVisible()

  await page.reload()
  await expect(page.getByLabel('Nome de exibição')).toHaveValue('Colecionadora A')
  await expect(page.getByLabel('Nome de usuário')).toHaveValue('colecionadora_a')
  await expect(page.getByLabel('E-mail', { exact: true })).toHaveValue('a-colecionadora@example.test')
  await expect(page.getByLabel('Nome ENS')).toHaveValue('colecionadora.eth')
  const savedProfile = await page.evaluate(async () => (await fetch('/api/profile')).json())
  expect(savedProfile.ensName).toBe('colecionadora.eth')
})

test('profile rejects a duplicate email and shows the API field error without saving', async ({ page }) => {
  await page.goto('/profile')
  await page.getByLabel('E-mail', { exact: true }).fill('collector-b@example.test')
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()

  await expect(page.getByRole('alert')).toContainText('Já existe uma conta com esse e-mail ou nome de usuário.')
  await expect(page.getByText('Este e-mail já está em uso.')).toBeVisible()
  await expect(page.getByLabel('Nome de exibição')).toHaveValue('Collector A')
  await page.reload()
  await expect(page.getByLabel('E-mail', { exact: true })).toHaveValue('collector-a@example.test')
})
