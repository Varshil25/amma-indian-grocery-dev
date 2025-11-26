import PageHeader from "@/components/PageHeader";
import CategoriesSection from "./components/CategoriesSection";

export default function AllCategories() {
  return (
    <>
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
