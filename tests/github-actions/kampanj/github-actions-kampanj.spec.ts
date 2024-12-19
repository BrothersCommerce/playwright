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
import { ExpectedPrice } from "../../../utils/types";

const mitigatedErrors = getMitigatedErrors(`
`);

let { page, excelRows, testTarget, duplicatedRows, offlineProductPages, excelSLP, magentoData } = setupTestData((process.env.SALE_NAME ?? "unknownSale"));

const getEnvInput = (env?: string): Promise<string[]> => new Promise((resolve) => resolve((env ?? "").trim().split(/\n/).filter(v => v.length > 0).map(v => v.trim())));

let skus;
let salePrices;
let slps;

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ browser }) => {
    skus = (await getEnvInput(process.env.SKUS)).filter(sku => !sku.split("")[0].match(/[a-z,A-Z]/g));
    salePrices = (await getEnvInput(process.env.SALE_PRICES)).filter(sku => !sku.split("")[0].match(/[a-z,A-Z]/g)).map(v => v.replace(",", "").replace(" ", "")).map(v => +v);
    slps = (await getEnvInput(process.env.SLP)).filter(sku => !sku.split("")[0].match(/[a-z,A-Z]/g)).map(v => v.replace(",", "").replace(" ", "")).map(v => +v);
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

test(`PDP sale prices "${testTarget}"`, async () => {
    test.skip(!salePrices.length && !slps.length, "PDP sale prices: SKip test for sale prices because no sale data was provided.");

    const expectedPrices: ExpectedPrice[] = [];

    for (let i = 0;i < skus.length; i++) {
        const sale = salePrices[i];
        const slp = slps[i];
        expectedPrices.push({
            sku: skus[i],
            sale,
            slp
        })
    };

    const data = await testSalePrices({ offlineProductPages, skus, testTarget, expectedPrices });
    excelRows.push({ label: data.label, result: data.result });
});

test(`PDP regular price "${testTarget}`, async () => {
    test.skip(salePrices.length, "PDP regular price: Skip test because user wanted to test SALE PRICES");
    const data = await testRegularPricesPDP({ testTarget, skus, offlineProductPages });
    excelRows.push({ label: data.label, result: data.result });
});

test(`SKU stock QTY: ${testTarget}`, async () => {
    test.skip(process.env.QTY === "false", "Test stock qty skipped becuase of user input.");
    const { result, label, allSimpleSkus } = await testMagentoStockQty({ offlineProductPages, testTarget, skus });
    excelRows.push({ label, result });
    
    const data = await testChildrenToNotHaveIdentifiers({ allSimpleSkus, testTarget, skus });
    excelRows.push({ label: data.label, result: data.result });
});