import { expect, test } from '@playwright/test'

test('every unfinished homepage link opens its named construction page', async ({ page, isMobile }, testInfo) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: isMobile ? 'Seja dono da cultura digital' : 'Seja dono do futuro da arte digital' })).toBeVisible()
  const destinations = await page.locator('a[href^="/em-construcao"]').evaluateAll(links =>
    [...new Set(links.filter(link => link.getClientRects().length > 0).map(link => link.getAttribute('href')!))],
  )
  expect(destinations).toHaveLength(isMobile ? 19 : 20)
  for (const href of destinations) {
    await page.goto('/')
    await page.locator(`a[href=${JSON.stringify(href)}]`).first().click()
    const resource = new URL(href, page.url()).searchParams.get('recurso')!
    await expect(page.getByRole('heading', { name: resource, exact: true, level: 1 })).toBeVisible()
    await expect(page.getByText('Esta página está sendo construída.', { exact: false })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
  }
  await page.screenshot({ path: testInfo.outputPath('construction.png') })
  await page.reload()
  await expect(page.getByText('Esta página está sendo construída.', { exact: false })).toBeVisible()
  await page.getByRole('main').getByRole('link', { name: 'Voltar ao início' }).click()
  await expect.poll(() => new URL(page.url()).pathname).toBe('/')
})

test('unfinished sign-in options close the dialog and open construction', async ({ page, isMobile }) => {
  test.skip(isMobile, 'These options are shown in the desktop dialog.')
  for (const [label, resource] of [
    ['Esqueceu a senha?', 'Recuperação de senha'],
    ['Continuar com Google', 'Login com Google'],
    ['Continuar com Facebook', 'Login com Facebook'],
  ]) {
    await page.goto('/')
    await page.getByRole('banner').getByRole('link', { name: 'Entrar', exact: true }).click()
    await page.getByRole('dialog').getByRole('link', { name: label, exact: true }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.getByRole('heading', { name: resource, exact: true })).toBeVisible()
  }
})

test('construction accepts direct navigation without a resource', async ({ page }) => {
  await page.goto('/em-construcao')
  await expect(page.getByRole('heading', { name: 'Página em construção', exact: true })).toBeVisible()
})
