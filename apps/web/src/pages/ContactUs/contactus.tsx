import PageHeader from "@/components/PageHeader";
import ContactSection from "./components/ContactSection";
import SEO from "@/components/SEO";

export default function Contactus() {
  return (
    <>
      <SEO
        title="Contact Us"
        description="Get in touch with Amma Indian Grocery. Visit our store, call us, or send us a message."
        keywords="contact amma indian grocery, indian grocery store location, customer support"
      />
       <PageHeader 
  title="Contact Us"
  breadcrumbs={[
    { label: "Home", href: "/" },
  { label: "Contact Us" }
  
  ]} />
      <ContactSection />
    </>
  );
}
