import PageHeader from "@/components/PageHeader";
import AboutIntro from "./components/AboutIntro";
import AboutVideoSection from "./components/AboutVideoSection";
import CTA from "@/components/CTA";
import SEO from "@/components/SEO";

export default function Aboutus() {
  return (
    <>
      <SEO
        title="About Us"
        description="Learn about Amma Indian Grocery — your trusted source for authentic Indian groceries, spices, and fresh produce."
        keywords="about amma indian grocery, indian grocery store, authentic indian food"
      />
       <PageHeader 
  title="About Us"
  breadcrumbs={[
    { label: "Home", href: "/" },
  { label: "About Us" } 
  ]}/>
      <AboutIntro/>
      <AboutVideoSection/>
      <CTA/>
    </>
  );
}
