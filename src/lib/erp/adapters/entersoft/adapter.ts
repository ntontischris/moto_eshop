/**
 * EntersoftAdapter — implements IErpAdapter on top of Entersoft Public Queries.
 *
 * Wildcard convention: Entersoft PQs reject missing parameters; we send "*"
 * (URL-encoded by the client) to mean "no filter".
 */

import type {
  ErpCustomer,
  ErpCustomerSite,
  ErpProduct,
  ErpStockLine,
  IErpAdapter,
  PageResult,
} from "../../types";
import {
  EntersoftClient,
  type EntersoftClientOpts,
  type EsPagedResponse,
} from "./client";
import {
  FAR_FUTURE_DATE,
  FAR_PAST_DATE,
  mapCustomer,
  mapCustomerSite,
  mapItem,
  mapPrice,
  mapStock,
} from "./mappers";
import type {
  RawCustomer,
  RawCustomerSite,
  RawItem,
  RawPrice,
  RawStock,
} from "./raw-types";

const WILDCARD = "*";

function isoDate(d?: Date): string {
  if (!d) return FAR_PAST_DATE;
  return d.toISOString().slice(0, 10);
}

export class EntersoftAdapter implements IErpAdapter {
  readonly name = "entersoft" as const;
  private readonly client: EntersoftClient;

  constructor(opts: EntersoftClientOpts) {
    this.client = new EntersoftClient(opts);
  }

  private resultFrom<T, U>(
    resp: EsPagedResponse<T>,
    map: (row: T) => U,
  ): PageResult<U> {
    return {
      rows: resp.Rows.map(map),
      total: resp.Count,
      page: resp.Page,
      pageSize: resp.PageSize,
    };
  }

  async listProducts(
    opts: { page?: number; pageSize?: number; modifiedSince?: Date } = {},
  ): Promise<PageResult<ErpProduct>> {
    const resp = await this.client.pq<RawItem>(
      "ESPORTAL_CS_AppItems",
      {
        Code: WILDCARD,
        ModifiedDateTimeFrom: isoDate(opts.modifiedSince),
        ModifiedDateTimeTo: FAR_FUTURE_DATE,
        ItemGID: WILDCARD,
        AssemblyType: WILDCARD,
        MissingFields: WILDCARD,
        ItemFamily_param: WILDCARD,
        ItemGroup_param: WILDCARD,
        ItemCategory_param: WILDCARD,
        ItemSubcategory_param: WILDCARD,
      },
      { page: opts.page ?? 1, pageSize: opts.pageSize ?? 200 },
    );
    return this.resultFrom(resp, mapItem);
  }

  async listPrices(
    opts: { page?: number; pageSize?: number; modifiedSince?: Date } = {},
  ): Promise<
    PageResult<{
      erpItemId: string;
      sku: string;
      retail: number;
      price1: number;
      lastModified: string | null;
    }>
  > {
    const resp = await this.client.pq<RawPrice>(
      "ESPORTAL_CS_ItemPrices",
      {
        Code: WILDCARD,
        ModifiedDateTimeFrom: isoDate(opts.modifiedSince),
        ModifiedDateTimeTo: FAR_FUTURE_DATE,
        ItemGID: WILDCARD,
      },
      { page: opts.page ?? 1, pageSize: opts.pageSize ?? 500 },
    );
    return this.resultFrom(resp, mapPrice);
  }

  async listStock(
    opts: { page?: number; pageSize?: number } = {},
  ): Promise<PageResult<ErpStockLine>> {
    const resp = await this.client.pq<RawStock>(
      "ESPORTAL_CS_AppStockStatus",
      {
        Code: WILDCARD,
        ItemGID: WILDCARD,
        fStockDimCode: WILDCARD,
        WHCode: WILDCARD,
        Inactive: WILDCARD,
      },
      { page: opts.page ?? 1, pageSize: opts.pageSize ?? 500 },
    );
    return this.resultFrom(resp, mapStock);
  }

  async listCustomers(
    opts: { page?: number; pageSize?: number; modifiedSince?: Date } = {},
  ): Promise<PageResult<ErpCustomer>> {
    const resp = await this.client.pq<RawCustomer>(
      "ESPORTAL_CS_Customers",
      {
        LastModifiedDateFrom: isoDate(opts.modifiedSince),
        LastModifiedDateTo: FAR_FUTURE_DATE,
        Code: WILDCARD,
        TradeaccountGID: WILDCARD,
        EMailAddress: WILDCARD,
      },
      { page: opts.page ?? 1, pageSize: opts.pageSize ?? 500 },
    );
    return this.resultFrom(resp, mapCustomer);
  }

  async listCustomerSites(
    opts: { page?: number; pageSize?: number; modifiedSince?: Date } = {},
  ): Promise<PageResult<ErpCustomerSite>> {
    const resp = await this.client.pq<RawCustomerSite>(
      "ESPORTAL_CS_AppCustomesSites",
      {
        TradeAccountCode: WILDCARD,
        TradeAccountGID: WILDCARD,
        LastModifiedDateFrom: isoDate(opts.modifiedSince),
        LastModifiedDateTo: FAR_FUTURE_DATE,
      },
      { page: opts.page ?? 1, pageSize: opts.pageSize ?? 500 },
    );
    return this.resultFrom(resp, mapCustomerSite);
  }
}
