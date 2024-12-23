import { expect } from "@playwright/test";
import type { Page } from "@playwright/test"
import { parse } from 'node-html-parser';
import { ExpectedBadges, ExcelSLPNode, ProductPage } from "../utils/types";
import { excelRow } from "../utils/excelRow";

const getBadges = async (snapshot: string): Promise<{ topLeft?: string, topRight?: string, bottomLeft?: string, bottomRight?: string, pageNotFound: boolean }> => {
  return new Promise(resolve => {
      const htmlRoot = parse(snapshot);
  
      const badgeTexts = {
          topLeft: htmlRoot.querySelector(".productFullDetail-badgeContainer-oXF.productFullDetail-topLeft-Zcj")?.text ?? "",
          topRight: htmlRoot.querySelector(".productFullDetail-badgeContainer-oXF.productFullDetail-topRight-omq")?.text ?? "",
          bottomLeft: htmlRoot.querySelector(".productFullDetail-badgeContainer-oXF.productFullDetail-bottomLeft-hzc")?.text ?? "",
          bottomRight: htmlRoot.querySelector(".productFullDetail-badgeContainer-oXF.productFullDetail-bottomRight-4Z-")?.text ?? ""
      }

      const pageNotFound = htmlRoot.querySelector(".errorView-root-hPb");
  
      const badges = {
          pageNotFound: !!pageNotFound
      };
  
      for (const [key, value] of Object.entries(badgeTexts)) {
          if (value) {
              badges[key] = value;
          }
      };
      
      resolve(badges);
  })
}

export const testBadges = async ({
    testTarget,
    skus,
    page,
    excelSLP,
    expectedBadges = {},
    offlineProductPages
}:{
    testTarget: string;
    skus: string[];
    page?: Page;
    excelSLP?: ExcelSLPNode[];
    useSLPasRegularPrice?: boolean;
    expectedBadges?: ExpectedBadges;
    offlineProductPages: ProductPage[];
}) => {
    console.log(`BADGES: ${skus.length} products to be tested in "${testTarget}"`);
    const result: string[][] = [];

    const shouldHaveBadge = !!(expectedBadges?.topRight || expectedBadges?.topLeft || expectedBadges?.bottomRight || expectedBadges?.bottomLeft);

    if (offlineProductPages) {
      offlineProductPages.map(async (offlinePage, i) => {
        const snapshot = offlinePage.snapshot;

        const badgeErrors: { [key: string]: {
          received?: string,
          expected?: string,
        }}[] = [];

        const { topLeft, topRight, bottomLeft, bottomRight, pageNotFound } = await getBadges(snapshot);
        const { topLeft: expectedTopLeft, topRight: expectedTopRight, bottomLeft: expectedBottomLeft, bottomRight: expectedBottomRight } = expectedBadges;


        if (!snapshot || pageNotFound) {
          return result.push(excelRow({ message: "NO PDP", refs: skus, i }));
        }

        if (shouldHaveBadge) {
          if (expectedTopLeft && topLeft !== expectedTopLeft) badgeErrors.push({ "topLeft": { received: topLeft, expected: expectedTopLeft } });
          if (expectedTopRight && topRight !== expectedTopRight) badgeErrors.push({ "topRight": { received: topRight, expected: expectedTopRight } });
          if (expectedBottomLeft && bottomLeft !== expectedBottomLeft) badgeErrors.push({ "bottomLeft": { received: expectedBottomLeft, expected: bottomLeft } });
          if (expectedBottomRight && bottomRight !== expectedBottomRight) badgeErrors.push({ "bottomRight": { received: bottomRight, expected: expectedBottomRight } });

          if (badgeErrors.length) {
            result.push(excelRow({ message: `ERROR;${JSON.stringify(badgeErrors)}`, refs: skus, i }));
          } else {
            result.push(excelRow({ message: "OK", refs: skus, i }));
          }
        } else {
          // We only check topRight atm because this is the badge that contains the sale badge
          if (topRight && topRight.length) {
            result.push(excelRow({ message: `ERROR`, refs: skus, i }));
          } else if (!topRight) {
            result.push(excelRow({ message: "OK", refs: skus, i }));
          }
        }
      });
    } else if (page) {
      for (let i = 0; i < skus.length; i++) {
        await page.goto(`https://www.brothers.se/search.html?query=${skus[i]}`);
        const searchHitOnProduct = await page.locator(".voyadoPrimaryList-primaryProducts-F0X > .voyadoProduct-container--qK").count();
    
        if (searchHitOnProduct > 0) {
          await page.locator("section > div > .voyadoProduct-container--qK").first().click();

          const outOfStockProduct = await page.getByText("Denna vara är förnärvarande slutsåld. Prova gärna igen senare.").isVisible();
          await expect.soft(page.locator(".productFullDetail-root-vAQ")).toBeAttached();
          await page.locator(".productFullDetail-root-vAQ").focus({ timeout: 2100 });
          const productPageFound = await page.locator(".productFullDetail-root-vAQ").count() > 0;

          if (productPageFound && outOfStockProduct === false) {
            if (shouldHaveBadge) {
              if (expectedBadges.topRight) {
                const badgeTopRightText = await page.locator(".productFullDetail-topRight-omq > div").allTextContents();
                if (badgeTopRightText.length === 1 && badgeTopRightText[0] === expectedBadges.topRight) {
                  result.push(excelRow({ message: `OK`, refs: skus, excelSLP, i }));
                } else {
                  result.push(excelRow({ message: `ERROR;badge text "${badgeTopRightText}" do not match expected text`, refs: skus, excelSLP, i }));
                }
                await expect.soft(badgeTopRightText[0] ?? "").toBe(expectedBadges.topRight);
              }
            } else {
              const topRightBadge = await page.locator(".productFullDetail-topRight-omq > div").allTextContents();
              expect.soft(topRightBadge).toHaveLength(0);
              
              if (topRightBadge.length !== 0) {
                result.push(excelRow({ message: "ERROR;top right badge still visible", refs: skus, excelSLP, i }));
              } else {
                result.push(excelRow({ message: "OK;no top right badge", refs: skus, excelSLP, i }));
              }
            }
          } else {
            if (!productPageFound) {
              result.push(excelRow({ message: "ERROR;404 product page not found", refs: skus, excelSLP, i }));
            } else if (outOfStockProduct) {
              result.push(excelRow({ message: "ERROR;product out of stock", refs: skus, excelSLP, i }));
            } else {
              result.push(excelRow({ message: "ERROR;unknown error", refs: skus, excelSLP, i }));
            }
          }
        } else {
          result.push(excelRow({ message: 'INFO;no search result (not in voyado)', refs: skus, excelSLP, i }));
        }
    }
    }

    return { result, label: "badges" };
}