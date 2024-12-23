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
import { testRelevance } from "../../../shared-functions/testRelevance";
import { testBadges } from "../../../shared-functions/testBadges";

const mitigatedErrors = getMitigatedErrors(`
`);

// copy/paste SKUs between the `` to test a selected number of SKUs
const skus = `
3060008-3187
3060002-3010
3060007-3187
3060009-3068
3060013-3010
3031206-3010
3033525-3068
3033529-4545
3033534-3068
3033230-3529
3033476-3001
3033476-3010
`.split(/\n/).filter(v => v.length > 0);

let { page, excelRows, testTarget, duplicatedRows, offlineProductPages, excelSLP, magentoData } = setupTestData("aw24-fas1-allt-precheck-endast-error-skus");

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

    // const relevance = await testRelevance({ resultRelevance: status.resultRelevance, testTarget, skus });
    // excelRows.push({ label: relevance.label, result: relevance.result });

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

test(`PDP: Test badges`, async () => {
    const data = await testBadges({ testTarget, offlineProductPages, skus, excelSLP });
    excelRows.push({ label: data.label, result: data.result });
})

test(`SKU stock QTY: ${testTarget}`, async () => {
    const { result, label, allSimpleSkus } = await testMagentoStockQty({ offlineProductPages, testTarget, skus });
    excelRows.push({ label, result });
    
    const data = await testChildrenToNotHaveIdentifiers({ allSimpleSkus, testTarget, skus });
    excelRows.push({ label: data.label, result: data.result });
});