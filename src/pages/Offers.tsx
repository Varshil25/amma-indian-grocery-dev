import Layout from "@/components/layout/Layout";
import SEO from "@/components/SEO";
import banner from "@/assets/offers-banner.jpg";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Offer {
  id: string;
  title: string;
  details?: string;
  valid: string;
}

const Offers = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  useEffect(() => {
    fetch("/data/offers.json").then((r) => r.json()).then(setOffers).catch(() => setOffers([]));
  }, []);

  return (
    <Layout>
      <SEO title="Special Offers | Amma Grocery" description="Discover current discounts and special offers at Amma Grocery in Malvern, PA." />
      <header className="relative">
        <img src={banner} alt="Special offers banner with fresh produce and Indian groceries" className="h-56 w-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      </header>
      <section className="container mx-auto py-10">
        <h1 className="text-3xl font-bold">Special Offers</h1>
        <p className="mt-2 text-muted-foreground">Manually updated offers. Visit in-store for the latest deals on Indian spices, produce, and groceries.</p>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((o) => (
            <Card key={o.id}>
              <CardHeader>
                <CardTitle>{o.title}</CardTitle>
                {o.details && <p className="text-sm text-muted-foreground">{o.details}</p>}
              </CardHeader>
              <CardContent>
                <p className="text-sm">Valid: {o.valid}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </Layout>
  );
};

export default Offers;
