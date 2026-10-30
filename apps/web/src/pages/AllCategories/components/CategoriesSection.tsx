import React from "react";
import { Link } from "react-router-dom";
import { useCategories } from "../../../hooks/use-categories";

// Built-in icons for the starter categories, used until an image is uploaded in the admin
import veg from "../../../assets/Images/Homepage/Vegetable.png";
import fruit from "../../../assets/Images/Homepage/Fruit.png";
import dairy from "../../../assets/Images/Homepage/Dairy products.png";
import bakery from "../../../assets/Images/Homepage/bakery.png";
import cleaning from "../../../assets/Images/Homepage/house hold.png";
import dryfruits from "../../../assets/Images/Homepage/dry fruits.png";

const fallbackImageMap: Record<string, string> = {
  vegetables: veg,
  "fresh-fruits": fruit,
  fruits: fruit,
  "milk-eggs": dairy,
  dairy: dairy,
  bakery: bakery,
  "house-hold": cleaning,
  household: cleaning,
  "dry-fruits": dryfruits,
  spices: veg,
  "grains-rice": bakery,
  default: veg,
};

function getFallbackImage(slug: string): string {
  return fallbackImageMap[slug] || fallbackImageMap.default;
}

interface CategoryCardProps {
  img: string;
  name: string;
  items: string;
  link: string;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ img, name, items, link }) => (
  <Link to={link} tabIndex={0} className="w-full focus-visible:outline-none">
    <div className="group cursor-pointer flex flex-col items-center gap-4 transition-all duration-200">
      <div className="w-[150px] h-[150px] md:w-[160px] md:h-[160px] rounded-full bg-background-secondary flex items-center justify-center transition-all duration-200 group-hover:scale-[1.05] group-hover:shadow-md">
        <img src={img} alt={name} className="w-[65px] md:w-[90px] select-none pointer-events-none" />
      </div>
      <div className="text-center">
        <h3 className="text-body-lg md:text-title font-medium text-text-500">{name}</h3>
        <p className="text-caption text-text-300">{items}</p>
      </div>
    </div>
  </Link>
);

const CategoriesSection = () => {
  const { data: apiCategories, isLoading, isError, error, refetch } = useCategories();

  // Top-level categories plus their subcategories
  const categories = (apiCategories || [])
    .flatMap((c) => [c, ...(c.children || [])])
    .map((cat) => {
      const n = cat._count?.products || 0;
      return {
        name: cat.name,
        items: `${n} ${n === 1 ? "Item" : "Items"}`,
        img: cat.image || getFallbackImage(cat.slug),
        link: `/categories/${cat.slug}`,
      };
    });

  return (
    <section className="w-full bg-white py-20 select-none">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-h5 md:text-h3 font-semibold text-text-500">
            Choose <span className="text-green-500">Categories</span>
          </h2>
        </div>

        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-10 place-items-center">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-[150px] h-[150px] rounded-full bg-background-secondary animate-pulse" />
            ))}
          </div>
        )}
        {isError && (
          <div className="text-center">
            <p className="text-text-300 mb-4">{(error as Error)?.message || "We couldn't load categories right now."}</p>
            <button onClick={() => refetch()} className="btn-primary">
              Try again
            </button>
          </div>
        )}
        {!isLoading && !isError && categories.length === 0 && (
          <p className="text-center text-text-300">Categories are coming soon.</p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-10 md:gap-y-14 place-items-center">
          {categories.map((cat, idx) => (
            <CategoryCard key={cat.link || idx} {...cat} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
