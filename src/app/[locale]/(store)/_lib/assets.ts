/* Curated existing assets reused for the storefront.
   Higgsfield CloudFront host is already allow-listed in next.config.ts.
   Hero poster is local (same-origin) — it is the LCP element. */

export const HERO_POSTER = "/hero-variants/motomarket-race-control-hero.webp";
export const HERO_POSTER_MOBILE =
  "/hero-variants/motomarket-race-control-mobile.webp";

const HF =
  "https://d8j0ntlcm91z4.cloudfront.net/user_34y7dNWX6no0cgRVdzxt5wPZ7a9";

export const PHOTO = {
  helmet: `${HF}/hf_20260514_221743_1484ba42-ca46-4960-8b77-9b2bbf96a170.png`,
  apparel: `${HF}/hf_20260514_221746_659359f4-a320-4ed7-be27-13541266b3f0.png`,
  tyre: `${HF}/hf_20260514_221748_08b16e98-6249-4149-9195-a510bc9e7129.png`,
  exhaust: `${HF}/hf_20260514_221751_e6e8212c-73bb-4488-a00c-61082063cd88.png`,
  editorial: `${HF}/hf_20260514_221754_ef8b651f-c39f-45b2-9e8a-c0e1bc35c080.png`,
  helmetFront: `${HF}/hf_20260514_223028_00bb63be-af54-458c-9910-43afd9f17bef.png`,
  topCase: `${HF}/hf_20260514_223040_3d63efb5-4105-49a4-b438-c43277b8a5f9.png`,
} as const;
