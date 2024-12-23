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
3031781-3008
3031781-3432
3031781-3454
3031781-3916
3031782-3008
3031782-3011
3031782-3367
3031782-3454
3031783-3008
3031783-3367
3031783-3011
3031783-3100
3031783-3432
3031783-6044
3031784-5075
3031784-6044
3031787-3100
3031811-3916
3031811-6044
3031813-3009
3031813-3037
3031813-3391
3031813-3463
3031813-3916
3031813-6065
3031780-3010
3031780-3916
3033214-3454
3031788-3010
3031788-3916
3031788-5084
3031791-3100
3031791-3367
3031791-3432
3031791-3454
3031791-5084
3031791-6044
3031793-3367
3031793-5066
3031795-3367
3031795-3432
3031795-3463
3031795-5066
3031797-3367
3031803-3037
3031803-3916
3031803-5066
3031462-3490
3031749-3463
3031749-5066
3031769-5066
3031796-3463
3031796-3916
3031796-5060
3033282-3006
3033282-3777
3033282-3916
3033282-5060
3031700-5075
3060004-3010
3060004-3068
3033448-3020
3060015-3069
3060003-3010
3060008-3005
3060008-3187
3033451-3020
3060002-3010
3060007-3187
3060009-3068
3060013-3010
3060014-3010
3033449-3820
3033450-3010
3033450-3020
3033454-3820
3033459-3001
3031206-3010
3033555-3001
3033555-3010
3033555-3020
3033240-3068
3033556-3003
3033556-3068
3033560-3020
3033561-3020
3033561-3795
3033558-3020
3033557-3001
3033243-3014
3033243-3020
3033243-3700
3033243-3795
3033559-3001
3033559-3068
3060029-3100
3060029-3001
3060029-3005
3060029-3010
3029291-3069
3030590-3069
3031758-3069
3031759-3069
3031761-3069
3033533-3069
3033526-3068
3033525-3068
3033529-4545
3029457-3010
3029457-3345
3033534-3068
3060027-3010
3033523-3068
3033629-3010
3033630-8520
3033631-6229
3033640-3010
3033640-3962
3033644-3060
3033632-3012
3033632-3018
3033632-3231
3033632-3384
3033633-3010
3033633-3111
3033633-3727
3033672-3010
3033672-3097
3033641-3727
3033641-6236
3028629-3005
3028629-3068
3028748-3001
3028748-3005
3028748-3010
3028748-3038
3028748-3068
3028748-3097
3028748-3950
3028934-2569
3028934-3367
3028934-3912
3028934-3949
3028934-3950
3028934-5038
3028934-6113
3030800-3054
3030800-5179
3030800-8520
3033675-3111
3033675-3962
3033676-3001
3033676-3050
3033676-3060
3033565-3068
3033566-3068
3033551-3010
3033229-3529
3033229-6078
3033230-3529
3033230-6078
3033099-3010
3033099-3050
3033099-3068
3033099-3091
3033463-3069
3033465-3069
3033466-3069
3033467-3010
3033468-3069
3033470-3069
3033471-3010
3033472-3105
3033473-3100
3033474-3063
3033476-3001
3033476-3010
3033460-3799
3031716-3005
3031731-3367
3031731-6004
3033280-3341
3033317-6002
3033328-3010
3031753-3367
3031753-3551
3031801-4051
3031801-6011
3031804-3551
3031804-6008
3031804-6090
3031805-3367
3031805-6008
3031806-3342
3031807-3010
3031807-3367
3031807-3777
3031807-6044
3031807-6090
3031812-3010
3031812-3551
3031817-3010
3031817-3011
3031818-3367
3031818-3777
3031711-3367
3031711-3845
3033225-3010
3033225-3367
3033225-3777
3033268-3367
3033268-3777
3033270-3010
3031725-3011
3031726-3011
3033129-3100
3033130-3100
3033135-3126
3033136-3126
3033139-3100
3033139-3391
3033139-3551
3033140-3100
3033140-3391
3033140-3551
3033141-3100
3033142-3100
3033143-3367
3033144-3001
3033144-3593
3033145-3001
3033145-3593
3033148-3005
3033148-3391
3033149-3005
3033149-3391
3033245-3916
3033311-3010
3033346-3065
3033346-3731
3033347-3065
3033347-3731
3033288-4051
3031715-3005
3031732-3367
3031732-6004
3031747-3006
3031747-3777
3031747-4051
3031747-6090
3033319-6002
3033329-3010
3029164-5052
3029793-5052
3030346-5052
3033332-6011
3033332-6090
3033355-3001
3033355-3367
3033308-3006
3033308-3022
3033196-3022
3033197-3010
3033197-5015
3033198-4198
3033267-3006
3033269-3010
3033192-3463
3033193-3006
3033194-3777
3033199-3037
3033199-5015
3033200-4198
3033201-3100
3033207-3100
3033293-3006
3033271-3006
3033271-4198
3031480-3037
3033184-3010
3033195-3008
3033273-3022
3033273-5015
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
3033276-5596
3033277-3010
3029068-3005
3029068-3068
3029068-3389
3029068-3475
3029068-3531
3029069-3005
3029069-3068
3029069-3389
3029069-3475
3029069-3531
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