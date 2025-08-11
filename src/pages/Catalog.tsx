import Layout from "@/components/layout/Layout";
import SEO from "@/components/SEO";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "react-router-dom";
import produceImg from "@/assets/category-produce.jpg";
import dairyImg from "@/assets/category-dairy.jpg";
import snacksImg from "@/assets/category-snacks.jpg";
import beveragesImg from "@/assets/category-beverages.jpg";
import bakeryImg from "@/assets/category-bakery.jpg";
import meatImg from "@/assets/category-meat.jpg";
import shelvesImg from "@/assets/gallery-shelves.jpg";

type Product = {
  id: string;
  name: string;
  brand: string;
  size?: string;
  price?: string;
  category: string;
  image: string;
};

const categories = [
  "Grains",
  "Spices",
  "Pulses",
  "Vegetables",
  "Dairy",
  "Bakery",
  "Meat",
  "Beverages",
  "Snacks",
  "Household",
]; 

const imageMap: Record<string, string> = {
  Vegetables: produceImg,
  Fruits: produceImg,
  Dairy: dairyImg,
  Meat: meatImg,
  Bakery: bakeryImg,
  Beverages: beveragesImg,
  Snacks: snacksImg,
  Household: shelvesImg,
};

const getImageFor = (category: string) => imageMap[category] || shelvesImg;

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

const Catalog = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [active, setActive] = useState<string>("All");
  const query = useQuery();

  useEffect(() => {
    fetch("/data/products.json")
      .then((r) => r.json())
      .then(setProducts)
      .catch(() => setProducts([]));
  }, []);

  useEffect(() => {
    const fromQuery = query.get("category");
    if (fromQuery) setActive(fromQuery);
  }, [query]);

  const shown = useMemo(() => {
    if (active === "All") return products;
    return products.filter((p) => p.category === active);
  }, [products, active]);

  return (
    <Layout>
      <SEO title="Product Catalog | Amma Grocery" description="Browse our static product catalog featuring authentic Indian groceries, spices, produce, and more at Amma Grocery in Malvern, PA." />
      <section className="container mx-auto py-12 md:py-16">
        <h1 className="text-3xl font-bold">Product Catalog</h1>
        <p className="mt-2 text-muted-foreground">Static catalog for quick browsing. Prices and availability may vary in-store.</p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button variant={active === "All" ? "hero" : "secondary"} size="sm" onClick={() => setActive("All")}>All</Button>
          {categories.map((c) => (
            <Button key={c} variant={active === c ? "hero" : "secondary"} size="sm" onClick={() => setActive(c)}>
              {c}
            </Button>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {shown.map((p) => (
            <Card key={p.id} className="overflow-hidden">
              <img src={getImageFor(p.category)} alt={`${p.name} by ${p.brand}`} className="h-44 w-full object-cover" loading="lazy" />
              <CardHeader>
                <CardTitle className="text-lg">{p.name}</CardTitle>
                <p className="text-sm text-muted-foreground">Brand: {p.brand}</p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm">
                  {p.size && <Badge variant="secondary">{p.size}</Badge>}
                  {p.price && <Badge>{p.price}</Badge>}
                  <Badge variant="outline">{p.category}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </Layout>
  );
};

export default Catalog;
