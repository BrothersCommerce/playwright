import fetch from 'node-fetch';
import { ExtendenProduct, MagentoConfigurableProduct, MagentoSimpleProduct, MagentoStockSource, MagentoStockSourceResponse, RequestOptions } from '../../utils/types';

type FilterCondition = 'eq' | 'finset' | 'from' | 'gt' | 'gteq' | 'in' | 'like' | 'lt' | 'lteq' | 'moreq' | 'neq' | 'nfinset' | 'nin' | 'nlike' | 'notnull' | 'null' | 'to';

type Filter = {
    field: string;
    value: string | number | boolean;
    condition_type?: FilterCondition;
};

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


const request = async <T>(endpoint: string, options: RequestOptions = { method: 'GET'}): Promise<T> => {
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
            console.log(error);
        }
    });
}

export const magento = {
    getProductStatus: async (sku: string) => {
        const endpoint = `/products/${sku}`;
        const res = await request<MagentoConfigurableProduct & { message: string }>(endpoint);
        const potentialRNBlook = "The product that was requested doesn't exist. Verify the product and try again.";

        if (res.message === potentialRNBlook) {
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
    getFilteredProducts: async (filters: Filter[]) => {
        const filterQueryString = getFilterQueryString(filters);
        const endpoint = `/products${filterQueryString}`;

        const fetchProductsWithFilter = (await request<{ items: MagentoConfigurableProduct[] }>(endpoint)).items;

        const rnbLooks = fetchProductsWithFilter.filter(product => {
            if (product.type_id === "rnblook" && product.custom_attributes.some(ca => ca.attribute_code === "product_key")) {
                return product;
            }
    });

        const skusWithNoSimpleProducts = fetchProductsWithFilter.filter(product => product.extension_attributes.configurable_product_links && !product.extension_attributes.configurable_product_links.length);

        const productsWithSimpleProducts = fetchProductsWithFilter.filter(product => product.extension_attributes.configurable_product_links && product.extension_attributes.configurable_product_links.length);

        const { skus: fetchSimpleProducts } = (await magento.getSimpleProductsForAllSkus(productsWithSimpleProducts.map(product => product.sku)));

        const extendedProducts: ExtendenProduct[] = [];

        console.log(`${productsWithSimpleProducts.length} skus to be extend with stocks and simple products for testing`);
        for (let i = 0; i < productsWithSimpleProducts.length; i++) {
            console.log(`${i + 1}/${productsWithSimpleProducts.length} - Extending SKU: ${productsWithSimpleProducts[i].sku}`);
            const simpleProducts = (fetchSimpleProducts.find(simpleProduct => simpleProduct.parentSku === productsWithSimpleProducts[i].sku) ?? { simpleProductSkus: []}).simpleProductSkus;
            const stock = (await magento.getStockStatus(simpleProducts));
            extendedProducts.push({
                ...productsWithSimpleProducts[i],
                simpleProducts,
                stock
            });
        };

        const extendedProductsWithStock = extendedProducts.filter(ep => ep.stock.noWasteQty !== 0);
        const skusWithNoStock = extendedProducts.filter(ep => ep.stock.noWasteQty === 0);
        const skusWithVariants: ExtendenProduct[] = [];
        const skusWithIdentifiers: ExtendenProduct[] = [];
        extendedProductsWithStock.forEach(ep => {
            if (ep.simpleProducts.some(simpleproduct => !simpleproduct.includes("-"))) {
                skusWithIdentifiers.push(ep);
            } else {
                skusWithVariants.push(ep);
            }
        });

        const skusToTest = skusWithVariants.map(product => {
            const getAttribute = (code: string) => product.custom_attributes.find(ca => ca.attribute_code.toLowerCase() === code)?.value;
            return {
                id: product.id,
                url: getAttribute("url_key"),
                kategori: getAttribute("kategori"),
                categories: getAttribute("category_ids"),
                brand: getAttribute("brand"),
                brandId: getAttribute("brand_filter"),
                sku: product.sku,
                status: product.status,
                visibility: product.visibility,
                created: product.created_at,
                updated: product.updated_at,
                typeId: product.type_id,
                name: product.name,
                stock: product.stock,
                simpleProducts: product.simpleProducts,
                brandAndName: `${getAttribute("brand")}, ${product.name}`
            }
        });


        return {
            skusToTest,
            skusWithNoSimpleProducts: skusWithNoSimpleProducts.map(entry => entry.sku),
            skusWithNoStock: skusWithNoStock.map(entry => entry.sku),
            skusWithIdentifiers: skusWithIdentifiers.map(entry => entry.sku),
            rnbLooks: rnbLooks,
        };
    }
}