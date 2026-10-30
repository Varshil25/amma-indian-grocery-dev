import type { ProductListItem } from "../hooks/use-products";

/** Neutral image used when a product has no photo yet (works under any base path). */
export const PLACEHOLDER_IMAGE = `${import.meta.env.BASE_URL}placeholder.svg`;

export function formatUnit(unit?: string, unitValue?: string | number | null) {
  if (!unit || unit === "each") return undefined;
  return `${unitValue ?? ""} ${unit}`.trim();
}

export function mapProductToCard(p: ProductListItem) {
  const inStock = p.inventory
    ? p.inventory.stockQuantity - p.inventory.reservedQuantity > 0
    : true;

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category?.name,
    unit: formatUnit(p.unit, p.unitValue),
    price: p.price,
    compareAtPrice: p.compareAtPrice || undefined,
    avgRating: p.avgRating,
    reviewCount: p.reviewCount ?? 0,
    imageUrl: p.images?.[0]?.url || PLACEHOLDER_IMAGE,
    isOnSale: p.isOnSale,
    inStock,
  };
}
