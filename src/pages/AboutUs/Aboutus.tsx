import PageHeader from "@/components/PageHeader";
import AboutIntro from "./components/AboutIntro";
import AboutVideoSection from "./components/AboutVideoSection";
import CTA from "@/components/CTA";

export default function Aboutus() {
  return (
    <>
      <PageHeader title="About Us" breadcrumb="Home / About Us" />
      <AboutIntro/>
      <AboutVideoSection/>
      <CTA/>
    </>
  );
}
