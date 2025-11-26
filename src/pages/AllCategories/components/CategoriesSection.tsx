import React from "react";
import { Link } from "react-router-dom";

import veg from "../../../assets/Images/Homepage/Vegetable.png";
import fruit from "../../../assets/Images/Homepage/Fruit.png";
import dairy from "../../../assets/Images/Homepage/Dairy products.png";
import bakery from "../../../assets/Images/Homepage/bakery.png";
import cleaning from "../../../assets/Images/Homepage/house hold.png";
import dryfruits from "../../../assets/Images/Homepage/dry fruits.png";

// Give all categories a link to their product list page
const categories = [
  { name: "Vegetables", items: "20 Items", img: veg, link: "/categories/vegetables" },
  { name: "Fresh Fruits", items: "48 Items", img: fruit, link: "/categories/fresh-fruits" },
  { name: "Milk & Eggs", items: "24 Items", img: dairy, link: "/categories/milk-eggs" },
  { name: "Bakery", items: "62 Items", img: bakery, link: "/categories/bakery" },
  { name: "House Hold", items: "25 Items", img: cleaning, link: "/categories/house-hold" },
  { name: "Dry Fruits", items: "8 Items", img: dryfruits, link: "/categories/dry-fruits" },
  { name: "Dry Fruits", items: "8 Items", img: dryfruits, link: "/categories/dry-fruits" },
  { name: "Dry Fruits", items: "8 Items", img: dryfruits, link: "/categories/dry-fruits" },
  { name: "Dry Fruits", items: "8 Items", img: dryfruits, link: "/categories/dry-fruits" },
  { name: "Dry Fruits", items: "8 Items", img: dryfruits, link: "/categories/dry-fruits" },
  { name: "Dry Fruits", items: "8 Items", img: dryfruits, link: "/categories/dry-fruits" },
  { name: "Dry Fruits", items: "8 Items", img: dryfruits, link: "/categories/dry-fruits" },
  { name: "Dry Fruits", items: "8 Items", img: dryfruits, link: "/categories/dry-fruits" },
  { name: "Dry Fruits", items: "8 Items", img: dryfruits, link: "/categories/dry-fruits" },
];

// Now accept "link" and render a Link if present for navigation
interface CategoryCardProps {
  img: string;
  name: string;
  items: string;
  link?: string;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ img, name, items, link }) => {
  const cardContent = (
    <div className="group cursor-pointer flex flex-col items-center gap-4 transition-all duration-200">
      <div className="w-[150px] h-[150px] md:w-[160px] md:h-[160px] rounded-full bg-background-secondary flex items-center justify-center transition-all duration-200 group-hover:scale-[1.05] group-hover:shadow-md">
        <img src={img} alt={name} className="w-[65px] md:w-[90px] select-none pointer-events-none" />
      </div>
      <div className="text-center">
        <h3 className="text-body-lg md:text-title font-medium text-text-500">{name}</h3>
        <p className="text-caption text-text-300">{items}</p>
      </div>
    </div>
  );
  // If link is present, wrap in <Link>
  return link ? (
    <Link to={link} tabIndex={0} className="w-full focus-visible:outline-none">
      {cardContent}
    </Link>
  ) : (
    cardContent
  );
};

const CategoriesSection = () => {
  return (
    <section className="w-full bg-white py-20 select-none">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-h5 md:text-h3 font-semibold text-text-500">
            Choose <span className="text-green-500">Categories</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-10 md:gap-y-14 place-items-center">
          {categories.map((cat, idx) => (
            <CategoryCard key={idx} {...cat} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
