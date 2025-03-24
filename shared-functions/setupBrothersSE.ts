import { Page } from "@playwright/test";

let page: Page;

export const setupBrothersSE = async (browser) => {
  page = await browser.newPage();
  await page.goto("https://www.brothers.se/");

  await page.locator("footer line").nth(1).click();
  await page
    .locator("#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll")
    .click();

  await page.evaluate(() => {
    const stupidBotContainer: HTMLDivElement | null =
      document.querySelector("#imbox-container");
    if (stupidBotContainer) {
      stupidBotContainer.style.visibility = "hidden";
    }
  });

  return page;
};
