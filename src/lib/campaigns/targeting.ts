import type { Signals } from "./signals";

export interface Condition {
  field: "source" | "device" | "country";
  op: "eq" | "neq" | "in";
  value: string | string[];
}

function isCondition(r: unknown): r is Condition {
  if (typeof r !== "object" || r === null) return false;
  const rec = r as Record<string, unknown>;
  return (
    (rec.field === "source" ||
      rec.field === "device" ||
      rec.field === "country") &&
    (rec.op === "eq" || rec.op === "neq" || rec.op === "in") &&
    (typeof rec.value === "string" || Array.isArray(rec.value))
  );
}

export function parseRules(raw: unknown): Condition[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isCondition);
}

function fieldValue(
  field: Condition["field"],
  signals: Signals,
): string | null {
  if (field === "source") return signals.source;
  if (field === "device") return signals.device;
  return signals.country;
}

function evalCondition(c: Condition, signals: Signals): boolean {
  const v = fieldValue(c.field, signals);
  if (c.op === "in") {
    const arr = Array.isArray(c.value) ? c.value : [c.value];
    return v !== null && arr.includes(v);
  }
  const target = Array.isArray(c.value) ? c.value[0] : c.value;
  if (c.op === "neq") return v !== target;
  return v === target; // eq
}

/** All conditions must match (AND). An empty rule set never matches. */
export function matchesRules(rules: Condition[], signals: Signals): boolean {
  if (rules.length === 0) return false;
  return rules.every((c) => evalCondition(c, signals));
}
