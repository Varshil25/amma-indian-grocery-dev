import React from "react";
import { FiHeart } from "react-icons/fi";
import { AiOutlineStar } from "react-icons/ai";
import { HiPlus } from "react-icons/hi";
import Aloo from "../../../assets/Images/Homepage/aloo.png"
import Brokoli from "../../../assets/Images/Homepage/brokoli.png"
import Orange from "../../../assets/Images/Homepage/orange.png"

/**
 * FeaturedProducts.tsx
 * Single-file implementation with ProductCard inner component.
 *
 * - 3 columns on desktop, 2 on tablet, 1 on mobile
 * - Simple hover, add button, badge, rating
 * - Uses a local uploaded image path so you can test immediately:
 *   /mnt/data/Frame 138.png
 *
 * Replace product.image with your real assets when ready.
 */

type Product = {
  id: string;
  category: string;
  title: string;
  weight: string;
  price: string; // display price
  priceOld?: string;
  rating: string;
  badge?: string;
  image: string;
};


const products: Product[] = [
  {
    id: "p1",
    category: "Vegetables",
    title: "Fresh Potatos",
    weight: "1.0 kg",
    price: "$8.00",
    priceOld: "$10.00",
    rating: "4.8",
    badge: "20% off",
    image: Aloo, // <-- Use direct image import, not an object
  },
  {
    id: "p2",
    category: "Vegetables",
    title: "Brokolie",
    weight: "1.0 kg",
    price: "$8.00",
    priceOld: "$10.00",
    rating: "4.8",
    badge: "20% off",
    image: Brokoli,
  },
  {
    id: "p3",
    category: "Fruits",
    title: "Oranges",
    weight: "1.0 kg",
    price: "$8.00",
    priceOld: "$10.00",
    rating: "4.8",
    badge: "20% off",
    image: Orange,
  },
];

const ProductCard: React.FC<{ p: Product }> = ({ p }) => {
  return (
    <div className="bg-white border border-black-100 rounded-2xl p-4 md:p-5 flex flex-col">
      {/* top row: badge + favorite */}
      <div className="flex justify-between items-start">
        {p.badge ? (
          <span className="inline-block bg-green-500 text-white text-[10px] font-medium px-3 py-1 rounded-full">
            {p.badge}
          </span>
        ) : (
          <div />
        )}

        <button
          aria-label="favorite"
          className="w-10 h-10 rounded-full border border-black-100 flex items-center justify-center bg-white text-gray-600 hover:bg-gray-100 transition"
        >
          <FiHeart className="w-5 h-5" />
        </button>
      </div>

      {/* image */}
      <div className="flex-1 flex items-center justify-center mt-4 mb-4">
        <img
          src={p.image}
          alt={p.title}
          className="max-h-[220px] object-contain"
          style={{ width: "auto", maxWidth: "100%" }}
        />
      </div>

      {/* meta: category + rating */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-caption text-green-500">{p.category}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 flex items-center justify-center">
            <AiOutlineStar className="text-yellow-400 w-4 h-4" fill="#fde047" style={{ color: "#fde047" }} />
          </div>
          <p className="text-lg font-medium">{p.rating}</p>
        </div>
      </div>

      {/* title + weight */}
      <div className="mt-3">
        <h3 className="text-lg md:text-xl font-medium text-[#1f1e20]">
          {p.title}
        </h3>
        <p className="text-sm text-[#69686a] mt-1">{p.weight}</p>
      </div>

      {/* price row */}
      <div className="mt-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-xl font-semibold text-[#1f1e20]">{p.price}</span>
            {p.priceOld && (
              <span className="text-base text-[#989898] line-through">{p.priceOld}</span>
            )}
          </div>
        </div>

        {/* add to cart button */}
        <button
          className="flex items-center gap-2 bg-green-50 text-green-600 rounded-full px-4 py-2 text-sm font-medium hover:bg-green-100 transition"
          aria-label={`Add ${p.title} to cart`}
        >
          <HiPlus className="w-5 h-5" />
          <span>Add</span>
        </button>
      </div>
    </div>
  );
};

const FeaturedProducts: React.FC = () => {
  return (
    <section className="w-full bg-background-secondary py-20">
      <div className="container mx-auto px-6">
        {/* header row */}
        <div className="flex items-center justify-between mb-8 gap-4">
          <div>
            <p className="text-[20px] text-text-300">Products</p>
            <h2 className="text-3xl md:text-4xl font-semibold">
              Featured <span className="text-green-600">Products</span>
            </h2>
          </div>

          <div>
            <button className="bg-green-600 text-white px-5 py-3 rounded-full flex items-center gap-2 hover:bg-green-700 transition">
              View All <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </div>

        {/* grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
