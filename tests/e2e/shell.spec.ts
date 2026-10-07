import { expect, test } from "@playwright/test";

// Smoke da estrutura, não comprova nenhum fluxo REST/socket do desafio.
test("opens shell website, navigates and retrieves routes without runtime error", async ({
  page,
}) => {
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Seja dono do futuro da arte digital" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Explorar", exact: true }).click();
  await expect(page).toHaveURL(/#colecoes$/);
  await page.getByRole("link", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Entrar na Kurio" }),
  ).toBeVisible();
  await page.goto("/rota-inexistente");
  await expect(
    page.getByRole("heading", { name: "Página não encontrada" }),
  ).toBeVisible();
  expect(runtimeErrors).toEqual([]);
});
