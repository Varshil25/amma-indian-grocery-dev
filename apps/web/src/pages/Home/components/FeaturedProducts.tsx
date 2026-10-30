import { useFeaturedProducts } from "../../../hooks/use-products";
import ProductCarousel from "./ProductCarousel";

/** Products marked "Featured on home page" in the admin. Hidden when none are. */
const FeaturedProducts = () => {
  const { data, isLoading } = useFeaturedProducts(8);
  return (
    <ProductCarousel
      id="featured"
      eyebrow="Products"
      title="Featured"
      highlight="Products"
      products={data}
      isLoading={isLoading}
      viewAllHref="/all-categories"
    />
  );
};

export default FeaturedProducts;
