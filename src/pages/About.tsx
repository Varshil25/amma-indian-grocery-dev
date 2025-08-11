import Layout from "@/components/layout/Layout";
import SEO from "@/components/SEO";
import gallery1 from "@/assets/gallery-shelves.jpg";
import gallery2 from "@/assets/gallery-produce.jpg";
import gallery3 from "@/assets/gallery-bakery.jpg";

const About = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "GroceryStore",
    name: "Amma Grocery",
    address: {
      "@type": "PostalAddress",
      streetAddress: "123 Lancaster Ave",
      addressLocality: "Malvern",
      addressRegion: "PA",
      postalCode: "19355",
      addressCountry: "US"
    },
    telephone: "+1-610-555-0123",
    openingHours: ["Mo-Sa 09:00-20:00", "Su 10:00-18:00"],
    url: typeof window !== 'undefined' ? window.location.origin : undefined
  } as const;

  return (
    <Layout>
      <SEO title="About Amma Grocery" description="Learn about Amma Grocery's history, mission, hours, and how to find us in Malvern, PA.">
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </SEO>
      <section className="container mx-auto py-12 md:py-16">
        <h1 className="text-3xl font-bold">About Us</h1>
        <article className="mt-4 text-base leading-relaxed text-foreground/90">
          <p>Amma Grocery was founded with a simple mission: to bring the authentic flavors and ingredients of India to the Malvern community. We understand the importance of quality ingredients in creating traditional Indian dishes, and we're committed to providing the freshest produce, premium spices, and authentic products that our customers trust.</p>
          <h2 className="mt-6 text-xl font-semibold">Our Mission</h2>
          <p className="mt-2"><strong>Authentic Indian Experience</strong> — We source the finest Indian spices, fresh produce, and traditional ingredients to help you create authentic Indian cuisine in your own kitchen. Our commitment to quality and authenticity makes us the go-to destination for Indian groceries in Malvern, PA.</p>
        </article>
      </section>

      <section className="container mx-auto grid md:grid-cols-2 gap-8 items-start py-6">
        <div>
          <h2 className="text-2xl font-semibold">Contact & Hours</h2>
          <ul className="mt-3 text-muted-foreground space-y-1">
            <li>Address: 123 Lancaster Ave, Malvern, PA 19355</li>
            <li>Phone: (610) 555-0123</li>
            <li>Email: info@ammagrocery.com</li>
            <li>Monday–Saturday: 9:00 AM – 8:00 PM</li>
            <li>Sunday: 10:00 AM – 6:00 PM</li>
          </ul>
        </div>
        <div>
          <div className="aspect-[4/3] overflow-hidden rounded-lg border border-border">
            <iframe
              title="Google Map - Amma Grocery, Malvern, PA"
              className="h-full w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3057.1234567890123!2d-75.51234567890123!3d40.01234567890123!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c6b8a123456789%3A0xabcdef123456789!2sAmma%20Grocery!5e0!3m2!1sen!2sus!4v1234567890123"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      <section className="container mx-auto py-10">
        <h2 className="text-2xl font-semibold">Photo Gallery</h2>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[gallery1, gallery2, gallery3].map((src, i) => (
            <img key={i} src={src} alt={`Store gallery ${i + 1}`} className="h-56 w-full object-cover rounded-lg border border-border" loading="lazy" />
          ))}
        </div>
      </section>
    </Layout>
  );
};

export default About;
