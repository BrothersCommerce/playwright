import { excelRow } from "../utils/excelRow";

export const testChildrenToNotHaveIdentifiers = ({
    allSimpleSkus,
    testTarget,
    skus
}: {
    allSimpleSkus: {
    childrenSkus: string[];
    parentSku: string;
    }[],
    testTarget: string,
    skus: string[]
}) => {
    console.log(`Simple product SKUs to be tested for IDENTIFIERS in "${testTarget}"`);
    const result: string[][] = [];

    for (let i = 0; i < allSimpleSkus.length; i++) {
        // const parent = simpleProductsForAllSkus[i].parentSku;
        const children = allSimpleSkus[i].childrenSkus;
        const simpleProductSkusIncludesIdentifiers = children.some(sku => (sku.match(/-/g) ?? "").length !== 2);

        let message = "OK";

        if (simpleProductSkusIncludesIdentifiers) {
            message = `IDENTIFIERS`
            result.push(excelRow({ message, refs: skus, i }));
        } else {
            result.push(excelRow({ message, refs: skus, i }));
        }

    }

    return {
        result,
        label: "simple products"
    }
}