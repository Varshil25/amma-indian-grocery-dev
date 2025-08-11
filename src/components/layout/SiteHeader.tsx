import { Link, NavLink } from "react-router-dom";
import { ShoppingBag, Phone, MapPin, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/catalog", label: "Products" },
  { to: "/offers", label: "Special Offers" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact" },
];

const SiteHeader = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  // Close menu on route change
  useEffect(() => {
    closeMobileMenu();
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2" onClick={closeMobileMenu}>
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-orange-500 text-white">
            <ShoppingBag className="h-5 w-5" aria-hidden />
          </span>
          <span className="font-bold text-lg tracking-tight">Amma Grocery</span>
        </Link>
        
        {/* Desktop Navigation */}
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
        
        {/* Desktop Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Button asChild variant="secondary" size="sm">
            <a href="#hours" aria-label="View store hours"><ClockIcon className="h-4 w-4" /> Hours</a>
          </Button>
          <Button asChild variant="hero" size="sm">
            <a href="tel:+16105550123" aria-label="Call store"><Phone className="h-4 w-4" /> Call</a>
          </Button>
        </div>
        
        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-2">
          <Button asChild variant="secondary" size="icon" aria-label="Get Directions">
            <a href="https://maps.google.com/?q=Amma+Grocery+Malvern+PA" target="_blank" rel="noreferrer">
              <MapPin className="h-5 w-5" />
            </a>
          </Button>
          <Button
            ref={menuButtonRef}
            variant="ghost"
            size="icon"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
            aria-expanded={isMobileMenuOpen}
            className="h-9 w-9 transition-colors hover:bg-muted/50"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <div
        ref={mobileMenuRef}
        className={`md:hidden border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300 ease-in-out ${
          isMobileMenuOpen 
            ? 'max-h-screen opacity-100' 
            : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        <nav className="container mx-auto py-4" aria-label="Mobile Navigation">
          <div className="flex flex-col space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  `block px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 ${
                    isActive 
                      ? "text-primary bg-primary/10 border-l-4 border-l-primary" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:border-l-4 hover:border-l-muted"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
          
          {/* Mobile Action Buttons */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex flex-col space-y-2 px-4">
              <Button asChild variant="secondary" size="sm" className="w-full justify-center">
                <a href="#hours" aria-label="View store hours" onClick={closeMobileMenu}>
                  <ClockIcon className="h-4 w-4 mr-2" /> Store Hours
                </a>
              </Button>
              <Button asChild variant="hero" size="sm" className="w-full justify-center">
                <a href="tel:+16105550123" aria-label="Call store" onClick={closeMobileMenu}>
                  <Phone className="h-4 w-4 mr-2" /> Call Store
                </a>
              </Button>
            </div>
          </div>
        </nav>
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
