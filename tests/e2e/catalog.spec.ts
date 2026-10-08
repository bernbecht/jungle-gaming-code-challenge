import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

async function searchNfts(page: Page, query: string) {
  await page.getByRole("button", { name: "Abrir busca de NFTs" }).click();
  const dialog = page.getByRole("dialog", { name: "Buscar NFTs", exact: true });
  await dialog.getByRole("searchbox", { name: "Buscar NFTs" }).fill(query);
  await dialog.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Abrir busca de NFTs" }),
  ).toBeFocused();
}

async function goHomeWithoutReload(page: Page) {
  await page.getByRole("link", { name: "Kurio — início" }).click();
  await expect(page).toHaveURL(/\/$|\/?\?.*/);
}

async function readSearchString(page: Page, key: string) {
  return page.evaluate((searchKey) => {
    const value = new URL(window.location.href).searchParams.get(searchKey);
    if (value === null) return null;
    try {
      return JSON.parse(value) as string;
    } catch {
      return value;
    }
  }, key);
}

test.beforeEach(async ({ page }) => {
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
});
test("catalog combines filters, sorts, paginates and restores URL history", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  await expect(
    page.getByTestId("catalog-grid").getByRole("article"),
  ).toHaveCount(12);
  const pagination = page.getByRole("navigation", {
    name: "Paginação",
    exact: true,
  });
  await expect(
    pagination.getByRole("button", { name: "Página 1", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await pagination
    .getByRole("button", { name: "Próxima página", exact: true })
    .click();
  await expect(
    pagination.getByRole("button", { name: "Página 2", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await pagination
    .getByRole("button", { name: "Página 3", exact: true })
    .click();
  await expect(
    pagination.getByRole("button", { name: "Página 3", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(
    pagination.getByRole("button", { name: "Próxima página", exact: true }),
  ).toHaveCount(0);
  await pagination
    .getByRole("button", { name: "Página anterior", exact: true })
    .click();
  await expect(
    pagination.getByRole("button", { name: "Página 2", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await searchNfts(page, "Violet");
  await expect(
    page.getByTestId("catalog-grid").getByRole("article"),
  ).toHaveCount(9);
  if (isMobile)
    await page
      .getByRole("button", { name: "Abrir filtros do catálogo", exact: true })
      .click();
  const filters = isMobile
    ? page.getByRole("dialog")
    : page.getByRole("complementary", { name: "Filtros do catálogo" });
  await filters.getByRole("button", { name: "Ethereum", exact: true }).click();
  await filters
    .getByRole("button", { name: "Fotografia", exact: true })
    .click();
  await filters
    .getByRole("button", { name: "Generativa", exact: true })
    .click();
  await expect(
    filters.getByRole("button", { name: "Ethereum", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    filters.getByRole("button", { name: "Fotografia", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  if (isMobile)
    await filters.getByRole("button", { name: "Ver resultados" }).click();
  if (isMobile) {
    // Sorting is intentionally absent from the mobile mockup; cover its URL contract directly.
    const url = new URL(page.url());
    url.searchParams.set("sort", "price-desc");
    await page.goto(url.toString());
  } else {
    await page.getByLabel("Ordenar por").selectOption("price-desc");
  }
  await expect(
    page.getByTestId("catalog-grid").getByRole("article"),
  ).toHaveCount(2);
  await expect(
    page.getByTestId("catalog-grid").getByRole("heading").first(),
  ).toHaveText("Violet Nomad #25");
  const filteredUrl = page.url();
  await page.reload();
  await expect(
    page.getByTestId("catalog-grid").getByRole("article"),
  ).toHaveCount(2);
  await searchNfts(page, "not-a-real-artwork");
  await expect(
    page.getByRole("heading", { name: "Nenhum NFT encontrado" }),
  ).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(filteredUrl);
  await page.getByRole("button", { name: "Abrir busca de NFTs" }).click();
  await expect(page.getByRole("searchbox")).toHaveValue("Violet");
  await page.keyboard.press("Escape");
  await expect(
    page.getByTestId("catalog-grid").getByRole("article"),
  ).toHaveCount(2);
});
test("direct detail supports gallery, editions, quantity limits and missing NFT", async ({
  page,
  isMobile,
}) => {
  await page.goto("/nfts/nft-001");
  await expect(
    page.getByRole("heading", { name: "Violet Nomad", exact: true }),
  ).toBeVisible();
  if (!isMobile) {
    await page
      .getByRole("button", { name: "Ver imagem 2", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Ver imagem 2" }),
    ).toHaveAttribute("aria-pressed", "true");
  }
  await page.getByText("1/1", { exact: true }).click();
  await expect(
    page.getByRole("radio", { name: "1/1", exact: true }),
  ).toBeChecked();
  await expect(
    page.getByRole("button", { name: "Aumentar quantidade" }),
  ).toBeDisabled();
  await page.getByText("1/10", { exact: true }).click();
  await expect(
    page.getByRole("radio", { name: "1/10", exact: true }),
  ).toBeChecked();
  for (let i = 1; i < 10; i++)
    await page.getByRole("button", { name: "Aumentar quantidade" }).click();
  await expect(
    page.locator('output[aria-label="Quantidade selecionada"]:visible'),
  ).toHaveText("10");
  await expect(
    page.getByRole("button", { name: "Aumentar quantidade" }),
  ).toBeDisabled();
  await page.goto("/nfts/nft-007");
  await expect(
    page.getByRole("button", { name: "Aumentar quantidade" }),
  ).toBeDisabled();
  await page.goto("/nfts/missing");
  await expect(
    page.getByRole("heading", { name: "NFT não encontrado" }),
  ).toBeVisible();
});
test("invalid URL values use safe defaults and mobile drawer restores focus", async ({
  page,
  isMobile,
}) => {
  await page.goto("/?page=-1&sort=bad&minPrice=garbage&network=bad");
  await expect(
    page.getByTestId("catalog-grid").getByRole("article"),
  ).toHaveCount(12);
  await expect(
    page
      .getByRole("navigation", { name: "Paginação", exact: true })
      .getByRole("button", { name: "Página 1", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  if (isMobile) {
    const trigger = page.getByRole("button", {
      name: "Abrir filtros do catálogo",
      exact: true,
    });
    await trigger.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(trigger).toBeFocused();
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("slow catalog shows skeleton and obsolete response cannot replace a newer search", async ({
  page,
}) => {
  await page.evaluate(() =>
    fetch("/api/__mock/catalog-network", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delayMs: 1500 }),
    }),
  );
  await goHomeWithoutReload(page);
  await expect(
    page.getByRole("status", { name: "Carregando NFTs" }),
  ).toBeVisible();
  await page.evaluate(() =>
    fetch("/api/__mock/catalog-network", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    }),
  );
  await searchNfts(page, "Ivory");
  await expect(
    page.getByTestId("catalog-grid").getByRole("article"),
  ).toHaveCount(9);
  await expect(
    page.getByTestId("catalog-grid").getByRole("heading").first(),
  ).toHaveText("Ivory Baron");
  // Wait until the delayed MSW response would have arrived, then check visible results.
  await page.waitForTimeout(1700);
  await expect(
    page.getByTestId("catalog-grid").getByRole("heading").first(),
  ).toHaveText("Ivory Baron");
});
test("catalog displays API failure and recovers after explicit retry", async ({
  page,
}) => {
  await page.evaluate(() =>
    fetch("/api/__mock/catalog-network", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ failuresRemaining: 2 }),
    }),
  );
  await goHomeWithoutReload(page);
  await expect(page.getByRole("alert")).toContainText(
    "Não foi possível carregar os NFTs.",
  );
  await page
    .getByRole("button", { name: "Tentar novamente", exact: true })
    .click();
  await expect(
    page.getByTestId("catalog-grid").getByRole("article"),
  ).toHaveCount(12);
});

test("price slider applies only on submit and restores exact bounds after refresh", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  await expect(
    page.getByTestId("catalog-grid").getByRole("article"),
  ).toHaveCount(12);
  if (isMobile)
    await page
      .getByRole("button", { name: "Abrir filtros do catálogo", exact: true })
      .click();
  const filters = isMobile
    ? page.getByRole("dialog")
    : page.getByRole("complementary", { name: "Filtros do catálogo" });
  const minimum = filters.getByRole("slider", {
    name: "Preço mínimo",
    exact: true,
  });
  const maximum = filters.getByRole("slider", {
    name: "Preço máximo",
    exact: true,
  });
  await minimum.focus();
  await page.keyboard.press("ArrowRight");
  expect(new URL(page.url()).searchParams.has("minPrice")).toBe(false);
  const minValue = (await minimum.getAttribute("aria-valuetext"))!.replace(
    " ETH",
    "",
  );
  const maxValue = (await maximum.getAttribute("aria-valuetext"))!.replace(
    " ETH",
    "",
  );
  await filters.getByRole("button", { name: "Aplicar", exact: true }).click();
  await expect.poll(() => readSearchString(page, "minPrice")).toBe(minValue);
  await expect.poll(() => readSearchString(page, "maxPrice")).toBe(maxValue);
  await page.reload();
  if (isMobile)
    await page
      .getByRole("button", { name: "Abrir filtros do catálogo", exact: true })
      .click();
  await expect(minimum).toHaveAttribute("aria-valuetext", `${minValue} ETH`);
  await expect(maximum).toHaveAttribute("aria-valuetext", `${maxValue} ETH`);
});
