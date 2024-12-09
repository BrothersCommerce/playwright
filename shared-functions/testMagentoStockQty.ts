import { ExcelSLPNode, ProductPage } from "../utils/types";
import { service } from "../services";
import { excelRow } from "../utils/excelRow";

export const testMagentoStockQty = async ({
    offlineProductPages,
    testTarget,
    skus,
    excelSLP,
}: {
    offlineProductPages: ProductPage[],
    testTarget: string,
    skus: string[],
    qtyAsTag?: boolean,
    excelSLP?: ExcelSLPNode[]
}) => {
    console.log(`Magento stock QTY to be tested for SKUs in "${testTarget}"`);
    const result: string[][] = [];
    const allSimpleSkus: { parentSku: string, childrenSkus: string[] }[] = []

    for (let i =  0; i < offlineProductPages.length; i++) {
        const configurableProduct = offlineProductPages[i].sku;
        const { simpleProductSkus } = await service.magento.getSimpleProducts(configurableProduct);
        const { noWasteQty, inStoreQty } = await service.magento.getStockStatus(simpleProductSkus);
        let message = `${noWasteQty}`;

        if (noWasteQty === 0) message = `${noWasteQty};inStoreQty: ${inStoreQty}`;

        allSimpleSkus.push({ parentSku: configurableProduct, childrenSkus: simpleProductSkus });
        result.push(excelRow({ message, refs: skus, i }));
    }

    return {
        result,
        allSimpleSkus,
        label: "qty"
    }
};