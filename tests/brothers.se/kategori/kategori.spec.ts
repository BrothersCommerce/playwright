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

let skus;

let { page, excelRows, testTarget, duplicatedRows, offlineProductPages, excelSLP, magentoData } = setupTestData(process.env.CATEGORY_UNDER_TEST ?? "unknown test");

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ browser }) => {
    page = await setupBrothersSE(browser);

    const targetCategory = process.env.CATEGORY_UNDER_TEST;
    console.log("process.env.CATEGORY_UNDER_TEST: ", targetCategory)
    const data = await service.magento.getFilteredProducts({
        filters: [
                {
                    field: "Kategori",
                    value: MAGENTO_ATTR.categories.find(category => category.label.toLowerCase() === targetCategory?.toLowerCase())?.value ?? "",
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
        onlySkus: true
    });

    skus = (process.env.CATEGORY_UNDER_TEST ?? "").toLowerCase() === "kostym" ? data.rnbProductKeys : data.skusToTest;

    console.log(`${skus.length} SKUs in Kategori "${process.env.CATEGORY_UNDER_TEST}" to be tested.`);
});

test.afterAll(async () => {
    await excelReportMulti({ excelRows, testTarget, duplicatedRows, saleStatus: "active" });
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

test(`SKU stock QTY: ${testTarget}`, async () => {
    const { result, label, allSimpleSkus } = await testMagentoStockQty({ offlineProductPages, testTarget, skus });
    excelRows.push({ label, result });
    
    const data = await testChildrenToNotHaveIdentifiers({ allSimpleSkus, testTarget, skus });
    excelRows.push({ label: data.label, result: data.result });
});