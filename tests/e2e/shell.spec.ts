import { expect, test } from "@playwright/test";

// Smoke da estrutura, não comprova nenhum fluxo REST/socket do desafio.
test("opens shell website, navigates and retrieves routes without runtime error", async ({
  page,
  isMobile,
}) => {
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  await page.goto("/");
  if (isMobile) await expect(page.getByRole("banner")).toBeHidden();
  else await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: isMobile
        ? "Seja dono da cultura digital"
        : "Seja dono do futuro da arte digital",
    }),
  ).toBeVisible();
  const hero = page.getByRole("region", {
    name: isMobile
      ? "Seja dono da cultura digital"
      : "Seja dono do futuro da arte digital",
  });
  await hero.getByRole("link", { name: "Explorar", exact: true }).click();
  await expect(page).toHaveURL(/#colecoes$/);
  if (isMobile) {
    // The desktop header is intentionally hidden on the mobile homepage.
    await page.goto("/login");
  } else {
    await page.getByRole("link", { name: "Entrar", exact: true }).click();
    const authDialog = page.getByRole("dialog", { name: "Entrar na Kurio" });
    await expect(authDialog).toBeVisible();
    await authDialog.getByRole("button", { name: "Fechar janela de autenticação" }).click();
    await page.goto("/login");
  }
  await expect(page).toHaveURL(/\/login$/);
  if (isMobile) await expect(page.getByRole("banner")).toBeHidden();
  else await expect(page.getByRole("banner")).toBeVisible();
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
