import React from "react";
import PageHeader from "../../components/PageHeader";
import ProductCard from "../../pages/ProductList/ProductCard"; // reusable card
import { useParams } from "react-router-dom";
import orange from "../../assets/Images/Homepage/orange.png"

const ProductList: React.FC = () => {
  const { category } = useParams(); // dynamic route /categories/:category

  // Mock data (replace later with API response)
  const products = Array.from({ length: 10 }).map((_, index) => ({
    id: index,
    category: "Fruits",
    name: "Oranges", // changed from title to name
    weight: "1.0 kg",
    price: "8.00",
    oldPrice: "10.00",
    rating: 4.8, // make this a number
    discount: "20%",
    img: orange, // changed from image to img
  }));

  return (
    <>
      <PageHeader
        title={category ? category.replace("-", " ") : "Products"}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "All Categories", href: "/all-categories" },
          { label: category ? category.replace("-", " ") : "Products" },
        ]}
      />

      {/* Page Content */}
      <div className="container mx-auto px-4 my-14">
        
        {/* Top controls */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-h4 text-text-500 font-semibold">
            {category?.replace("-", " ") || "Products"}
          </h2>

          <select className="border border-gray-300 rounded-lg px-4 py-2 text-sm">
            <option>Sort by</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
          </select>
        </div>

        {/* GRID SECTION */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8 justify-center">
          {products.map((product) => (
            <div className="flex justify-center" key={product.id}>
              <ProductCard {...product} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default ProductList;
