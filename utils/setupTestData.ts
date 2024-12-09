import { read, utils } from 'xlsx';
import { readFileSync } from 'fs';
import type { ExcelRow, MagentoData, ProductPage, SetupData, slpObject, ExcelSLPNode } from "./types";

const getTestData = (sheetName: string) => {
    const buffer = readFileSync(`test-data/Senaste lägsta pris 2024.xlsx`);
    const workbook = read(buffer);
    const salesAsJSON: slpObject[] = utils.sheet_to_json(workbook.Sheets[`${sheetName}`]);
    const saleUnderTestData: ExcelSLPNode[] = salesAsJSON.map((product, index) => {
      return {
        sku: product.SKU ?? product.ITEMNO,
        prices: {
          sale: Math.round(product.Kampanjpris) ?? 0,
          slp: Math.round(+product[' Senaste lägsta pris ']),
          regular: +product['Ord pris:'],
          discount: Math.round(+product['Rabatt:'] * 100)
        },
        excelRow: index + 2,
      }
    }).filter(v => v.sku?.length > 6);

    const duplicateFreeTestData = saleUnderTestData.reduce<ExcelSLPNode[]>((prev, curr) => {
      const duplicateSKU = !!prev.filter(p => p.sku === curr.sku).length;

      if (duplicateSKU) {
          return prev;
      }

      return [...prev, curr];
    }, []);

    const duplicatedRows = saleUnderTestData.length - duplicateFreeTestData.length;

    console.log(`Duplicated rows removed before test run: ${duplicatedRows}`);

    return { excelSLP: duplicateFreeTestData, duplicatedRows };
}

/**
 * 
 * @param testTarget tab name in the SLP excel OR a string that describe a category on the home page.
 * @returns 
 */
export const setupTestData = (testTarget: string): SetupData => {
    const { excelSLP, duplicatedRows } = getTestData(testTarget);
    
    const skus = excelSLP.map(product => product.sku);

    const offlineProductPages: ProductPage[] = [];
    const excelRows: ExcelRow[] = [];
    const magentoData: MagentoData[] = [];
    let page;

    return { testTarget, excelSLP, skus, offlineProductPages, excelRows, page, duplicatedRows, magentoData };
}