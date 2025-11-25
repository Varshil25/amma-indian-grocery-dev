import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

import { FiHeart } from "react-icons/fi";
import { AiFillStar } from "react-icons/ai";
import { HiChevronLeft, HiChevronRight, HiPlus } from "react-icons/hi";

import Aloo from "../../../assets/Images/Homepage/aloo.png";
import Brokoli from "../../../assets/Images/Homepage/brokoli.png";
import Orange from "../../../assets/Images/Homepage/orange.png";

type Product = {
  id: string;
  category: string;
  title: string;
  weight: string;
  price: string;
  priceOld?: string;
  rating: string;
  badge?: string;
  image: string;
};

const products: Product[] = [
  { id: "p1", category: "Vegetables", title: "Fresh Potatos", weight: "1.0 kg", price: "$8.00", priceOld: "$10.00", rating: "4.8", badge: "20% off", image: Aloo },
  { id: "p2", category: "Vegetables", title: "Brokolie", weight: "1.0 kg", price: "$8.00", priceOld: "$10.00", rating: "4.8", badge: "20% off", image: Brokoli },
  { id: "p3", category: "Fruits", title: "Oranges", weight: "1.0 kg", price: "$8.00", priceOld: "$10.00", rating: "4.8", badge: "20% off", image: Orange },
  { id: "p4", category: "Vegetables", title: "Fresh Onions", weight: "1.0 kg", price: "$6.00", priceOld: "$8.00", rating: "4.7", badge: "15% off", image: Aloo },
  { id: "p5", category: "Fruits", title: "Green Apples", weight: "1.0 kg", price: "$9.50", priceOld: "$11.00", rating: "4.9", badge: "10% off", image: Orange },
];

const ProductCard: React.FC<{ p: Product }> = ({ p }) => {
  return (
    <div className="bg-white border border-black-100 rounded-2xl p-4 md:p-5 flex flex-col">
      <div className="flex justify-between items-start">
        {p.badge ? (
          <span className="inline-block bg-green-500 text-white text-[10px] font-medium px-3 py-1 rounded-full">
            {p.badge}
          </span>
        ) : <div />}

        <button className="w-10 h-10 rounded-full border border-black-100 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition">
          <FiHeart className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center mt-4 mb-4">
        <img src={p.image} alt={p.title} className="max-h-[220px] object-contain" />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-caption text-green-500">{p.category}</p>

        <div className="flex items-center gap-2">
          <AiFillStar className="text-yellow-500 w-4 h-4" />
          <p className="text-lg font-medium">{p.rating}</p>
        </div>
      </div>

      <div className="mt-3">
        <h3 className="text-lg md:text-xl font-medium text-text-500">{p.title}</h3>
        <p className="text-sm text-text-300 mt-1">{p.weight}</p>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl font-semibold text-text-500">{p.price}</span>
          {p.priceOld && <span className="text-base text-text-300 line-through">{p.priceOld}</span>}
        </div>

        <button className="flex items-center gap-2 bg-green-50 text-green-600 rounded-full px-4 py-2 text-sm font-medium hover:bg-green-100 transition">
          <HiPlus className="w-5 h-5" />
          Add
        </button>
      </div>
    </div>
  );
};

const BestSeller = () => {
  return (
    <section className="w-full bg-background-secondary py-20 select-none">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-caption text-text-300">Best</p>
            <h2 className="text-body2 md:text-4xl font-semibold">
              Best <span className="text-green-500">Seller</span>
            </h2>
          </div>
          <button
            className="bg-green-500 text-white px-4 py-2 text-sm rounded-full hover:bg-green-700 flex items-center gap-2 sm:px-5 sm:py-3 sm:text-base"
          >
            View All
            <HiChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Swiper + Nav Buttons in a relative wrapper */}
        <div className="relative">
          {/* Navigation Buttons */}
         {/* Prev Button - Same position style as Categories */}
<button
  className="featured-prev absolute -left-6 md:-left-10 top-1/2 -translate-y-1/2 z-20 
  bg-white shadow-md w-10 h-10 rounded-full flex items-center justify-center 
  hover:bg-green-500 hover:text-white transition hidden sm:flex"
  type="button"
  aria-label="Previous"
>
  <HiChevronLeft className="text-xl" />
</button>

{/* Next Button */}
<button
  className="featured-next absolute -right-6 md:-right-10 top-1/2 -translate-y-1/2 z-20 
  bg-white shadow-md w-10 h-10 rounded-full flex items-center justify-center 
  hover:bg-green-500 hover:text-white transition hidden sm:flex"
  type="button"
  aria-label="Next"
>
  <HiChevronRight className="text-xl" />
</button>


          {/* Swiper */}
          <Swiper
            modules={[Navigation, Autoplay]}
            autoplay={{ delay: 2500, disableOnInteraction: false }}
            navigation={{ nextEl: ".featured-next", prevEl: ".featured-prev" }}
            loop={true}
            breakpoints={{
              320: { slidesPerView: 1.2, spaceBetween: 16 },
              640: { slidesPerView: 2, spaceBetween: 18 },
              1024: { slidesPerView: 3, spaceBetween: 24 },
            }}
            className="pt-6"
          >
            {products.map((p) => (
              <SwiperSlide key={p.id}>
                <ProductCard p={p} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
};

export default BestSeller;
