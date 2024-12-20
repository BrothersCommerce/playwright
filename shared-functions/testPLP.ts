import { expect } from "@playwright/test";
import type { ElementHandle, Page } from "@playwright/test"
import { ProductPage, ExcelSLPNode } from "../utils/types";
import { excelRow } from "../utils/excelRow";
import { parse } from 'node-html-parser';

export const testPLP = async ({
    testTarget,
    skus,
    page,
    excelSLP,
    mitigatedErrors,
}:{
    testTarget: string;
    skus: string[];
    page: Page;
    excelSLP?: ExcelSLPNode[];
    mitigatedErrors?: {
        sku: string;
        message: string;
    }[];
}): Promise<{ label: string, result: string[][], offlineData: ProductPage[] }> => {
    return new Promise(async (resolve) => {
        console.log(`PLP: ${skus.length} products to be tested in "${testTarget}"`);
        const result: string[][] = [];
        const offlineData: ProductPage[] = [];
        const uniqueSKUs: string[] = [];
    
        for (let i = 0; i < skus.length; i++) {
            const sku = skus[i];
            const mitigatedInfo = mitigatedErrors?.find(mitigatedError => mitigatedError.sku === sku);
            const skuIsDuplicate = uniqueSKUs.includes(sku);

            uniqueSKUs.push(sku);

            await page.goto(`https://www.brothers.se/search.html?query=${sku}`);
            await expect(page).toHaveURL(`https://www.brothers.se/search.html?query=${sku}`);

            await page.evaluate(() => {
                const stupidBotContainer: HTMLDivElement | null  = document.querySelector("#imbox-container");
                const stupidCookieConsentContainer: HTMLDivElement | null = document.querySelector("#CybotCookiebotDialog");
                if (stupidBotContainer) {
                    stupidBotContainer.remove();
                }
    
                if (stupidCookieConsentContainer) {
                    stupidCookieConsentContainer.remove();
                }
                });

            const getSearchHitOnProduct = await page.locator(".voyadoPrimaryList-primaryProducts-F0X > .voyadoProduct-container--qK").all();

            const multiSearchHits = getSearchHitOnProduct.length > 1;
            const skuStartsWithLetter = sku.trim().split("")[0].match(/[a-z,A-Z]/);
            if (multiSearchHits) {
                offlineData.push({ url: '', snapshot: '', sku, plpPriceBlocks: [] });
                result.push(excelRow({ message: `RNB?;Search hits on SKU = ${getSearchHitOnProduct.length}, should be = 1.`, refs: skus, excelSLP, i }));
            } else if (skuStartsWithLetter) {
                offlineData.push({ url: '', snapshot: '', sku, plpPriceBlocks: [] });
                result.push(excelRow({ message: `RNB?;SKU in unexpected format: ${sku}`, refs: skus, excelSLP, i }));
            } else {
                await expect.soft(page.locator(".voyadoPrimaryList-primaryProducts-F0X")).toBeAttached();
                const searchHitOnProduct = await page.locator(".voyadoPrimaryList-primaryProducts-F0X > .voyadoProduct-container--qK").first();
            
                if (await searchHitOnProduct.isVisible({ timeout: 6000 })) {
    
                    const searchContainer = await page.$(".voyadoPrimaryList-primarySection-US2");
                    const snapshotPLP = parse(await (searchContainer as ElementHandle<HTMLElement>).innerHTML());
                    const getPriceBlocks = [...snapshotPLP.querySelectorAll(".useVoyadoPrice-container-tvP > p")];
                    const plpPriceBlocks = getPriceBlocks.map(b => b.textContent).map(priceBlock => priceBlock.replace("kr", "")).map(price => +price) ?? 0;
    
                    await page.locator("section > div > .voyadoProduct-container--qK").first().click();
    
                    // const mainContainer = page.locator(".main-page-hXb");
                    const productPage404 = await page.locator(".errorView-root-hPb");
                    const productPage = await page.locator(".productFullDetail-root-vAQ");
                    const magentoExplosion = await page.locator(".main-root_masked-vjm");
                    const outOutOfStockPage = await page.getByText("Denna vara är förnärvarande slutsåld. Prova gärna igen senare.");
    
                    await expect.soft(productPage404.or(magentoExplosion).or(outOutOfStockPage).or(productPage), `${sku}`).toBeVisible();
        
                    if (await magentoExplosion.isVisible()) {
                        const magentoExplosionContainer = await page.$('.main-root_masked-vjm');
                        const magentoExplotionPage = await (magentoExplosionContainer as ElementHandle<HTMLElement>).innerHTML();
                        const productUrl = await page.url();
                        offlineData.push({ url: productUrl, snapshot: magentoExplotionPage, plpPriceBlocks, sku });
                        result.push(excelRow({ message: "MAGENTO EXPLOSION!;The Frontend application exploded. This is NOT good.", refs: skus, excelSLP, i }));
                    } else if (await productPage404.isVisible()) {
                        const productcontainer = await page.$('.main-page-hXb');
                        const productPage = await (productcontainer as ElementHandle<HTMLElement>).innerHTML();
                        const productUrl = await page.url();
                        offlineData.push({ url: productUrl, snapshot: productPage, plpPriceBlocks, sku });
                        result.push(excelRow({ message: "INFO;URL is broken (responded with 404)", refs: skus, excelSLP, i }));
                    } else if (await productPage.isVisible()) {
                        await expect.soft(page.locator('.productFullDetail-title-B8d')).toBeVisible();
                        await page.locator(".productFullDetail-root-vAQ").focus();
                        await page.locator(".productFullDetail-badges-6-4").isVisible({ timeout: 1000 });
                        const productcontainer = await page.$('.main-page-hXb');
                        const productPage = await (productcontainer as ElementHandle<HTMLElement>).innerHTML();
                        const productUrl = await page.url();
    
                        if (skuIsDuplicate) {
                                const duplicateIndex = skus.findIndex((s: string) => s === sku);
                                offlineData.push({ url: productUrl, snapshot: productPage, plpPriceBlocks, sku });
                                result.push(excelRow({ message: `DUPLICATE;duplicate on row: ${duplicateIndex + 1}`, refs: skus, excelSLP, i }));
                        } else {
                            offlineData.push({ url: productUrl, snapshot: productPage, plpPriceBlocks, sku });
                            result.push(excelRow({ message: "OK", refs: skus, excelSLP, i }));
                        }
                    } else {
                        const outOutOfStockPage = await page.locator("h1").textContent() === "Denna vara är förnärvarande slutsåld. Prova gärna igen senare.";
                        if (outOutOfStockPage) {
                            offlineData.push({ url: '', snapshot: '', plpPriceBlocks, sku });
                            result.push(excelRow({ message: 'OUT OF STOCK', refs: skus, excelSLP, i }));
                        } else if (mitigatedErrors && mitigatedInfo) {
                            offlineData.push({ url: '', snapshot: '', plpPriceBlocks, sku });
                            result.push(excelRow({ message:  `_error_;${mitigatedInfo.message}`, refs: skus, excelSLP, i }));
                        } else {
                                console.log('uncaught error in SLP for SKU: ', sku);
                                offlineData.push({ url: '', snapshot: '', plpPriceBlocks, sku });
                                result.push(excelRow({ message: 'ERROR', refs: skus, excelSLP, i }));
                        }
                    }
                } else {
                    if (mitigatedErrors && mitigatedInfo) {
                        offlineData.push({ url: '', snapshot: '', sku, plpPriceBlocks: [] });
                        result.push(excelRow({ message: `_error_;${mitigatedInfo.message}`, refs: skus, excelSLP, i }));
                    } else {
                        offlineData.push({ url: '', snapshot: '', sku, plpPriceBlocks: [] });
                        result.push(excelRow({ message: 'ERROR', refs: skus, excelSLP, i }));
                    }
                }

            }
        }

        resolve({ result, offlineData, label: 'PLP' });
    });
}