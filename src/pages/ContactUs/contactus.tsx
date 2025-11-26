import PageHeader from "@/components/PageHeader";
import ContactSection from "./components/ContactSection";

export default function Contactus() {
  return (
    <>
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
