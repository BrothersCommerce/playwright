import test from "@playwright/test";
import { setupBrothersSE } from "../../../shared-functions/setupBrothersSE";
import { setupTestData } from "../../../utils/setupTestData";
import { testPLP } from "../../../shared-functions/testPLP";
import { excelReportMulti } from "../../../utils/excelReportMulti";
import { testMagentoStatus } from "../../../shared-functions/testMagentoStatus";
import { testMagentoStockQty } from "../../../shared-functions/testMagentoStockQty";
import { testPDP } from "../../../shared-functions/testPDP";
import { testSalePrices } from "../../../shared-functions/testSalePrices";
import { getMitigatedErrors } from "../../../utils/getMitigatedErrors";
import { service } from "../../../services";
import { testChildrenToNotHaveIdentifiers } from "../../../shared-functions/testForIdentifiers";
import { testMagentoConnectedSkus } from "../../../shared-functions/testConenctedStatus";
import { testRegularPricesPDP } from "../../../shared-functions/testRegularPricesPDP";
import { setMagentoSlp } from "../../../shared-functions/setMagentoSlp";

const mitigatedErrors = getMitigatedErrors(`
`);

// copy/paste SKUs between the `` to test a selected number of SKUs
const skus = `
3033478-3010
3033479-3010
3033479-3050
3033479-3068
3033480-3030
3033480-3010
3033455-3068
3033455-3003
3033461-3068
3033461-3010
3033482-3010
3033277-3010
`.split(/\n/).filter(v => v.length > 0);

let { page, excelRows, testTarget, duplicatedRows, offlineProductPages, excelSLP, magentoData } = setupTestData("selected-skus");

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ browser }) => {
    page = await setupBrothersSE(browser);
});

test.afterAll(async () => {
    await excelReportMulti({ excelRows, testTarget, duplicatedRows, saleStatus: "active" });
    await page.close();
});

test(`PLP: ${testTarget}`, async () => {
    const data = await testPLP({ testTarget, skus, page, mitigatedErrors });
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

test.skip(`PDP sale prices "${testTarget}"`, async () => {
    const data = await testSalePrices({ offlineProductPages, skus, testTarget });
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