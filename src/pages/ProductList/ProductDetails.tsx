import React, { useState } from "react";
import PageHeader from "../../components/PageHeader";
import { HiMinus, HiPlus } from "react-icons/hi";
import { AiFillStar } from "react-icons/ai";
import { useParams } from "react-router-dom";
import orange from "../../assets/Images/Homepage/orange.png"
import BestSeller from "../Home/components/BestSeller";

const ProductDetails: React.FC = () => {
  const { productId } = useParams();
  const [qty, setQty] = useState(1);

  // Mock product (later replace w/ API)
  const product = {
    id: productId,
    category: "Vegetables & Fruits",
    title: "Fresh Oranges",
    price: 8.0,
    oldPrice: 10.0,
    rating: 4.8,
    weight: "1.0 kg",
    description:
      "Freshness you can trust, prices you’ll love, everything you need, all in one place. Wholesome food your family can rely on every single day.",
    image: orange,
  };

  return (
    <>
      <PageHeader
        title={product.title}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "All Categories", href: "/all-categories" },
          { label: product.category, href: `/categories/${product.category.toLowerCase()}` },
          { label: product.title },
        ]}
      />

      <div className="container mx-auto px-4 py-14">
        <div className="flex flex-col lg:flex-row gap-10 justify-between">

          {/* IMAGE BOX */}
          <div className="w-full lg:w-[480px]">
            <img
              src={product.image}
              alt={product.title}
              className="w-full h-[480px] object-contain border border-gray-200 rounded-xl bg-white p-4"
            />
          </div>

          {/* PRODUCT INFO */}
          <div className="w-full lg:w-[590px]">
            
            {/* Category */}
            <p className="text-green-700 text-base font-normal mb-2">{product.category}</p>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-semibold text-text-500 mb-3">
              {product.title}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              {Array(5)
                .fill(null)
                .map((_, i) => (
                  <AiFillStar key={i} className="text-yellow-400 text-2xl" />
                ))}
              <span className="text-xl font-medium">{product.rating}</span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-2xl font-semibold text-text-500">
                ${product.price.toFixed(2)}
              </span>
              <span className="text-2xl font-medium line-through text-gray-400">
                ${product.oldPrice.toFixed(2)}
              </span>
            </div>

            {/* Description */}
            <p className="text-gray-600 text-lg leading-relaxed mb-6">
              {product.description}
            </p>

            {/* Weight */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-lg text-black font-medium bg-gray-100 px-4 py-2 rounded-md border border-gray-200">
                {product.weight}
              </span>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-4 mb-8">
              <button
                className="w-10 h-10 border border-gray-300 rounded flex items-center justify-center bg-gray-50 hover:bg-gray-100"
                onClick={() => setQty(qty > 1 ? qty - 1 : 1)}
              >
                <HiMinus className="text-gray-600" size={20} />
              </button>

              <span className="text-2xl font-semibold text-green-700">{qty}</span>

              <button
                className="w-10 h-10 border border-gray-300 rounded flex items-center justify-center bg-gray-50 hover:bg-gray-100"
                onClick={() => setQty(qty + 1)}
              >
                <HiPlus className="text-green-700" size={20} />
              </button>
            </div>

            {/* Add to Cart Button */}
            <button className="w-full h-[55px] bg-green-50 border border-green-700 text-green-700 text-lg font-medium rounded-xl hover:bg-green-700 hover:text-white transition">
              Add to Cart
            </button>
          </div>
        </div>
      </div>
      <BestSeller/>
    </>
  );
};

export default ProductDetails;
