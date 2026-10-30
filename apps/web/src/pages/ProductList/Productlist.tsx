import React from "react";
import PageHeader from "../../components/PageHeader";
import ProductCard from "./ProductCard";
import Pagination from "../../components/Pagination";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useProducts, type ProductQueryParams } from "../../hooks/use-products";
import { mapProductToCard } from "../../lib/product-helpers";
import { useCategories } from "../../hooks/use-categories";
import SEO from "../../components/SEO";

const sortOptions = [
  { value: "", label: "Sort by" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name_asc", label: "Name: A to Z" },
  { value: "name_desc", label: "Name: Z to A" },
  { value: "rating", label: "Top Rated" },
  { value: "newest", label: "Newest" },
];

const ProductList: React.FC = () => {
  const { category } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1");
  const sort = searchParams.get("sort") || "";
  // The header search box sends shoppers to /categories/all?search=…
  const search = (searchParams.get("search") || "").trim();
  const isAll = !category || category === "all";

  const queryParams: ProductQueryParams = {
    category: isAll ? undefined : category,
    search: search || undefined,
    page,
    sort: sort || undefined,
    limit: 20,
  };

  const { data, isLoading, isError, error, refetch } = useProducts(queryParams);
  const { data: categories } = useCategories();
  const categoryInfo = categories
    ?.flatMap((c) => [c, ...(c.children || [])])
    .find((c) => c.slug === category);

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("sort", value);
    } else {
      params.delete("sort");
    }
    params.delete("page");
    setSearchParams(params);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(newPage));
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const categoryName = isAll ? "All Products" : categoryInfo?.name || category!.replace(/-/g, " ");
  const categoryLabel = search ? `Results for “${search}”` : categoryName;
  const unknownCategory = !isAll && !!categories && !categoryInfo;

  return (
    <>
      <SEO title={categoryLabel} description={categoryInfo?.description || `Shop ${categoryLabel} at Amma Indian Grocery.`} />
      <PageHeader
        title={categoryLabel}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "All Categories", href: "/all-categories" },
          { label: categoryName },
        ]}
      />

      <div className="container mx-auto px-4 my-14">
        {/* Top controls */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className={`text-h4 text-text-500 font-semibold ${search ? "" : "capitalize"}`}>
              {categoryLabel}
            </h2>
            {data?.pagination && (
              <p className="text-body-sm text-text-200 mt-1">
                {data.pagination.total} products found
              </p>
            )}
          </div>

          <select
            className="border border-text-100 rounded-lg px-4 py-2 text-sm text-text-300"
            value={sort}
            onChange={(e) => handleSortChange(e.target.value)}
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8 justify-center">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex justify-center">
                <div className="w-[280px] h-[380px] bg-background-secondary rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="text-center py-20">
            <p className="text-text-300 text-body-lg mb-4">
              {(error as Error)?.message || "We couldn't load products right now."}
            </p>
            <button onClick={() => refetch()} className="btn-primary">
              Try again
            </button>
          </div>
        )}

        {/* API data */}
        {data && !isLoading && (
          <>
            {data.products.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-text-300 text-body-lg">
                  {search
                    ? `No products match “${search}”.`
                    : unknownCategory
                      ? "This category doesn't exist."
                      : isAll
                        ? "No products yet."
                        : "No products in this category yet."}
                </p>
                <Link to="/all-categories" className="text-green-600 hover:underline mt-2 inline-block">
                  Browse all categories
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8 justify-center">
                {data.products.map((product) => (
                  <div className="flex justify-center" key={product.id}>
                    <ProductCard {...mapProductToCard(product)} />
                  </div>
                ))}
              </div>
            )}

            {data.pagination.totalPages > 1 && <Pagination
              currentPage={data.pagination.page}
              totalPages={data.pagination.totalPages}
              onPageChange={handlePageChange}
            />}
          </>
        )}
      </div>
    </>
  );
};

export default ProductList;
