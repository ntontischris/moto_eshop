import { describe, it, expect } from "vitest";
import el from "../../messages/el.json";
import en from "../../messages/en.json";
import bg from "../../messages/bg.json";
import sr from "../../messages/sr.json";
import ro from "../../messages/ro.json";
import sq from "../../messages/sq.json";

const flat = (o: object, p = ""): string[] =>
  Object.entries(o).flatMap(([k, v]) =>
    v && typeof v === "object" ? flat(v, `${p}${k}.`) : [`${p}${k}`],
  );

describe("message catalogs", () => {
  const base = flat(el).sort();
  it.each([
    ["en", en],
    ["bg", bg],
    ["sr", sr],
    ["ro", ro],
    ["sq", sq],
  ])("%s has the same keys as el", (_name, cat) => {
    expect(flat(cat).sort()).toEqual(base);
  });
});
