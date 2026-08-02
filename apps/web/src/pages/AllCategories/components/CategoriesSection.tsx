import React from "react";
import { Link } from "react-router-dom";
import { useCategories } from "../../../hooks/use-categories";

// Fallback images
import veg from "../../../assets/Images/Homepage/Vegetable.png";
import fruit from "../../../assets/Images/Homepage/Fruit.png";
import dairy from "../../../assets/Images/Homepage/Dairy products.png";
import bakery from "../../../assets/Images/Homepage/bakery.png";
import cleaning from "../../../assets/Images/Homepage/house hold.png";
import dryfruits from "../../../assets/Images/Homepage/dry fruits.png";

const fallbackCategories = [
  { name: "Vegetables", items: "20 Items", img: veg, link: "/categories/vegetables" },
  { name: "Fresh Fruits", items: "48 Items", img: fruit, link: "/categories/fresh-fruits" },
  { name: "Milk & Eggs", items: "24 Items", img: dairy, link: "/categories/milk-eggs" },
  { name: "Bakery", items: "62 Items", img: bakery, link: "/categories/bakery" },
  { name: "House Hold", items: "25 Items", img: cleaning, link: "/categories/house-hold" },
  { name: "Dry Fruits", items: "8 Items", img: dryfruits, link: "/categories/dry-fruits" },
  { name: "Spices", items: "35 Items", img: veg, link: "/categories/spices" },
  { name: "Grains & Rice", items: "18 Items", img: bakery, link: "/categories/grains-rice" },
  { name: "Pulses & Lentils", items: "22 Items", img: cleaning, link: "/categories/pulses-lentils" },
  { name: "Snacks", items: "30 Items", img: fruit, link: "/categories/snacks" },
  { name: "Beverages", items: "15 Items", img: dairy, link: "/categories/beverages" },
  { name: "Frozen Foods", items: "12 Items", img: dryfruits, link: "/categories/frozen-foods" },
  { name: "Ready to Eat", items: "10 Items", img: bakery, link: "/categories/ready-to-eat" },
  { name: "Personal Care", items: "14 Items", img: cleaning, link: "/categories/personal-care" },
];

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
  const { data: apiCategories, isError } = useCategories();

  // Map API categories to display format
  const categories = apiCategories && !isError && apiCategories.length > 0
    ? apiCategories.map((cat: any) => ({
        name: cat.name,
        items: `${cat._count?.products || 0} Items`,
        img: cat.image || getFallbackImage(cat.slug),
        link: `/categories/${cat.slug}`,
      }))
    : fallbackCategories;

  return (
    <section className="w-full bg-white py-20 select-none">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-h5 md:text-h3 font-semibold text-text-500">
            Choose <span className="text-green-500">Categories</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-10 md:gap-y-14 place-items-center">
          {categories.map((cat: any, idx: number) => (
            <CategoryCard key={cat.link || idx} {...cat} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
