import { ProductPage, ExcelSLPNode } from "../utils/types";
import { excelRow } from "../utils/excelRow";
import { parse } from "node-html-parser";

export const testPDP = async ({
    testTarget,
    excelSLP,
    skus,
    offlineProductPages,
}:{
    testTarget: string;
    skus: string[]; 
    offlineProductPages: ProductPage[];
    excelSLP?: ExcelSLPNode[];
}) => {
    console.log(`PDP: ${skus.length} products to be tested in "${testTarget}"`);
    const result: string[][] = [];

    if (offlineProductPages) {
        offlineProductPages.map(async (productPage, i) => {
            // console.log({ productPageSnapshot: productPage.snapshot });
            const snapshot = parse(productPage.snapshot);
            const pageNotFound = snapshot.querySelector(".errorView-root-hPb");

            const inWebStockLocator = "brDynamicalOptions-inWebStockStyle-dtw";
            const inStoreStockLocator = "brDynamicalOptions-inStoreStockStyle-ts1";
            const outOfStockInStoreAndWebLocator = "brDynamicalOptions-outOfStockStyle-2nn";

            const sizeButtons = [...snapshot.querySelectorAll(".brDynamicalOptions-optionsValue-9GS")];

            // const inWebStore = sizeButtons.filter(button => button.includes(inWebStockLocator));
            // const inStoreStock = sizeButtons.filter(button => button.includes(inStoreStockLocator));

            // console.log({ sizeButtons });
            if (pageNotFound) {
                result.push(excelRow({message: `ERROR;product page not found`, refs: skus, i, excelSLP }));
            } else if (!productPage.snapshot.length) {
                result.push(excelRow({message: `NO PDP`, refs: skus, i, excelSLP }));
            } else if (productPage.snapshot) {
                result.push(excelRow({message: `OK`, refs: skus, i, excelSLP }));
            }
        });
    } else {
        // TODO: fix test to use actually URLs and test online
    }

    return {
        result,
        label: "PDP"
    };
}