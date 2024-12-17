import { Page } from "@playwright/test";
import * as TEMPLATES from "./templatesForResponseTypes";

export type slpObject = {
    SKU: string;
    ITEMNO?: string;
    Kampanjpris: number;
    Startdatum: number;
    'Slutdatum (Till och med)': number;
    ' Senaste lägsta pris ': string;
    'Ord pris:': string;
    'Rabatt:': number;
    Item: string,
    'Color:': string
  }

  export type ExcelSLPNode = {
    sku: string;
    prices: {
        sale: number;
        slp: number;
        regular: number;
        discount: number;
    };
    excelRow: number;
};

export type PriceBlocks = {
  regularPrice: number;
  salePrice: number;
  lastLowestPrice: number;
  discount: number;
}

export type ExpectedBadges = {
  topRight?: string;
  topLeft?: string;
  bottomRight?: string;
  bottomLeft?: string;
}

export type ProductPage = {
  url: string;
  snapshot: string;
  plpPriceBlocks: number[];
  sku: string;
  slp?: number;
};

export type Prices = {
  discount?: number;
  sale?: number;
  regular: number;
  slp?: number;
}

export type ExcelRow = {
  label: string;
  result: string[][];
};

export type MagentoData = {
  status: string,
  isConnected?: string,
  sku: string,
  identifiers?: boolean,
  qty?: { noWasteQty?: number, inStoreQty?: number }
};

export type MagentoConnectedSkus = { connectedSku: string, sku: string };

export type SetupData = {
  testTarget: string,
  excelSLP: ExcelSLPNode[],
  skus: string[],
  offlineProductPages: ProductPage[],
  excelRows: ExcelRow[],
  page: Page,
  duplicatedRows: number,
  magentoData: MagentoData[],
}

export type MagentoStatus = { enabled: boolean, inStock: number };

export type RequestOptions = {
  method: string
}

export type MagentoSimpleProduct = typeof TEMPLATES.CONFIGURABLE_PRODUCT;

export type MagentoConfigurableProduct = typeof TEMPLATES.CONFIGURABLE_PRODUCT;

export type MagentoStockSource = {
  sku: string,
  source_code: string,
  quantity: number,
  status: number
};

export type MagentoFilter = {
  field: string,
  value: string,
  condition_type: string
}

export type MagentoStockSourceResponse = {
  items: MagentoStockSource[],
  search_criteria: {
    filter_groups: [
      {
        filters: MagentoFilter[]
      }
    ]
  },
  total_count: number
}

export type ExtendenProduct = {simpleProducts: string[], stock: { noWasteQty: number; inStoreQty: number }} & MagentoConfigurableProduct;

export type ExpectedPrice = {
  sku: string;
  sale?: number;
  slp?: number;
  regular?: number;
  discount?: number;
};