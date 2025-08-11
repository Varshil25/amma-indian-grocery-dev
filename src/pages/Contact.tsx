import Layout from "@/components/layout/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";

const Contact = () => {
  return (
    <Layout>
      <SEO title="Contact Amma Grocery" description="Get in touch with Amma Grocery in Malvern, PA. Find our address, hours, and send us a message." />
      <section className="container mx-auto py-12 md:py-16">
        <h1 className="text-3xl font-bold">Contact Us</h1>
        <div className="mt-6 grid md:grid-cols-2 gap-10">
          <div>
            <h2 className="text-xl font-semibold">Store Details</h2>
            <ul className="mt-3 text-muted-foreground space-y-1">
              <li>Address: 123 Lancaster Ave, Malvern, PA 19355</li>
              <li>Phone: (610) 555-0123</li>
              <li>Email: info@ammagrocery.com</li>
              <li>Monday–Saturday: 9:00 AM – 8:00 PM</li>
              <li>Sunday: 10:00 AM – 6:00 PM</li>
            </ul>
            <div className="mt-4">
              <Button asChild variant="hero">
                <a href="https://maps.google.com/?q=Amma+Grocery+Malvern+PA" target="_blank" rel="noreferrer">Get Directions</a>
              </Button>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold">Send a Message</h2>
            <p className="text-sm text-muted-foreground">This form is powered by Formspree. Replace the form ID with yours to receive messages.</p>
            <form className="mt-4 space-y-4" action="https://formspree.io/f/xyyrpvya" method="POST">
              <div>
                <label className="block text-sm font-medium" htmlFor="name">Name</label>
                <input id="name" name="name" required className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium" htmlFor="email">Email</label>
                <input id="email" type="email" name="email" required className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium" htmlFor="message">Message</label>
                <textarea id="message" name="message" rows={5} required className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2" />
              </div>
              <Button type="submit" variant="hero">Send Message</Button>
            </form>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
