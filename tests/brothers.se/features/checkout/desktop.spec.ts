import { test, expect, devices } from '@playwright/test';
import { setupBrothersSE } from '../../../../shared-functions/setupBrothersSE';
import { excelReportFeature } from '../../../../utils/excelReportFeatures';

const productPath = "3030127-3010";
let page;
let result: any[] = [];

test.beforeAll(async ({ browser }) => {
    page = await setupBrothersSE(browser);
});

test.afterAll(async () => {
    await excelReportFeature(result);
})

test("Add socks to the cart, change cart and load Klarnas iFrame", async () => {
    await page.goto(`https://www.brothers.se/${productPath}`);
    expect(page).toHaveURL(`https://www.brothers.se/${productPath}`);

    await page.getByRole('button', { name: '40/45', exact: true }).click();
    await page.getByRole('button', { name: 'Lägg i varukorg' }).click();
    await page.getByRole('button', { name: 'Gå till kassan' }).click();
    await page.getByRole('link', { name: 'Ändra i varukorgen' }).click();
    await page.getByLabel('Minska Antal').click();
    await page.getByLabel('Minska Antal').click(); // This one should be "Öka Antal" in the frontend
    await page.getByLabel('Öka Antal').click(); // This one should be "Minska Antal" in the frontend
    await expect(await page.getByLabel('Antal', { exact: true }).inputValue(), "User can increment and decrement product in cart.").toBe("2");
    await page.getByRole('button', { name: 'Fortsätt till Betalningen' }).click();
    await page.getByLabel('Ange ditt postnummer').click();
    await page.getByLabel('Ange ditt postnummer').fill('11328');
    await page.getByRole('button', { name: 'Fortsätt' }).click();
    await expect(page.locator(".unifaun-shippning_container-y0V"), "Unifaun section is visible.").toBeVisible();
    await page.locator('label').filter({ hasText: 'Leverans till butik3-9' }).locator('span').nth(2).click();

    const klarnaIFrame = await page.frame('klarna-checkout-iframe');

    await expect(klarnaIFrame, "Klarna Checkout iFrame is loaded").toBeDefined();

    if (klarnaIFrame) {
        await klarnaIFrame.fill('#billing-email', 'martin.hanner@brothers.se');
        await klarnaIFrame.fill('#billing-postal_code', '11328');
        await klarnaIFrame.getByRole('button', { name: /Fortsätt/, exact: true }).click();
        await klarnaIFrame.fill('#billing-national_identification_number', '19780726-0539');
        await klarnaIFrame.fill('#billing-given_name', 'Martin');
        await klarnaIFrame.fill('#billing-family_name', 'Hanner');
        await klarnaIFrame.fill('#billing-street_address', 'Upplandsgatan 47');
        await klarnaIFrame.fill('#billing-city', 'Stockholm');
        await klarnaIFrame.fill('#billing-phone', '0709679850');
        await klarnaIFrame.getByRole('button', { name: 'Fortsätt' }).click();
        await expect(klarnaIFrame.getByRole('button', { name: 'Betala köp' }), "Klarna Form is working").toBeAttached();

        result.push({ feature: "checkout", status: "OK" });
    }
});