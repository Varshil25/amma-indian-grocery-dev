import PageHeader from "@/components/PageHeader";
import CategoriesSection from "./components/CategoriesSection";
import SEO from "@/components/SEO";

export default function AllCategories() {
  return (
    <>
      <SEO
        title="All Categories"
        description="Browse all categories of Indian groceries — spices, lentils, rice, snacks, fresh produce, and more."
        keywords="indian grocery categories, spices, lentils, rice, snacks, vegetables, fruits"
      />
   <PageHeader 
  title="All Categories"
  breadcrumbs={[
    { label: "Home", href: "/" },
  { label: "All Categories" }
  
  ]}
/>
       <CategoriesSection />
    </>
  );
}
