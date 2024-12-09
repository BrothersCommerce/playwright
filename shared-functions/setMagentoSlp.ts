import { ProductPage } from "../utils/types";

/**
 * 
 * @description set the last_lowest_price from the Magento response for each configurable product
 */
export const setMagentoSlp = ({
    result,
    offlineProductPages,
    testTarget,
    skus
}: {
    result: { magentoSlp: number, sku: string }[],
    offlineProductPages: ProductPage[],
    testTarget: string,
    skus: string[],
}) => {
    return offlineProductPages.map((page, i) => {
        return {
            ...page,
            slp: result[i].magentoSlp
        }
    });
};