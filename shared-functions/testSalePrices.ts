import { Prices } from "../utils/types";
import { parse } from 'node-html-parser';
import { ProductPage, ExcelSLPNode } from "../utils/types";
import { excelRow } from "../utils/excelRow";

const getPrices = async (snapshot: string): Promise<Prices> => {
    return new Promise(resolve => {
      const root = parse(snapshot);
    
      const productWithSalePrices = [...root.querySelectorAll(".brProductPrice-tab-wBq > div")].length > 1;
    
       if (productWithSalePrices) {
        const discountNode = root.querySelector(".brProductPrice-percentageDiv-58j > span")?.text.replace(/[-,%,kr, ]/g, "") ?? "-1";
        const saleNode = root.querySelector(".brProductPrice-finalPrice-IqD")?.text.replace(/[-,%,kr, ]/g, "") ?? "-1";
        const regularNode = root.querySelector(".brProductPrice-regularPrice-r2Z")?.text.replace(/[-,%,kr, ]/g, "") ?? "-1";
        const slpNode = root.querySelector(".brProductPrice-priceStrike-zK8")?.text.replace(/[-,%,kr, ]/g, "") ?? "-1";
    
        resolve({
          sale: +saleNode,
          slp: +slpNode,
          regular: +regularNode,
          discount: +discountNode,
        });
       };
  
       const regularNode = root.querySelector(".brProductPrice-tab-wBq > div")?.text.replace(/[kr, ]/g, "") ?? "-1";
       
       resolve({
          regular: +regularNode
        });
    });
  }

export const testSalePrices = async ({
    offlineProductPages,
    skus,
    testTarget,
    expectedPrices,
    excelSLP,
}: {
    offlineProductPages: ProductPage[],
    skus: string[],
    testTarget: string,
    expectedPrices?: {
        sale?: number;
        slp?: number;
        regular?: number;
        discount?: number;
    };
    excelSLP?: ExcelSLPNode[],
}) => {
    console.log(`SALE PRICES: ${skus.length} products to be tested in "${testTarget}"`);
    const result: string[][] = [];

    if (offlineProductPages && excelSLP) {
        offlineProductPages.map(async (productPage, i) => {
            const snapshot = productPage.snapshot;
            const prices = await getPrices(snapshot);
            const expectedPrices = excelSLP[i].prices;
            const correctPrices = JSON.stringify(prices) === JSON.stringify(expectedPrices);

            const discount = prices.discount;
            const regular = prices.regular;
            const sale = prices.sale;
            const slp = prices.slp;

            const expectedDiscount = expectedPrices.discount;
            const expectedRegular = expectedPrices.regular;
            const expectedSale = expectedPrices.sale;
            const expectedSlp = expectedPrices.slp;

            const priceErrors: {
                [key: string]: {
                    expected: number;
                    received?: number;
                }}[] = [];

            if (discount !== expectedDiscount) priceErrors.push({ "discount": { received: discount, expected: expectedDiscount }});
            if (regular !== expectedRegular) priceErrors.push({ "regular": { received: regular, expected: expectedRegular }});
            if (sale !== expectedSale) priceErrors.push({ "sale": { received: sale, expected: expectedSale }});
            if (slp !== expectedSlp) priceErrors.push({ "slp": { received: slp, expected: expectedSlp }});

            if (!productPage.snapshot) {
                result.push(excelRow({message: `NO PDP`, refs: skus, i, excelSLP }));
            } else if (priceErrors.length === 0) {
                result.push(excelRow({ message: "OK", refs: skus, i, excelSLP }));
            } else {
                result.push(excelRow({message: `ERROR;${JSON.stringify(priceErrors)}`, refs: skus, i, excelSLP }));
            }

        });
    } else if (offlineProductPages) {
        offlineProductPages.map(async (productPage, i) => {
            const snapshot = productPage.snapshot;
            const prices = await getPrices(snapshot);

            const discount = prices.discount;
            const regular = prices.regular;
            const sale = prices.sale ?? regular;
            const slp = prices.slp;

            const priceBlocks = {
                discount,
                regular,
                sale,
                slp
            };

            // const expectedRegular = expectedPrices.regular;
            const expectedSale = productPage.plpPriceBlocks[0];
            const expectedSlp = offlineProductPages[i].slp ?? -1;
            const expectedDiscount = Math.round(1 - (expectedSale/expectedSlp));

            const priceErrors: {
                [key: string]: {
                    expected: number;
                    received?: number;
                }}[] = [];

            if (expectedDiscount && discount !== expectedDiscount) priceErrors.push({ "discount": { received: discount, expected: expectedDiscount }});
            // if (expectedPrices?.regular && regular !== expectedPrices.regular) priceErrors.push({ "regular": { received: regular, expected: expectedPrices.regular }});
            if (expectedSale && sale !== expectedSale) priceErrors.push({ "sale": { received: sale, expected: expectedSale }});
            if (expectedSlp && slp !== expectedSlp) priceErrors.push({ "slp": { received: slp, expected: expectedSlp }});

            const productOnSale = Object.entries(prices).length === 4;
            if (!productPage.snapshot) {
                result.push(excelRow({message: `NO PDP`, refs: skus, i, excelSLP }));
            } else if (expectedSlp < sale) {
                result.push(excelRow({message: `SLP <= SALE`, refs: skus, i, excelSLP }));
            } else if (!productOnSale) {
                result.push(excelRow({message: `ERROR;Missing one or more price blocks`, refs: skus, i, excelSLP }));
            } else if (productOnSale && priceErrors.length) {
                result.push(excelRow({message: `ERROR;${JSON.stringify(priceErrors)}`, refs: skus, i, excelSLP }));
            } else {
                result.push(excelRow({message: `OK`, refs: skus, i, excelSLP }));
            }

        });
    } else {
        // TODO: setup test to use actuall URLs for the products
    }

    return {
        result,
        label: "prices"
    };
};