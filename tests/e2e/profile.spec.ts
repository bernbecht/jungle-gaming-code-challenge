import { expect, test } from '@playwright/test'

async function resetAndLogin(page: import('@playwright/test').Page) {
  await page.goto('/__proof')
  await expect(page.getByRole('button', { name: 'Executar prova REST' })).toBeVisible()
  await page.evaluate(async () => {
    const reset = await fetch('/api/__mock/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
    if (!reset.ok) throw new Error('Reset failed')
  })
  await page.goto('/login')
  await page.getByLabel(/^E-mail/).fill('collector-a@example.test')
  await page.getByLabel(/^Senha/).fill('DemoNft!2026')
  await page.getByRole('main').getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect.poll(() => new URL(page.url()).pathname).toBe('/')
}

test.beforeEach(async ({ page }) => resetAndLogin(page))

test('profile fields save through the API and persist after refresh', async ({ page, isMobile }) => {
  await page.goto('/profile')
  const displayName = page.getByLabel(/^Nome de exibição/)
  const username = page.getByLabel(/^Nome de usuário/)
  const email = page.getByLabel(/^E-mail/)
  const ensName = page.getByLabel('Nome ENS')
  await expect(displayName).toHaveValue('Collector A')
  await expect(username).toHaveValue('collector-a')

  await displayName.fill('Colecionadora A')
  await username.fill('colecionadora_a')
  await email.fill('a-colecionadora@example.test')
  await ensName.fill('colecionadora.eth')
  const saveResponsePromise = page.waitForResponse(response =>
    response.url().endsWith('/api/profile') && response.request().method() === 'PATCH',
  )
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  const saveResponse = await saveResponsePromise
  expect(saveResponse.ok()).toBeTruthy()
  expect((await saveResponse.json()).ensName).toBe('colecionadora.eth')
  await expect(page.getByRole('status').filter({ hasText: 'Perfil atualizado.' })).toBeVisible()
  if (isMobile) {
    const accountNavigation = page.getByRole('navigation', { name: 'Navegação da conta' })
    await expect(accountNavigation.getByRole('link', { name: 'Dados do perfil' })).toHaveAttribute('aria-current', 'page')
    await expect(accountNavigation.getByRole('link', { name: 'Carteiras' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible()
  }
  else await expect(page.getByRole('banner').getByRole('link', { name: 'Colecionadora A' })).toBeVisible()

  await page.reload()
  await expect(page.getByLabel(/^Nome de exibição/)).toHaveValue('Colecionadora A')
  await expect(page.getByLabel(/^Nome de usuário/)).toHaveValue('colecionadora_a')
  await expect(page.getByLabel(/^E-mail/)).toHaveValue('a-colecionadora@example.test')
  await expect(page.getByLabel('Nome ENS')).toHaveValue('colecionadora.eth')
})

test('profile rejects a duplicate email and shows the API field error without saving', async ({ page }) => {
  await page.goto('/profile')
  await page.getByLabel(/^E-mail/).fill('collector-b@example.test')
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()

  await expect(page.getByRole('alert')).toContainText('Já existe uma conta com esse e-mail ou nome de usuário.')
  await expect(page.getByText('Este e-mail já está em uso.')).toBeVisible()
  await expect(page.getByLabel(/^Nome de exibição/)).toHaveValue('Collector A')
  await page.reload()
  await expect(page.getByLabel(/^E-mail/)).toHaveValue('collector-a@example.test')
})

test('avatar upload validates files, persists after refresh and can be removed', async ({ page }) => {
  await page.goto('/profile')
  const fileInput = page.getByLabel('Arquivo do avatar')
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jXioAAAAASUVORK5CYII=', 'base64')
  const uploadResponsePromise = page.waitForResponse(response => response.url().endsWith('/api/profile/avatar') && response.request().method() === 'PUT')
  await fileInput.setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: png })
  const uploadResponse = await uploadResponsePromise
  expect(uploadResponse.status()).toBe(200)
  await expect(page.getByRole('img', { name: 'Avatar do perfil' })).toHaveAttribute('src', /^data:image\/png;base64,/)
  const savedAvatar = await page.getByRole('img', { name: 'Avatar do perfil' }).getAttribute('src')

  const invalidResponsePromise = page.waitForResponse(response => response.url().endsWith('/api/profile/avatar') && response.request().method() === 'PUT')
  await fileInput.setInputFiles({ name: 'avatar.txt', mimeType: 'text/plain', buffer: Buffer.from('not an image') })
  const invalidResponse = await invalidResponsePromise
  expect(invalidResponse.status()).toBe(422)
  await expect(page.getByRole('alert')).toContainText('Use uma imagem PNG, JPG ou WebP.')
  await expect(page.getByRole('img', { name: 'Avatar do perfil' })).toHaveAttribute('src', savedAvatar!)

  await page.reload()
  await expect(page.getByRole('img', { name: 'Avatar do perfil' })).toHaveAttribute('src', savedAvatar!)
  const removeResponsePromise = page.waitForResponse(response => response.url().endsWith('/api/profile/avatar') && response.request().method() === 'DELETE')
  await page.getByRole('button', { name: 'Remover', exact: true }).click()
  expect((await removeResponsePromise).status()).toBe(200)
  await expect(page.getByRole('img', { name: 'Avatar do perfil' })).toHaveCount(0)
  await page.reload()
  await expect(page.getByRole('button', { name: 'Remover', exact: true })).toHaveCount(0)
})

test('avatar upload rejects files larger than 2 MB without changing the profile', async ({ page }) => {
  await page.goto('/profile')
  const responsePromise = page.waitForResponse(item => item.url().endsWith('/api/profile/avatar') && item.request().method() === 'PUT')
  await page.getByLabel('Arquivo do avatar').setInputFiles({
    name: 'large.png', mimeType: 'image/png', buffer: Buffer.alloc(2 * 1024 * 1024 + 1),
  })
  const response = await responsePromise
  expect(response.status()).toBe(422)
  await expect(page.getByRole('alert')).toContainText('A imagem deve ter até 2 MB.')
  await expect(page.getByRole('img', { name: 'Avatar do perfil' })).toHaveCount(0)
})

test('password change validates current and matching passwords, then invalidates the old password', async ({ page }) => {
  await page.goto('/profile')
  const passwordInputs = [
    page.getByRole('textbox', { name: 'Senha atual', exact: true }),
    page.getByRole('textbox', { name: 'Nova senha', exact: true }),
    page.getByRole('textbox', { name: 'Confirmar nova senha', exact: true }),
  ]
  for (const input of passwordInputs) {
    const passwordToggle = input.locator('..').getByRole('button')
    await expect(input).toHaveAttribute('type', 'password')
    await expect(passwordToggle).toHaveAccessibleName('Mostrar senha')
    await passwordToggle.click()
    await expect(input).toHaveAttribute('type', 'text')
    await expect(passwordToggle).toHaveAccessibleName('Ocultar senha')
    await passwordToggle.click()
    await expect(input).toHaveAttribute('type', 'password')
  }
  await passwordInputs[0]!.fill('senha-incorreta')
  await passwordInputs[1]!.fill('NovaSenha!2026')
  await passwordInputs[2]!.fill('NovaSenha!2026')
  const wrongPasswordResponsePromise = page.waitForResponse(response => response.url().endsWith('/api/profile/password') && response.request().method() === 'PUT')
  await page.getByRole('button', { name: 'Alterar senha' }).click()
  const wrongPasswordResponse = await wrongPasswordResponsePromise
  expect(wrongPasswordResponse.status()).toBe(422)
  await expect(page.getByText('Confira sua senha atual.')).toBeVisible()

  await passwordInputs[0]!.fill('DemoNft!2026')
  await passwordInputs[2]!.fill('OutraSenha!2026')
  await page.getByRole('button', { name: 'Alterar senha' }).click()
  await expect(page.getByText('As senhas novas não coincidem.')).toBeVisible()

  await passwordInputs[2]!.fill('NovaSenha!2026')
  const changeResponsePromise = page.waitForResponse(response => response.url().endsWith('/api/profile/password') && response.request().method() === 'PUT')
  await page.getByRole('button', { name: 'Alterar senha' }).click()
  expect((await changeResponsePromise).status()).toBe(204)
  await expect(page.getByRole('status').filter({ hasText: 'Senha atualizada.' })).toBeVisible()

  const credentialResults = await page.evaluate(async () => {
    async function authenticate(password: string) {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'collector-a@example.test', password }),
      })
      return response.status
    }
    return {
      oldPassword: await authenticate('DemoNft!2026'),
      newPassword: await authenticate('NovaSenha!2026'),
    }
  })
  expect(credentialResults).toEqual({ oldPassword: 401, newPassword: 200 })
})
