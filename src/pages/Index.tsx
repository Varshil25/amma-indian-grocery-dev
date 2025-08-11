import Layout from "@/components/layout/Layout";
import SEO from "@/components/SEO";
import heroImage from "@/assets/hero-grocery.jpg";
import produceImg from "@/assets/category-produce.jpg";
import dairyImg from "@/assets/category-dairy.jpg";
import snacksImg from "@/assets/category-snacks.jpg";
import beveragesImg from "@/assets/category-beverages.jpg";
import bakeryImg from "@/assets/category-bakery.jpg";
import meatImg from "@/assets/category-meat.jpg";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const categories = [
  { name: "Produce", image: produceImg },
  { name: "Dairy", image: dairyImg },
  { name: "Snacks", image: snacksImg },
  { name: "Beverages", image: beveragesImg },
  { name: "Bakery", image: bakeryImg },
  { name: "Meat", image: meatImg },
];

const Home = () => {
  return (
    <Layout>
      <SEO
        title="Amma Grocery | Authentic Indian Groceries in Malvern, PA"
        description="Your premier destination for authentic Indian groceries, spices, fresh produce, and traditional ingredients in Malvern, Pennsylvania."
      />
      <header className="relative">
        <img src={heroImage} alt="Amma Grocery store interior with fresh produce and authentic Indian products" className="h-[60vh] w-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/30 to-transparent" />
        <div className="absolute inset-0 flex items-end">
          <div className="container mx-auto pb-10">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Authentic Indian Groceries</h1>
              <p className="mt-3 text-muted-foreground text-lg">Welcome to Amma Grocery — your trusted source for authentic Indian spices, fresh produce, traditional ingredients, and everyday essentials in Malvern, PA.</p>
              <div className="mt-6 flex gap-3">
                <Button asChild variant="hero" size="xl">
                  <Link to="/catalog">Browse Products</Link>
                </Button>
                <Button asChild variant="secondary" size="xl">
                  <a href="#about-intro">Learn More</a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section id="about-intro" className="container mx-auto py-12 md:py-16">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <article>
            <h2 className="text-2xl font-semibold">Your Local Indian Grocery Store</h2>
            <p className="mt-3 text-muted-foreground">Amma Grocery brings the authentic flavors of India to Malvern, Pennsylvania. We specialize in fresh produce, premium spices, traditional ingredients, and all the essentials you need to create authentic Indian cuisine at home.</p>
          </article>
          <aside className="rounded-lg bg-card p-6 border border-border shadow-[var(--shadow-elegant)]">
            <h3 className="font-medium">Quick Info</h3>
            <ul className="mt-3 text-sm text-muted-foreground space-y-1">
              <li>Address: 123 Lancaster Ave, Malvern, PA 19355</li>
              <li>Phone: (610) 555-0123</li>
              <li>Hours: Mon–Sat 9:00 AM–8:00 PM, Sun 10:00 AM–6:00 PM</li>
            </ul>
          </aside>
        </div>
      </section>

      <section className="container mx-auto py-8">
        <h2 className="text-2xl font-semibold">Shop by Category</h2>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link key={cat.name} to={`/catalog?category=${encodeURIComponent(cat.name)}`} className="group block overflow-hidden rounded-lg border border-border bg-card shadow-sm hover:shadow-[var(--shadow-elegant)] transition-shadow">
              <div className="relative">
                <img src={cat.image} alt={`${cat.name} category tile`} className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
                <h3 className="absolute bottom-3 left-4 text-lg font-semibold">{cat.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </Layout>
  );
};

export default Home;
