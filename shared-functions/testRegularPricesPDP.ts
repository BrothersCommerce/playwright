import { ProductPage, ExcelSLPNode } from "../utils/types";
import { excelRow } from "../utils/excelRow";
import { parse } from "node-html-parser";

export const testRegularPricesPDP = async ({
    testTarget,
    excelSLP,
    skus,
    offlineProductPages
}:{
  testTarget: string;
    excelSLP?: ExcelSLPNode[];
    skus: string[];
    offlineProductPages: ProductPage[];
}): Promise<{ label: string, result: string[][], regularPrices: string[][] }> => {
  return new Promise (async (resolve) => {
    console.log(`${offlineProductPages.length} products in sale "${testTarget}" to be tested:`);
    console.log("Products should have regulare price and no top-right badge.")
    const result: string[][] = [];
    const regularPrices: string[][] = [];

    if (offlineProductPages) {
      offlineProductPages.map(async (page, i) => {
        const snapshot = page.snapshot;
        const plpPrices = page.plpPriceBlocks;
        const root = parse(snapshot);
        const priceBlocks = [...root.querySelectorAll(".brProductPrice-tab-wBq > div")].length;
        if (priceBlocks  === 1 && plpPrices.length === 1) {
          const fetchRegularPricePDP = (root.querySelector(".brProductPrice-tab-wBq > div")?.textContent)
          ?.replace("kr", "")
          ?.replaceAll(String.fromCharCode(160), "") ?? "";

          const regularPrice = +fetchRegularPricePDP;

          if (regularPrice === plpPrices[0]) {
            result.push(excelRow({ message: "OK", refs: skus, excelSLP, i}));
          } else {
            result.push(excelRow({ message: `DIFF;price do not match with PLP. ${JSON.stringify({ plp: plpPrices[0], pdp: regularPrice })}`, refs: skus, excelSLP, i}));
          }
        } else if (priceBlocks > 1) {
          result.push(excelRow({ message: `ERROR;price blocks should be 1, got ${priceBlocks}`, refs: skus, excelSLP, i}));
        } else {
          result.push(excelRow({ message: `NO PDP`, refs: skus, excelSLP, i}));
        }
      })
    }

  resolve({ label: "PDP price", result, regularPrices });
  });

}