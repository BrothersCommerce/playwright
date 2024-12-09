import { service } from "../../../services";
import test from "@playwright/test";
import { MAGENTO_ATTR } from "../../../utils/constants";
import { setupTestData } from "../../../utils/setupTestData";
import { setupBrothersSE } from "../../../shared-functions/setupBrothersSE";
import { excelReportMulti } from "../../../utils/excelReportMulti";
import { testPLP } from "../../../shared-functions/testPLP";
import { testPDP } from "../../../shared-functions/testPDP";
import { testRegularPricesPDP } from "../../../shared-functions/testRegularPricesPDP";

let productsInKategori;
let skus;

let { page, excelRows, testTarget, duplicatedRows, offlineProductPages, excelSLP, magentoData } = setupTestData(process.env.CATEGORY_UNDER_TEST ?? "unknown test");

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ browser }) => {
    page = await setupBrothersSE(browser);

    const targetCategory = process.env.CATEGORY_UNDER_TEST;
    const data = await service.magento.getFilteredProducts([
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
        },
    ]);

    productsInKategori = (process.env.CATEGORY_UNDER_TEST ?? "").toLowerCase() === "kostym" ? data.rnbLooks : data.skusToTest;
    skus = productsInKategori.map(product => product.sku);

    console.log(`${productsInKategori.length} SKUs in Kategori "${process.env.CATEGORY_UNDER_TEST}" to be tested.`);
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

test(`PDP: ${testTarget}`, async () => {
    const data = await testPDP({ offlineProductPages, testTarget, skus });
    excelRows.push({ label: data.label, result: data.result });
});

test(`PDP regular price "${testTarget}`, async () => {
    const data = await testRegularPricesPDP({ testTarget, skus, offlineProductPages });
    excelRows.push({ label: data.label, result: data.result });
});