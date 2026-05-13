/**
 * ERP-agnostic types. All adapters (Entersoft today, Odoo tomorrow)
 * normalize their data into these shapes before the rest of the app sees it.
 *
 * Keep this file dependency-free.
 */

export type Currency = "EUR";

export interface ErpProduct {
  /** Stable ERP unique id (e.g. Entersoft ItemGID, Odoo product.template.id) */
  erpId: string;
  /** SKU code (Entersoft Code, Odoo default_code). Cross-system join key. */
  sku: string;
  /** EAN/barcode. May contain multiple comma-separated. */
  barcodes: string[];
  /** Family/group codes as a hierarchy path, e.g. ["02","02.01"] */
  categoryPath: string[];
  brand: string | null;
  retailPrice: number;
  /** B2B / wholesale */
  wholesalePrice: number | null;
  /** true => sellable online */
  publishable: boolean;
  inactive: boolean;
  /** Stock dimensions (sizes/colors) discovered for this item. */
  stockDimensions: string[];
  /** Source flag: true if ERP marked critical fields as missing */
  hasMissingFields: boolean;
  /** Raw last-modified timestamp from ERP, ISO-8601 */
  lastModified: string | null;
}

export interface ErpStockLine {
  /** ERP item id (cross-ref to ErpProduct.erpId) */
  erpItemCode: string;
  /** Stock dimension (size/color); null if item has no variants */
  dimension: string | null;
  /** Available units per warehouse code */
  byWarehouse: Record<WarehouseCode, number>;
  /** Sum across warehouses (server-computed, may differ from sum due to commits) */
  totalAvailable: number;
}

export const WAREHOUSES = [
  "sindos",
  "benizelou",
  "antistaseos",
  "beinoglou",
] as const;
export type WarehouseCode = (typeof WAREHOUSES)[number];

export interface ErpCustomer {
  erpId: string;
  /** Entersoft personGID (the person, regardless of trade account) */
  personId: string;
  code: string;
  name: string;
  vat: string | null;
  email: string | null;
  phone: string | null;
  salesman: string | null;
  inactive: boolean;
  balanceLimit: number;
  invoicePolicy: string | null;
  lastModified: string | null;
}

export interface ErpCustomerSite {
  erpId: string;
  /** Foreign key to ErpCustomer.erpId */
  customerErpId: string;
  customerCode: string;
  customerName: string;
  address: string | null;
  countryCode: string | null;
  districtCode: string | null;
  cityCode: string | null;
  area: string | null;
  postalCode: string | null;
  phone: string | null;
  vat: string | null;
  isMainAddress: boolean;
  active: boolean;
  lastModified: string | null;
}

export interface PageResult<T> {
  rows: T[];
  /** Total rows on the server (across all pages) */
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Single contract every ERP adapter implements.
 * Today: EntersoftAdapter.
 * Tomorrow: OdooAdapter.
 */
export interface IErpAdapter {
  readonly name: "entersoft" | "odoo";

  listProducts(opts?: {
    page?: number;
    pageSize?: number;
    modifiedSince?: Date;
  }): Promise<PageResult<ErpProduct>>;
  listPrices(opts?: {
    page?: number;
    pageSize?: number;
    modifiedSince?: Date;
  }): Promise<
    PageResult<{
      erpItemId: string;
      sku: string;
      retail: number;
      price1: number;
      lastModified: string | null;
    }>
  >;
  listStock(opts?: {
    page?: number;
    pageSize?: number;
  }): Promise<PageResult<ErpStockLine>>;
  listCustomers(opts?: {
    page?: number;
    pageSize?: number;
    modifiedSince?: Date;
  }): Promise<PageResult<ErpCustomer>>;
  listCustomerSites(opts?: {
    page?: number;
    pageSize?: number;
    modifiedSince?: Date;
  }): Promise<PageResult<ErpCustomerSite>>;
}
