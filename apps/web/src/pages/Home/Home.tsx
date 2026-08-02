import Hero from "./components/Hero";
import Categories from "./components/Categories";
import FeaturedProducts from "./components/FeaturedProducts";
import DealsSection from "./components/DealsSection";
import BestSeller from "./components/BestSeller";
import SEO from "../../components/SEO";

export default function Home() {
  return (
    <>
      <SEO
        description="Fresh, authentic Indian groceries delivered to your door. Shop spices, lentils, snacks, fresh produce, and more at Amma Indian Grocery."
        keywords="indian grocery, spices, lentils, snacks, fresh produce, online grocery store"
      />
      <Hero />
      <Categories />
      <FeaturedProducts />
      <DealsSection />
      <BestSeller/>
    </>
  );
}
