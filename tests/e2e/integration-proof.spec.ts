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
