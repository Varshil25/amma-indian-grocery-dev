import { getSquareClient, getLocationId } from "../config/square.js";
import prisma from "../config/database.js";
import { BadRequestError } from "../middleware/errorHandler.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Helper: convert dollars to Square cents (BigInt)
function toCents(dollars: number | string): bigint {
  return BigInt(Math.round(Number(dollars) * 100));
}

// Helper: convert Square cents to dollars
function fromCents(cents: bigint | number | string | undefined): number {
  if (cents === undefined || cents === null) return 0;
  return Number(cents) / 100;
}

// Helper: generate a URL-friendly slug from a name
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export class PosService {
  // ─── Push online order to Square POS ───
  async pushOrderToSquare(orderId: string) {
    const client = getSquareClient();
    if (!client) return { synced: false, reason: "Square not configured" };

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    if (!order) throw new BadRequestError("Order not found");

    try {
      const lineItems = order.items.map((item) => ({
        name: item.productName,
        quantity: String(item.quantity),
        basePriceMoney: {
          amount: toCents(Number(item.unitPrice)),
          currency: "USD" as const,
        },
      }));

      const response: any = await client.orders.create({
        order: {
          locationId: getLocationId(),
          referenceId: order.orderNumber,
          lineItems,
        },
        idempotencyKey: `order-${order.id}`,
      });

      const squareOrderId = response.order?.id;

      if (squareOrderId) {
        await prisma.order.update({
          where: { id: orderId },
          data: { posOrderId: squareOrderId },
        });
      }

      return { synced: true, squareOrderId };
    } catch (err) {
      console.error("Square order push failed:", err);
      return { synced: false, reason: "Square API error" };
    }
  }

  // ─── Sync inventory from Square to DB ───
  async syncInventoryFromSquare() {
    const client = getSquareClient();
    if (!client) return { synced: false, reason: "Square not configured" };

    try {
      const catalogItems: any[] = [];
      const catalogPage: any = await client.catalog.list({ types: "ITEM" });
      if (catalogPage?.data) {
        catalogItems.push(...catalogPage.data);
      } else if (Array.isArray(catalogPage)) {
        catalogItems.push(...catalogPage);
      }

      let syncedCount = 0;

      for (const item of catalogItems) {
        if (item.type !== "ITEM" || !item.itemData?.variations) continue;

        for (const variation of item.itemData.variations) {
          const sku = variation.itemVariationData?.sku;
          if (!sku || !variation.id) continue;

          const product = await prisma.product.findFirst({ where: { sku } });
          if (!product) continue;

          // Get inventory count
          const inventoryResponse: any = await client.inventory.batchGetCounts({
            catalogObjectIds: [variation.id],
            locationIds: [getLocationId()],
          });

          const counts = inventoryResponse.counts || [];
          const physicalCount = counts.find((c: any) => c.state === "IN_STOCK");
          const squareQty = physicalCount?.quantity ? parseInt(physicalCount.quantity) : 0;

          const inventory = await prisma.inventory.findUnique({ where: { productId: product.id } });
          if (inventory && inventory.stockQuantity !== squareQty) {
            const previousQty = inventory.stockQuantity;
            await prisma.inventory.update({
              where: { productId: product.id },
              data: { stockQuantity: squareQty },
            });

            await prisma.inventoryAdjustment.create({
              data: {
                inventoryId: inventory.id,
                type: "POS_SYNC",
                quantity: squareQty - previousQty,
                previousQty,
                newQty: squareQty,
                reason: "Square POS inventory sync",
              },
            });

            syncedCount++;
          }
        }
      }

      return { synced: true, syncedCount };
    } catch (err) {
      console.error("Square inventory sync failed:", err);
      return { synced: false, reason: "Square API error" };
    }
  }

  // ─── Import full catalog from Square → DB ───
  async importCatalogFromSquare() {
    const client = getSquareClient();
    if (!client) return { imported: false, reason: "Square not configured" };

    try {
      // 1. Fetch all ITEM and CATEGORY objects from Square
      const squareItems: any[] = [];
      const squareCategories: any[] = [];

      const itemPage: any = await client.catalog.list({ types: "ITEM" });
      if (itemPage?.data) squareItems.push(...itemPage.data);
      else if (Array.isArray(itemPage)) squareItems.push(...itemPage);

      const catPage: any = await client.catalog.list({ types: "CATEGORY" });
      if (catPage?.data) squareCategories.push(...catPage.data);
      else if (Array.isArray(catPage)) squareCategories.push(...catPage);

      // 2. Map Square categories → local categories
      const categoryMap: Record<string, string> = {}; // squareCatId → local categoryId

      for (const sqCat of squareCategories) {
        const catName = sqCat.categoryData?.name;
        if (!catName) continue;

        const slug = slugify(catName);
        const existing = await prisma.category.findFirst({ where: { slug } });

        if (existing) {
          categoryMap[sqCat.id] = existing.id;
        } else {
          const created = await prisma.category.create({
            data: { name: catName, slug, isActive: true, isFeatured: false },
          });
          categoryMap[sqCat.id] = created.id;
        }
      }

      // 3. Ensure a fallback "Uncategorized" category
      let fallbackCategoryId: string | null = null;
      const getFallbackCategory = async () => {
        if (fallbackCategoryId) return fallbackCategoryId;
        const existing = await prisma.category.findFirst({ where: { slug: "uncategorized" } });
        if (existing) {
          fallbackCategoryId = existing.id;
        } else {
          const created = await prisma.category.create({
            data: { name: "Uncategorized", slug: "uncategorized", isActive: true },
          });
          fallbackCategoryId = created.id;
        }
        return fallbackCategoryId;
      };

      // 4. Import products
      let created = 0;
      let updated = 0;
      let skipped = 0;

      for (const item of squareItems) {
        if (item.type !== "ITEM" || !item.itemData) continue;

        const itemData = item.itemData;
        const productName = itemData.name;
        if (!productName) { skipped++; continue; }

        // Resolve category
        const squareCatIds = itemData.categories?.map((c: any) => c.id) || [];
        let localCategoryId: string | null = null;
        for (const scId of squareCatIds) {
          if (categoryMap[scId]) { localCategoryId = categoryMap[scId]; break; }
        }
        if (!localCategoryId) {
          localCategoryId = await getFallbackCategory();
        }

        // Use first variation for price/sku
        const variations = itemData.variations || [];
        const primaryVariation = variations[0];
        if (!primaryVariation) { skipped++; continue; }

        const varData = primaryVariation.itemVariationData || {};
        const sku = varData.sku || `SQ-${item.id.slice(-8)}`;
        const price = fromCents(varData.priceMoney?.amount);
        const squareCatalogId = item.id;

        // Check if product already exists (by squareCatalogId or SKU)
        const existingProduct = await prisma.product.findFirst({
          where: {
            OR: [
              { squareCatalogId },
              { sku },
            ],
          },
        });

        if (existingProduct) {
          // Update price and link
          await prisma.product.update({
            where: { id: existingProduct.id },
            data: {
              name: productName,
              price,
              squareCatalogId,
              categoryId: localCategoryId,
              description: itemData.description || existingProduct.description,
            },
          });
          updated++;
        } else {
          // Create new product
          const slug = slugify(productName);
          // Ensure unique slug
          const existingSlug = await prisma.product.findFirst({ where: { slug } });
          const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug;

          // Ensure unique SKU
          const existingSku = await prisma.product.findFirst({ where: { sku } });
          const finalSku = existingSku ? `${sku}-${Date.now()}` : sku;

          const product = await prisma.product.create({
            data: {
              name: productName,
              slug: finalSlug,
              sku: finalSku,
              description: itemData.description || "",
              categoryId: localCategoryId,
              price,
              squareCatalogId,
              isActive: true,
              unit: varData.measurementUnitId ? "unit" : "each",
            },
          });

          // Create inventory record
          await prisma.inventory.create({
            data: {
              productId: product.id,
              stockQuantity: 0,
              reservedQuantity: 0,
              lowStockThreshold: 10,
              reorderPoint: 5,
            },
          });

          // Import additional variations
          for (let i = 1; i < variations.length; i++) {
            const v = variations[i];
            const vData = v.itemVariationData || {};
            const vSku = vData.sku || `${finalSku}-v${i}`;
            const vPrice = fromCents(vData.priceMoney?.amount);
            const vName = vData.name || `Variant ${i + 1}`;

            try {
              await prisma.productVariant.create({
                data: {
                  productId: product.id,
                  name: vName,
                  sku: vSku,
                  price: vPrice,
                  isActive: true,
                  sortOrder: i,
                },
              });
            } catch {
              // Skip duplicate variant SKUs
            }
          }

          created++;
        }

        // Import product image if available
        const imageUrl = itemData.imageIds?.[0]
          ? await this.getSquareImageUrl(client, itemData.imageIds[0])
          : null;

        if (imageUrl && existingProduct) {
          const hasImage = await prisma.productImage.findFirst({
            where: { productId: existingProduct.id },
          });
          if (!hasImage) {
            await prisma.productImage.create({
              data: { productId: existingProduct.id, url: imageUrl, isPrimary: true },
            });
          }
        }
      }

      // 5. Also sync inventory counts
      const inventoryResult = await this.syncInventoryFromSquare();

      return {
        imported: true,
        created,
        updated,
        skipped,
        inventorySynced: inventoryResult.synced ? (inventoryResult as any).syncedCount || 0 : 0,
      };
    } catch (err) {
      console.error("Square catalog import failed:", err);
      return { imported: false, reason: String(err) };
    }
  }

  // Helper to get image URL from Square
  private async getSquareImageUrl(client: any, imageId: string): Promise<string | null> {
    try {
      const response: any = await client.catalog.object.get({ objectId: imageId });
      return response.object?.imageData?.url || null;
    } catch {
      return null;
    }
  }

  // ─── Push price update from DB → Square ───
  async pushPriceToSquare(productId: string) {
    const client = getSquareClient();
    if (!client) return { synced: false, reason: "Square not configured" };

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new BadRequestError("Product not found");
    if (!product.squareCatalogId) {
      return { synced: false, reason: "Product not linked to Square catalog" };
    }

    try {
      // Get the current catalog object to find the variation ID and version
      const catalogResponse: any = await client.catalog.object.get({
        objectId: product.squareCatalogId,
        includeRelatedObjects: true,
      });

      const catalogObject = catalogResponse.object;
      if (!catalogObject) {
        return { synced: false, reason: "Square catalog item not found" };
      }

      const variation = catalogObject.itemData?.variations?.[0];
      if (!variation) {
        return { synced: false, reason: "No variation found in Square catalog item" };
      }

      // Update the catalog item price using upsert
      await client.catalog.object.upsert({
        idempotencyKey: `price-update-${product.id}-${Date.now()}`,
        object: {
          type: "ITEM_VARIATION",
          id: variation.id,
          version: variation.version,
          itemVariationData: {
            ...variation.itemVariationData,
            priceMoney: {
              amount: toCents(Number(product.price)),
              currency: "USD",
            },
          },
        },
      });

      return { synced: true, squareCatalogId: product.squareCatalogId };
    } catch (err) {
      console.error("Square price push failed:", err);
      return { synced: false, reason: "Square API error" };
    }
  }

  // ─── Bulk push all linked product prices to Square ───
  async pushAllPricesToSquare() {
    const client = getSquareClient();
    if (!client) return { synced: false, reason: "Square not configured" };

    const linkedProducts = await prisma.product.findMany({
      where: { squareCatalogId: { not: null }, isActive: true },
    });

    let successCount = 0;
    let failCount = 0;

    for (const product of linkedProducts) {
      try {
        const result = await this.pushPriceToSquare(product.id);
        if (result.synced) successCount++;
        else failCount++;
      } catch {
        failCount++;
      }
    }

    return { synced: true, successCount, failCount, total: linkedProducts.length };
  }

  // ─── Handle Square inventory webhook ───
  async handleInventoryWebhook(body: {
    merchant_id?: string;
    data?: {
      object?: {
        inventory_counts?: Array<{ catalog_object_id: string; quantity: string; state: string }>;
      };
    };
  }) {
    const counts = body.data?.object?.inventory_counts || [];

    for (const count of counts) {
      if (count.state !== "IN_STOCK") continue;

      const client = getSquareClient();
      if (!client) continue;

      try {
        const catalogResponse: any = await client.catalog.object.get({
          objectId: count.catalog_object_id,
        });
        const sku = catalogResponse.object?.itemVariationData?.sku;
        if (!sku) continue;

        const product = await prisma.product.findFirst({ where: { sku } });
        if (!product) continue;

        const inventory = await prisma.inventory.findUnique({ where: { productId: product.id } });
        if (!inventory) continue;

        const newQty = parseInt(count.quantity) || 0;
        const previousQty = inventory.stockQuantity;

        if (previousQty !== newQty) {
          await prisma.inventory.update({
            where: { productId: product.id },
            data: { stockQuantity: newQty },
          });

          await prisma.inventoryAdjustment.create({
            data: {
              inventoryId: inventory.id,
              type: "POS_SYNC",
              quantity: newQty - previousQty,
              previousQty,
              newQty,
              reason: "Square POS webhook update",
            },
          });
        }
      } catch (err) {
        console.error("Square webhook inventory update failed:", err);
      }
    }

    return { received: true };
  }

  // ─── Handle Square catalog webhook (price changes) ───
  async handleCatalogWebhook(body: {
    type?: string;
    data?: {
      object?: {
        catalog_object?: {
          type: string;
          id: string;
          item_variation_data?: {
            sku?: string;
            price_money?: { amount: number; currency: string };
          };
          item_data?: {
            name?: string;
            variations?: Array<{
              id: string;
              item_variation_data?: {
                sku?: string;
                price_money?: { amount: number; currency: string };
              };
            }>;
          };
        };
      };
    };
  }) {
    const catalogObj = body.data?.object?.catalog_object;
    if (!catalogObj) return { received: true, updated: 0 };

    let updatedCount = 0;

    if (catalogObj.type === "ITEM_VARIATION" && catalogObj.item_variation_data) {
      const vData = catalogObj.item_variation_data;
      const sku = vData.sku;
      const newPrice = vData.price_money?.amount;

      if (sku && newPrice !== undefined) {
        const product = await prisma.product.findFirst({ where: { sku } });
        if (product) {
          await prisma.product.update({
            where: { id: product.id },
            // While a Hot Deal runs, Square's price is the regular price (parked in basePrice)
            data: product.basePrice !== null ? { basePrice: fromCents(newPrice) } : { price: fromCents(newPrice) },
          });
          updatedCount++;
        }
      }
    } else if (catalogObj.type === "ITEM" && catalogObj.item_data?.variations) {
      for (const variation of catalogObj.item_data.variations) {
        const vData = variation.item_variation_data;
        const sku = vData?.sku;
        const newPrice = vData?.price_money?.amount;

        if (sku && newPrice !== undefined) {
          const product = await prisma.product.findFirst({ where: { sku } });
          if (product) {
            await prisma.product.update({
              where: { id: product.id },
              // While a Hot Deal runs, Square's price is the regular price (parked in basePrice)
            data: product.basePrice !== null ? { basePrice: fromCents(newPrice) } : { price: fromCents(newPrice) },
            });
            updatedCount++;
          }
        }
      }
    }

    return { received: true, updated: updatedCount };
  }

  // ─── Get sync status ───
  async getSyncStatus() {
    const client = getSquareClient();

    const [lastSync, totalPosSyncs, linkedProducts, totalProducts] = await Promise.all([
      prisma.inventoryAdjustment.findFirst({
        where: { type: "POS_SYNC" },
        orderBy: { createdAt: "desc" },
      }),
      prisma.inventoryAdjustment.count({ where: { type: "POS_SYNC" } }),
      prisma.product.count({ where: { squareCatalogId: { not: null } } }),
      prisma.product.count({ where: { isActive: true } }),
    ]);

    return {
      squareConfigured: !!client,
      locationId: getLocationId() || null,
      lastSyncAt: lastSync?.createdAt || null,
      totalPosSyncs,
      linkedProducts,
      totalProducts,
    };
  }
}

export const posService = new PosService();
