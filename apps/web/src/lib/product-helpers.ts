import type { ProductListItem } from "../hooks/use-products";

export function mapProductToCard(p: ProductListItem) {
  const inStock = p.inventory
    ? p.inventory.stockQuantity - p.inventory.reservedQuantity > 0
    : true;

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category?.name,
    unit: p.unit !== "each" ? `${p.unitValue || ""} ${p.unit}`.trim() : undefined,
    price: p.price,
    compareAtPrice: p.compareAtPrice || undefined,
    avgRating: p.avgRating,
    imageUrl: p.images?.[0]?.url,
    isOnSale: p.isOnSale,
    inStock,
  };
}
