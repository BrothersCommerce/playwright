import { service } from "../../../services";
import test, { expect } from "@playwright/test";
import { MAGENTO_ATTR } from "../../../utils/constants";
import { setupTestData } from "../../../utils/setupTestData";
import { setupBrothersSE } from "../../../shared-functions/setupBrothersSE";
import { excelReportMulti } from "../../../utils/excelReportMulti";
import { testPLP } from "../../../shared-functions/testPLP";
import { testPDP } from "../../../shared-functions/testPDP";
import { testRegularPricesPDP } from "../../../shared-functions/testRegularPricesPDP";
import { testMagentoStatus } from "../../../shared-functions/testMagentoStatus";
import { testMagentoConnectedSkus } from "../../../shared-functions/testConenctedStatus";
import { setMagentoSlp } from "../../../shared-functions/setMagentoSlp";

let skus: string[] = [];

let { page, excelRows, testTarget, duplicatedRows, offlineProductPages } = setupTestData(process.env.CATEGORY_UNDER_TEST ?? "unknown test");

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ browser }) => {
    page = await setupBrothersSE(browser);

    const getCategoryCode = (): Promise<number> => {
        return new Promise((resolve, reject) => {
        const codeEntry = MAGENTO_ATTR.categories.find(cat => cat.label.toLowerCase() === testTarget.toLowerCase());
        if (codeEntry && codeEntry.value) {
          resolve(codeEntry.value);
        }
  
        reject(0);
      });
    };

    const categoryCode = await getCategoryCode();

    const { skus: skusToTest, noChilds, outOfStock } = await service.magento.getFilteredProducts({
        filters: [
                {
                    field: "Kategori",
                    value: categoryCode,
                },
                {
                    field: "status",
                    value: MAGENTO_ATTR.status.enabled
                },
                {
                    field: "visibility",
                    value: MAGENTO_ATTR.visibility.catalogAndSearch
                }
            ],
    });

    const printExcludedSKUs = () => {
        const removedNoChilds = (noChilds && noChilds.length) ?? 0;
        const removedOutOfStock = (outOfStock && outOfStock.length) ?? 0;
        const removedSkus = removedNoChilds + removedOutOfStock;
        console.log("");
        console.log("");
        console.log(`${removedSkus} SKUs removed from test. ${removedSkus > 0 ? "Reasons and SKUs listed bellow:" : ""}`);
        console.log("*********************************************************");
        if (noChilds && noChilds.length) {
            console.log("");
            console.log("NO SIMPLE PRODUCTS CONNECTED:");
            console.log("");
            for (const sku of noChilds) console.log(sku);
        }

        if (outOfStock && outOfStock.length) {
            console.log("");
            console.log("OUT OF STOCK:");
            console.log("");
            for (const sku of outOfStock) console.log(sku);
        }
        console.log("");
    }

    printExcludedSKUs();

    skus = skusToTest;

    console.log(`${skus.length} SKUs in Kategori "${process.env.CATEGORY_UNDER_TEST}" to be tested.`);
});

test.afterAll(async () => {
    if (skus.length > 0) {
        await excelReportMulti({ excelRows, testTarget, duplicatedRows, saleStatus: "active" });
    } else {
        console.log("--------------------------")
        console.log("INFO: No products to test.");
    }
    
    await page.close();
});

test(`PLP`, async () => {
    const data = await testPLP({ testTarget, skus, page });
    offlineProductPages = data.offlineData;
    excelRows.push({ label: data.label, result: data.result });
});

test(`SKU status: ${testTarget}`, async () => {
    const status = await testMagentoStatus({ skus, testTarget });
    excelRows.push({ label: status.label, result: status.result });

    const connected = await testMagentoConnectedSkus({ resultConnectedSkus: status.resultConnectedSkus, testTarget, skus });
    excelRows.push({ label: connected.label, result: connected.result });

    offlineProductPages = await setMagentoSlp({ result: status.resultMagentoSlp, offlineProductPages, testTarget, skus });
});

test(`PDP: ${testTarget}`, async () => {
    const data = await testPDP({ offlineProductPages, testTarget, skus });
    excelRows.push({ label: data.label, result: data.result });
});

test(`PDP regular price "${testTarget}`, async () => {
    const data = await testRegularPricesPDP({ testTarget, skus, offlineProductPages });
    excelRows.push({ label: data.label, result: data.result });
});
