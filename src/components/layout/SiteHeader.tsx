import { Link, NavLink } from "react-router-dom";
import { ShoppingBag, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/catalog", label: "Products" },
  { to: "/offers", label: "Special Offers" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact" },
];

const SiteHeader = () => {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-orange-500 text-white">
            <ShoppingBag className="h-5 w-5" aria-hidden />
          </span>
          <span className="font-bold text-lg tracking-tight">Amma Grocery</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6" aria-label="Main Navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `text-sm transition-colors ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-3">
          <Button asChild variant="secondary" size="sm">
            <a href="#hours" aria-label="View store hours"><ClockIcon className="h-4 w-4" /> Hours</a>
          </Button>
          <Button asChild variant="hero" size="sm">
            <a href="tel:+16105550123" aria-label="Call store"><Phone className="h-4 w-4" /> Call</a>
          </Button>
        </div>
        <div className="md:hidden">
          <Button asChild variant="secondary" size="icon" aria-label="Get Directions">
            <a href="https://maps.google.com/?q=Amma+Grocery+Malvern+PA" target="_blank" rel="noreferrer">
              <MapPin className="h-5 w-5" />
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
};

const ClockIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M12 8v5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

export default SiteHeader;
