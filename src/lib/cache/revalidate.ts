"use server";

import { revalidateTag } from "next/cache";

export type ContentTag =
  | "categories"
  | "brands"
  | "products"
  | "reviews"
  | "banners"
  | "settings";

export async function revalidateContent(...tags: ContentTag[]) {
  for (const tag of tags) {
    revalidateTag(tag);
  }
}
