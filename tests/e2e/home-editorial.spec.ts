import { expect, test } from "@playwright/test";

test("homepage presents its editorial sections and honest newsletter feedback", async ({
  page,
  isMobile,
}) => {
  await page.goto("/__proof");
  await expect(
    page.getByRole("button", { name: "Executar prova REST" }),
  ).toBeVisible();
  await page.evaluate(async () => {
    const response = await fetch("/api/__mock/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (!response.ok) throw new Error("Reset failed");
  });
  if (isMobile) await page.getByRole("link", { name: "Ir à página inicial" }).click()
  else await page.getByRole("banner").getByRole("link", { name: "Kurio — início" }).click()

  const promotions = page.getByRole("region", { name: "Destaques da Kurio" });
  await expect(promotions.getByRole("article")).toHaveCount(2);
  const journal = page.getByRole("region", { name: "Diário da Cunhagem" });
  await expect(journal.getByRole("article")).toHaveCount(4);

  const spotlight = page.getByRole("region", { name: "NFT em destaque" });
  if (isMobile) await expect(spotlight).toBeHidden();
  else await expect(spotlight.getByRole("link")).toBeVisible();

  const footer = page.getByRole("contentinfo");
  await footer.getByLabel("Seu e-mail").fill("collector@example.test");
  await footer.getByRole("button", { name: "Enviar" }).click();
  await expect(footer.getByRole("status")).toHaveText(
    "Inscrição indisponível nesta demonstração.",
  );
});
