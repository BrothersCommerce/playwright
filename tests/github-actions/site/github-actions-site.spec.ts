import { service } from "../../../services";
import test from "@playwright/test";
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
import { testMagentoStockQty } from "../../../shared-functions/testMagentoStockQty";
import { testChildrenToNotHaveIdentifiers } from "../../../shared-functions/testForIdentifiers";

let skus: string[] = [];

let { page, excelRows, testTarget, duplicatedRows, offlineProductPages } = setupTestData("all-skus-in-magento");

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

    const removeNotOnWebsiteSkus = process.env?.REMOVE_SKUS ?? "false";

    console.log("Remove SKUs with out-of-stock, no childs and identifiers: ", removeNotOnWebsiteSkus)

    const { skus: skusToTest, noChilds, outOfStock } = await service.magento.getFilteredProducts({
        filters: [
                {
                    field: "status",
                    value: MAGENTO_ATTR.status.enabled,
                },
                {
                    field: "visibility",
                    value: MAGENTO_ATTR.visibility.catalogAndSearch
                }
            ],
            removeNotOnWebsiteSkus: "false"
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

    if (removeNotOnWebsiteSkus) {
        printExcludedSKUs();
    }

    skus = skusToTest;

    console.log(`${skus.length} SKUs in magento to be tested.`);
});

test.afterAll(async () => {
    if (skus.length > 0) {
        await excelReportMulti({ excelRows, testTarget, duplicatedRows, saleStatus: "active" });
    } else {
        console.log("--------------------------");
        console.log("INFO: No products to test.");
    }
    
    await page.close();
});

test(`PLP`, async () => {
    test.skip(!skus.length, "PLP: No products to test...");
    const data = await testPLP({ testTarget, skus, page });
    offlineProductPages = data.offlineData;
    excelRows.push({ label: data.label, result: data.result });
});

test(`SKU status: ${testTarget}`, async () => {
    test.skip(!skus.length, "SKU status: No products to test...");
    const status = await testMagentoStatus({ skus, testTarget });
    excelRows.push({ label: status.label, result: status.result });

    const connected = await testMagentoConnectedSkus({ resultConnectedSkus: status.resultConnectedSkus, testTarget, skus });
    excelRows.push({ label: connected.label, result: connected.result });

    offlineProductPages = await setMagentoSlp({ result: status.resultMagentoSlp, offlineProductPages, testTarget, skus });
});

test(`PDP: ${testTarget}`, async () => {
    test.skip(!skus.length, "PDP: No products to test...");
    const data = await testPDP({ offlineProductPages, testTarget, skus });
    excelRows.push({ label: data.label, result: data.result });
});

test(`SKU stock QTY: ${testTarget}`, async () => {
    test.skip(!skus.length, "SKU stock QTY: No products to test...");
    const { result, label, allSimpleSkus } = await testMagentoStockQty({ offlineProductPages, testTarget, skus });
    excelRows.push({ label, result });
    
    const data = await testChildrenToNotHaveIdentifiers({ allSimpleSkus, testTarget, skus });
    excelRows.push({ label: data.label, result: data.result });
});