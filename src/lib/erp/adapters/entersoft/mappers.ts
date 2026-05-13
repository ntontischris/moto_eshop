import type {
  ErpCustomer,
  ErpCustomerSite,
  ErpProduct,
  ErpStockLine,
  WarehouseCode,
} from "../../types";
import type {
  RawCustomer,
  RawCustomerSite,
  RawItem,
  RawPrice,
  RawStock,
} from "./raw-types";

const WILDCARD_DATE = "2020-01-01";
export const FAR_FUTURE_DATE = "2026-12-31";
export const FAR_PAST_DATE = WILDCARD_DATE;

/** Build the family/group hierarchy path (e.g. ["02","02.01"]). */
function buildCategoryPath(row: RawItem): string[] {
  const path: string[] = [];
  if (row.ItemFamily) path.push(row.ItemFamily);
  if (row.ItemGroup && row.ItemGroup !== row.ItemFamily)
    path.push(row.ItemGroup);
  if (row.ItemCategory) path.push(row.ItemCategory);
  if (row.ItemSubcategory) path.push(row.ItemSubcategory);
  return path;
}

function splitBarcodes(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function splitDims(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function mapItem(row: RawItem): ErpProduct {
  return {
    erpId: row.ItemGID,
    sku: row.Code.trim(),
    barcodes: splitBarcodes(row.MultipleCode),
    categoryPath: buildCategoryPath(row),
    brand: row.Brand?.trim() || null,
    retailPrice: Number(row.RetailPrice ?? 0),
    wholesalePrice: row.Price1 != null ? Number(row.Price1) : null,
    publishable: row.WEB === 1 && row.Inactive === 0,
    inactive: row.Inactive === 1,
    stockDimensions: splitDims(row.fStockDimCode_comma_separated),
    hasMissingFields: row.MissingFields === 1,
    lastModified: null, // AppItems PQ doesn't expose this — use ItemPrices
  };
}

export function mapPrice(row: RawPrice): {
  erpItemId: string;
  sku: string;
  retail: number;
  price1: number;
  lastModified: string | null;
} {
  return {
    erpItemId: row.ItemGID,
    sku: row.Code.trim(),
    retail: Number(row.RetailPrice ?? 0),
    price1: Number(row.Price1 ?? 0),
    lastModified: row.LastModifiedDate2 ?? row.HDate ?? null,
  };
}

export function mapStock(row: RawStock): ErpStockLine {
  const byWh: Record<WarehouseCode, number> = {
    sindos: Number(row.Sindos_diathesimo ?? 0),
    benizelou: Number(row.Benizelou_diathesimo ?? 0),
    antistaseos: Number(row.Antistaseos_diathesimo ?? 0),
    beinoglou: Number(row.AvailableBeinoglou ?? 0),
  };
  return {
    erpItemCode: row.Code.trim(),
    dimension: row.fStockDimCode?.trim() || null,
    byWarehouse: byWh,
    totalAvailable: Number(row.diathesimo ?? 0),
  };
}

export function mapCustomer(row: RawCustomer): ErpCustomer {
  return {
    erpId: row.TradeAccountGID,
    personId: row.fPersonCodeGID,
    code: row.Code,
    name: row.Name,
    vat: row.TaxRegistrationNumber || null,
    email: row.EMailAddress?.trim() || null,
    phone: row.Telephone?.trim() || null,
    salesman: row.SalesmanCode || null,
    inactive: row.Inactive === 1,
    balanceLimit: Number(row.BalanceLimit ?? 0),
    invoicePolicy: row.InvoicePolicy || null,
    lastModified: row.LastModifiedDate ?? null,
  };
}

export function mapCustomerSite(row: RawCustomerSite): ErpCustomerSite {
  return {
    erpId: row.GID,
    customerErpId: row.TradeAccountGID,
    customerCode: row.TradeAccountCode,
    customerName: row.TradeAccountName,
    address: row.Address || null,
    countryCode: row.fCountryCode || null,
    districtCode: row.fDistrictCode || null,
    cityCode: row.fCityCode || null,
    area: row.Area || null,
    postalCode: row.fPostalCode || null,
    phone: row.Telephone || null,
    vat: row.TaxRegistrationNumber || null,
    isMainAddress: row.MainAddress === 1,
    active: row.Status === 1,
    lastModified: row.LastModifiedDate ?? null,
  };
}
