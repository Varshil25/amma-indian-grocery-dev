import React, { useState } from "react";
import PageHeader from "../../components/PageHeader";
import ProductCard from "../../pages/ProductList/ProductCard";
import { HiChevronDown } from "react-icons/hi";

// Mock products (later replace with API)
import orange from "../../assets/Images/Homepage/orange.png";
import almond from "../../assets/Images/Homepage/dry fruits.png";

const mockHotDeals = [
  {
    id: 1,
    name: "Fresh Oranges",
    category: "Fruits",
    weight: "1.0 kg",
    rating: 4.8,
    price: "8.00",
    oldPrice: "10.00",
    img: orange,
    discount: "20%",
  },
  {
    id: 2,
    name: "Almond Seeds",
    category: "Dry Fruits",
    weight: "500g",
    rating: 4.6,
    price: "15.00",
    oldPrice: "20.00",
    img: almond,
    discount: "25%",
  },
  // Add more items...
];

const HotDeals: React.FC = () => {
  const [sortOption, setSortOption] = useState("Featured");

  return (
    <>
      {/* Page Header */}
      <PageHeader
        title="Hot Deals"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Hot Deals" },
        ]}
      />

      <div className="container mx-auto px-4 py-12">

        {/* Page Title */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <h2 className="text-h4 md:text-h3 font-semibold text-text-500">
            Best Deals of the Week
          </h2>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              className="appearance-none border border-gray-300 rounded-full px-6 py-2 text-text-300 bg-white cursor-pointer"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option>Featured</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Rating</option>
            </select>
            <HiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" />
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-8 gap-y-10">
          {mockHotDeals.map((item) => (
            <div
              key={item.id}
              className="flex justify-center items-stretch transition-transform duration-200 hover:-translate-y-2"
              style={{ minWidth: 0 }} // ensures the grid doesn't overflow
            >
              <ProductCard {...item} />
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center gap-3 mt-14">
          <button className="px-4 py-2 text-gray-500 border rounded-md hover:bg-green-50 hover:text-green-700 transition shadow">
            Prev
          </button>

          <button className="w-10 h-10 bg-green-600 text-white rounded-full shadow-md">1</button>
          <button className="w-10 h-10 border rounded-full hover:bg-green-100 hover:text-green-700 transition">2</button>
          <button className="w-10 h-10 border rounded-full hover:bg-green-100 hover:text-green-700 transition">3</button>
          <span className="px-2 text-gray-500">...</span>
          <button className="w-10 h-10 border rounded-full hover:bg-green-100 hover:text-green-700 transition">10</button>

          <button className="px-4 py-2 text-gray-500 border rounded-md hover:bg-green-50 hover:text-green-700 transition shadow">
            Next
          </button>
        </div>
      </div>
    </>
  );
};

export default HotDeals;
