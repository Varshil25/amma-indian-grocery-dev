import React from "react";
import PageHeader from "../../components/PageHeader";
import ProductCard from "../ProductList/ProductCard";
import Pagination from "../../components/Pagination";
import SEO from "../../components/SEO";
import { HiChevronDown } from "react-icons/hi";
import { useSearchParams } from "react-router-dom";
import { useProducts } from "../../hooks/use-products";
import { mapProductToCard } from "../../lib/product-helpers";

// Fallback mock
import orange from "../../assets/Images/Homepage/orange.png";
import almond from "../../assets/Images/Homepage/dry fruits.png";
const mockHotDeals = [
  { id: 1, name: "Fresh Oranges", category: "Fruits", weight: "1.0 kg", rating: 4.8, price: "8.00", oldPrice: "10.00", img: orange, discount: "20%" },
  { id: 2, name: "Almond Seeds", category: "Dry Fruits", weight: "500g", rating: 4.6, price: "15.00", oldPrice: "20.00", img: almond, discount: "25%" },
];

const sortOptions = [
  { value: "", label: "Featured" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Rating" },
];

const HotDeals: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1");
  const sort = searchParams.get("sort") || "";

  const { data, isLoading, isError } = useProducts({
    onSale: "true",
    page,
    sort: sort || undefined,
    limit: 20,
  });

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set("sort", value);
    else params.delete("sort");
    params.delete("page");
    setSearchParams(params);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(newPage));
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <SEO
        title="Hot Deals"
        description="Save big on authentic Indian groceries. Check out our latest deals on spices, snacks, and fresh produce."
        keywords="indian grocery deals, discount spices, grocery offers, sale"
      />
      <PageHeader
        title="Hot Deals"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Hot Deals" }]}
      />

      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <div>
            <h2 className="text-h4 md:text-h3 font-semibold text-text-500">
              Best Deals of the Week
            </h2>
            {data?.pagination && (
              <p className="text-body-sm text-text-200 mt-1">{data.pagination.total} deals</p>
            )}
          </div>

          <div className="relative">
            <select
              className="appearance-none border border-text-100 rounded-full px-6 py-2 text-text-300 bg-white cursor-pointer pr-10"
              value={sort}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <HiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-text-200 pointer-events-none" />
          </div>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-8 gap-y-10">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex justify-center">
                <div className="w-[280px] h-[380px] bg-background-secondary rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-8 gap-y-10">
            {mockHotDeals.map((item) => (
              <div key={item.id} className="flex justify-center items-stretch">
                <ProductCard {...item} />
              </div>
            ))}
          </div>
        )}

        {data && !isLoading && (
          <>
            {data.products.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-text-300 text-body-lg">No deals available right now. Check back soon!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-8 gap-y-10">
                {data.products.map((product) => (
                  <div key={product.id} className="flex justify-center items-stretch transition-transform duration-200 hover:-translate-y-2">
                    <ProductCard {...mapProductToCard(product)} />
                  </div>
                ))}
              </div>
            )}

            <Pagination
              currentPage={data.pagination.page}
              totalPages={data.pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
    </>
  );
};

export default HotDeals;
