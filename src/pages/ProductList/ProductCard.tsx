import React from "react";
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";

interface ProductProps {
  id: number; // <-- add id for navigation
  name: string;
  category: string;
  weight: string;
  price: string;
  oldPrice?: string;
  rating: number;
  img: string;
  discount?: string;
}

const ProductCard: React.FC<ProductProps> = ({
  id,
  name,
  category,
  weight,
  price,
  oldPrice,
  img,
  rating,
  discount
}) => {
  return (
    <Link
      to={`/product/${id}`}
      className="w-[280px] bg-white border border-[#e9e9e9] rounded-lg px-4 py-5 flex flex-col gap-4 cursor-pointer hover:shadow-md transition text-inherit no-underline"
      tabIndex={0}
    >
      <div className="relative flex justify-center">
        {discount && (
          <span className="absolute top-2 left-2 text-[10px] bg-green-600 text-white rounded-full px-3 py-1">
            {discount}
          </span>
        )}
        <img src={img} className="w-[150px] h-[150px]" alt={name} />
        <div className="absolute top-2 right-2 border border-gray-300 rounded-full p-2">
          <Heart size={18} className="text-gray-600" />
        </div>
      </div>

      <div>
        <p className="text-green-500 text-sm font-normal">{category}</p>
        <h3 className="text-lg font-medium text-black">{name}</h3>
        <p className="text-sm text-gray-500">{weight}</p>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-lg font-medium text-black">${price}</span>
          {oldPrice && <span className="text-gray-300 line-through">${oldPrice}</span>}
        </div>

        <button
          type="button"
          tabIndex={-1}
          className="bg-green-50 text-green-500 text-[14px] font-medium px-5 py-2 rounded-full pointer-events-none select-none"
        >
          Add
        </button>
      </div>
    </Link>
  );
};

export default ProductCard;
