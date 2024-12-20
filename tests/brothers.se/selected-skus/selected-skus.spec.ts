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
3030102-0001
3030102-0004
3030102-0046
3030107-0001
3030107-0162
3030111-0001
3030113-0002
3030114-0001
3030114-0002
3030117-0001
3030607-0046
3030856-0001
3030919-0001
3030919-0004
3031185-0001
3033016-0001
3033016-0046
3030100-0001
3030100-0046
3030104-0001
3030104-0058
3030104-0847
3030111-0002
3030111-0004
3060025-0758
3060028-0001
3060028-0046
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