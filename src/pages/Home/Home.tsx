import { Helmet } from "react-helmet-async";
import Hero from "./components/Hero";
import Categories from "./components/Categories";
import FeaturedProducts from "./components/FeaturedProducts";
import DealsSection from "./components/DealsSection";
import BestSeller from "./components/BestSeller";

export default function Home() {
  return (
    <>
      <Hero />
      <Categories />
      <FeaturedProducts />
      <DealsSection />
      <BestSeller/>
    </>
  );
}
