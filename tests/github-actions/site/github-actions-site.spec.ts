import { service } from "../../../services";
import test from "@playwright/test";
import { MAGENTO_ATTR } from "../../../utils/constants";
import { setupTestData } from "../../../utils/setupTestData";
import { setupBrothersSE } from "../../../shared-functions/setupBrothersSE";
import { excelReportMulti } from "../../../utils/excelReportMulti";
import { testPLP } from "../../../shared-functions/testPLP";
import { testPDP } from "../../../shared-functions/testPDP";
import { testMagentoStatus } from "../../../shared-functions/testMagentoStatus";
import { testMagentoConnectedSkus } from "../../../shared-functions/testConenctedStatus";
import { setMagentoSlp } from "../../../shared-functions/setMagentoSlp";
import { testMagentoStockQty } from "../../../shared-functions/testMagentoStockQty";
import { testChildrenToNotHaveIdentifiers } from "../../../shared-functions/testForIdentifiers";
import { testRelevance } from "../../../shared-functions/testRelevance";

let skus: string[] = [];

let { page, excelRows, testTarget, duplicatedRows, offlineProductPages } = setupTestData("all-skus-in-magento");

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ browser }) => {
    page = await setupBrothersSE(browser);

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

    if (page) {
        await page.close();
    }    
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

    const relevance = await testRelevance({ resultRelevance: status.resultRelevance, testTarget, skus });
    excelRows.push({ label: relevance.label, result: relevance.result });

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
