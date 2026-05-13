/**
 * Raw row shapes as Entersoft returns them. Field names mirror the
 * server JSON 1:1 — do NOT camelCase here. Mapping happens in mappers.ts.
 */

export interface RawItem {
  ItemGID: string;
  Code: string;
  RetailPrice: number;
  Price1: number;
  ItemFamily: string | null;
  ItemGroup: string | null;
  ItemCategory: string | null;
  ItemSubcategory: string | null;
  Brand: string | null;
  MultipleCode: string | null;
  fStockDimCode_comma_separated: string | null;
  AssemblyType: number;
  Inactive: number;
  WEB: number;
  MissingFields: number;
  RelatedItems: string | null;
}

export interface RawPrice {
  ItemGID: string;
  Code: string;
  RetailPrice: number;
  Price1: number;
  LastModifiedDate2: string | null;
  HDate: string | null;
}

export interface RawStock {
  Code: string;
  fStockDimCode: string | null;
  diathesimo: number | null;
  Sindos_diathesimo: number | null;
  Benizelou_diathesimo: number | null;
  Antistaseos_diathesimo: number | null;
  BalanceBeinoglou: number | null;
  AvailableBeinoglou: number | null;
}

export interface RawCustomer {
  fPersonCodeGID: string;
  TradeAccountGID: string;
  Code: string;
  Name: string;
  TaxRegistrationNumber: string | null;
  EMailAddress: string | null;
  Telephone: string | null;
  SalesmanCode: string | null;
  Inactive: number;
  LastModifiedDate: string | null;
  PurchaseSpecialCodes: number;
  BalanceLimit: number;
  InvoicePolicy: string | null;
}

export interface RawCustomerSite {
  GID: string;
  TradeAccountGID: string;
  TradeAccountCode: string;
  TradeAccountName: string;
  Address: string | null;
  fCountryCode: string | null;
  fDistrictCode: string | null;
  fCityCode: string | null;
  Area: string | null;
  fPostalCode: string | null;
  Telephone: string | null;
  TaxRegistrationNumber: string | null;
  LastModifiedDate: string | null;
  MainAddress: number;
  Status: number;
  FlagField1: number;
}
