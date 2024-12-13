import fetch from 'node-fetch';
import { MagentoConfigurableProduct, MagentoSimpleProduct, MagentoStockSource, MagentoStockSourceResponse, RequestOptions } from '../../utils/types';

type FilterCondition = 'eq' | 'finset' | 'from' | 'gt' | 'gteq' | 'in' | 'like' | 'lt' | 'lteq' | 'moreq' | 'neq' | 'nfinset' | 'nin' | 'nlike' | 'notnull' | 'null' | 'to';

type Filter = {
    field: string;
    value: string | number | boolean;
    condition_type?: FilterCondition;
};

/**
 * 
 * @param filters Array with filters in the Magento format. Read more at: https://developer.adobe.com/commerce/webapi/rest/use-rest/performing-searches/
 * @returns filter query string to attach to the endpoint URL.
 */
const getFilterQueryString = (filters: Filter[]) => {
    let filterQueryString = '?';

    for (let i = 0; i < filters.length; i++) {
        let conditionQueryPart = '';

        if (filters[i].condition_type) {
            conditionQueryPart = `&searchCriteria[filterGroups][${i}][filters][${i}}][conditionType]=${filters[i].condition_type}`;
        }

        const partialFilterQueryString = `searchCriteria[filterGroups][${i}][filters][${i}][field]=${filters[i].field}&searchCriteria[filterGroups][${i}][filters][${i}][value]=${filters[i].value}${conditionQueryPart}`;
        filterQueryString += i > 0 ? `&${partialFilterQueryString}` : partialFilterQueryString;
    }

    return filterQueryString;
}

const request = <T>(endpoint: string, options: RequestOptions = { method: 'GET'}): Promise<T> => {
    return new Promise(async (resolve, reject) => {
        let response;
        try {
            const url = `${process.env.MAGENTO_BASE_URL}${endpoint}`;
            response = await fetch(url, {
                ...options,
                headers: {
                    "Authorization": `Bearer ${process.env.MAGENTO_TOKEN}`,
                    "Content-Type": "application/json; charset=utf-8"
                },
            });

            resolve(response.json() as T & { message: string });
        } catch (error) {
            reject(error.message)
        }
    });
}

/**
 * 
 * @param products Configurables fetched from Magento
 * @returns product keys to use as SKUs because RNB looks do not have actually SKUs as Configurables do have.
 */
const getRnbProductKeys = (products: MagentoConfigurableProduct[]) => {
    const rnbs = products.filter(product => {
        if (product.type_id === "rnblook" && product.custom_attributes.some(ca => ca.attribute_code === "product_key")) {
            return product;
        }

        return null;
    });
    
    const rnbProductKeys = rnbs.map(rnb => rnb.custom_attributes.find(ca => ca.attribute_code === "product_key")?.value).filter(v => typeof v === "string");

    return rnbProductKeys;
};

/**
 * 
 * @param products Configurables fetched from Magento
 * @returns If all SKUs have stock, childs and no childs with identifiers this function will return 1 array: { sku: string[] }
 *          In any other case the function will return up to 4 arrays as stated in the return Promise<>.
 */
const getFilteredSkus = (products: MagentoConfigurableProduct[]): Promise<{ skus: string[], noChilds?: string[], outOfStock?: string[], identifiers?: string[] }> => {
    return new Promise(async (resolve, reject) => {
        try {
            const productsWithChilds = products.filter(product => product.extension_attributes.configurable_product_links && product.extension_attributes.configurable_product_links.length);
            const noChilds = products.filter(product => !product.extension_attributes.configurable_product_links || !product.extension_attributes?.configurable_product_links?.length).map(p => p.sku);

            const rnbProductKeys = getRnbProductKeys(products);

            if (rnbProductKeys.length) {
                resolve({ skus: rnbProductKeys });
            }

            const { skus: fetchSimpleProducts } = (await magento.getSimpleProductsForAllSkus(productsWithChilds.map(product => product.sku)));
            const inStock: string[] = [];
            const outOfStock: string[] = [];
            const identifiers: string[] = [];
  
            for (let i = 0; i < productsWithChilds.length; i++) {
                console.log(`${i + 1}/${productsWithChilds.length}, get stock quantity for ${productsWithChilds[i].sku}`);
                const simpleProducts = (fetchSimpleProducts.find(simpleProduct => simpleProduct.parentSku === productsWithChilds[i].sku) ?? { simpleProductSkus: []}).simpleProductSkus;
                if (simpleProducts.some(sp => !sp.includes("-"))) identifiers.push(productsWithChilds[i].sku);
                const stock = (await magento.getStockStatus(simpleProducts));
                if (stock.noWasteQty > 0) inStock.push(productsWithChilds[i].sku);
                if (stock.noWasteQty < 1) outOfStock.push(productsWithChilds[i].sku);
            };

            const productsWithStock = productsWithChilds.filter(product => inStock.includes(product.sku));

            const skus = productsWithStock.map(product => product.sku);

            resolve({ skus, noChilds, outOfStock, identifiers });
        } catch (error) {
            console.error(error.message);
            reject({ skus: [] });
        }
    });
};

/**
 * 
 * @param filters Magento filters in array
 * @returns Magento Configurable Products
 */
const getFilteredProducts = (filters: Filter[]): Promise<MagentoConfigurableProduct[]> => {
    return new Promise (async (resolve, reject) => {
        try {
            const filterQueryString = getFilterQueryString(filters);
            const endpoint = `/products${filterQueryString}`;
            const requestConfigurableProducts = await request<{ items: MagentoConfigurableProduct[], total_count: number }>(endpoint);
            if (requestConfigurableProducts.total_count < 1) resolve([]);

            resolve(requestConfigurableProducts.items)
        } catch (error) {
            console.error(error.message);
            reject([]);
        }
    });
};

export const magento = {
    getProductStatus: async (sku: string) => {
        const endpoint = `/products/${sku}`;
        const res = await request<MagentoConfigurableProduct & { message: string }>(endpoint);

        // This is the only way to guess if the product is a RNB look. If the product pass the PLP test but get this response from Magento
        // the reason is that we use the products product_key field as the sku field if it is an RNB, sometimes and sometimes not.
        // So the best we can do is to catch these with the error message from Magento and set status "RNB?", even though some products will get a response that contains
        // res.type_id === "rnblook"
        const potentialRNBlook = "The product that was requested doesn't exist. Verify the product and try again.";

        if (res.message === potentialRNBlook || res.type_id === "rnblook") {
            return { status: "RNB?", connectedSku: "", sku, magentoSlp: -1 };
        }

        const connectedWithSku = (res.custom_attributes.find(ca => ca.attribute_code === "brothers_connected_products") ?? { value: ""}).value as string;
        const connectedProductsCategoryTag = res.custom_attributes.some(ca => ca.attribute_code === "category_ids" && ca.value.includes("1904"));

        const getConnectedStatus = () => {
            if (connectedWithSku || connectedProductsCategoryTag) {
                return connectedProductsCategoryTag ? "CONNECTED" : connectedWithSku;
            }

            return "";
        }

        const connectedSku = getConnectedStatus();
        const magentoSlp = +(res.custom_attributes.find(ca => ca.attribute_code === "last_lowest_price") ?? { value: "" }).value as number;

        let status = "ERROR";
        status = res.status === 1 ? "ENABLED" : "DISABLED";
        
        return { status, connectedSku, sku, magentoSlp };
    },
    getSimpleProducts: async (sku: string): Promise<{ simpleProductSkus: string[] }> => {
        const endpoint = `/configurable-products/${sku}/children`;
        const simpleProductsResponse = await request<MagentoSimpleProduct[]>(endpoint);
        let simpleProductSkus: string[] = [];

        if ((simpleProductsResponse as unknown as { message: string }).message) {
            return { simpleProductSkus };
        }

        simpleProductSkus = simpleProductsResponse.map(child => {
            return child.sku
        });
        return { simpleProductSkus };
    },
    getSimpleProductsForAllSkus: async (parentSkus: string[]) => {
        const childSkus = await Promise.all(parentSkus.map(async (sku) => {
            const simpleProductSkus = (await magento.getSimpleProducts(sku)).simpleProductSkus;
            return {
                simpleProductSkus,
                parentSku: sku,
            }
    }));
        return { skus: childSkus };
    },
    getStockStatus: async (skus: string[]) => {
        let noWasteQty = 0;
        let inStoreQty = 0;
        for (let i = 0; i < skus.length; i++) {
            const filterQueryString = getFilterQueryString([{ field: "sku", value: skus[i]}]);
            const endpoint = `/inventory/source-items${filterQueryString}`;
            
            const stockSources = (await request<MagentoStockSourceResponse>(endpoint)).items;
            const noWasteStockQty = stockSources.find(source => source.source_code === 'nowaste')?.quantity ?? 0;
            inStoreQty = stockSources.filter(source => source.source_code !== 'nowaste').reduce((prev, curr) => {
                return prev += curr.quantity;
            }, 0)

            noWasteQty += noWasteStockQty
        }

        return { noWasteQty, inStoreQty };
    },
    getFilteredProducts: async ({ filters }: { filters: Filter[] }): Promise<{ skus: string[], noChilds?: string[], outOfStock?: string[], identifiers?: string[] }> => {
        const products = await getFilteredProducts(filters);
        const { skus, noChilds, outOfStock, identifiers } = await getFilteredSkus(products);

        return { skus, noChilds, outOfStock, identifiers };
    }
};