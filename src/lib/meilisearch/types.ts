export interface SearchDocument {
  id: string;
  slug: string;
  name: string;
  brand: string;
  brand_slug: string;
  category_name: string;
  category_slug: string;
  description: string;
  sku: string;
  price: number;
  compare_at_price: number | null;
  rating: number | null;
  review_count: number;
  in_stock: boolean;
  stock: number;
  certification: string | null;
  rider_type: string | null;
  primary_image_url: string;
  primary_image_alt: string;
  created_at: string;
  updated_at: string;
}

export interface SearchHit extends SearchDocument {
  _formatted?: Partial<SearchDocument>;
  _rankingScore?: number;
}

export interface SearchFacets {
  brand_slug?: Record<string, number>;
  category_slug?: Record<string, number>;
  certification?: Record<string, number>;
  rider_type?: Record<string, number>;
}
