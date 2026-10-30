import { useBestSellers } from "../../../hooks/use-products";
import ProductCarousel from "./ProductCarousel";

/** Top products by units sold. Hidden until the store has sales. */
const BestSeller = () => {
  const { data, isLoading } = useBestSellers(8);
  return (
    <ProductCarousel
      id="bestseller"
      eyebrow="Most Popular"
      title="Best"
      highlight="Sellers"
      products={data}
      isLoading={isLoading}
      viewAllHref="/all-categories"
      background="bg-white"
    />
  );
};

export default BestSeller;
