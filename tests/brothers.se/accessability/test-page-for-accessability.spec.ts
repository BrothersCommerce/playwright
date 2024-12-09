import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright'; // 1

test.describe('Test individual page', () => { // 2
  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('https://www.brothers.se/mid-season-sale?page=1'); // 3
    await page.locator('footer line').nth(1).click();

    const accessibilityScanResults = await new AxeBuilder({ page }).disableRules('color-contrast').analyze(); // 4

    expect(accessibilityScanResults.violations).toEqual([]); // 5
  });
});