"use client";

import { useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { isRouteAllowed } from "@/lib/chat/tools/navigate-to";
import {
  buildFilterSearchParams,
  isFilterContextAllowed,
  type ChatFilters,
} from "@/lib/chat/tools/apply-filters";

export type CoPilotResult<T extends object = object> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

interface ResolveNavInput {
  route: string;
  locale: string;
  currentPath: string;
}

export function resolveNavigateTo(
  input: ResolveNavInput,
): CoPilotResult<{ target: string }> {
  if (!isRouteAllowed(input.route)) {
    return { ok: false, error: "forbidden route" };
  }
  // Detect existing /<two-letter-locale> prefix (any locale, e.g. /en/product/foo).
  const hasLocalePrefix = /^\/[a-z]{2}(\/|$)/.test(input.route);
  const localePrefix = `/${input.locale}`;
  const target = hasLocalePrefix
    ? input.route
    : `${localePrefix}${input.route === "/" ? "" : input.route}`;
  return { ok: true, target };
}

interface ResolveFiltersInput {
  filters: ChatFilters;
  currentPath: string;
}

export function resolveApplyFilters(
  input: ResolveFiltersInput,
): CoPilotResult<{ target: string; appliedKeys: string[] }> {
  if (!isFilterContextAllowed(input.currentPath)) {
    return {
      ok: false,
      error:
        "filters are only valid on /category/* pages — navigate there first",
    };
  }
  const params = buildFilterSearchParams(input.filters);
  const appliedKeys = Object.entries(input.filters)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k]) => k);
  const target = `${input.currentPath}?${params.toString()}`;
  return { ok: true, target, appliedKeys };
}

/**
 * Client hook used by the chat provider to execute navigateTo / applyFilters
 * tool calls coming from the stream.
 */
export function useCoPilot() {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const locale = useLocale();

  const navigate = useCallback(
    (route: string): CoPilotResult<{ route: string }> => {
      const r = resolveNavigateTo({ route, locale, currentPath: pathname });
      if (!r.ok) return r;
      router.push(r.target);
      return { ok: true, route: r.target };
    },
    [locale, pathname, router],
  );

  const applyFilters = useCallback(
    (filters: ChatFilters): CoPilotResult<{ appliedKeys: string[] }> => {
      const r = resolveApplyFilters({ filters, currentPath: pathname });
      if (!r.ok) return r;
      router.replace(r.target);
      return { ok: true, appliedKeys: r.appliedKeys };
    },
    [pathname, router],
  );

  return { navigate, applyFilters };
}
