import { Facebook, Instagram, Phone, Mail, MapPin } from "lucide-react";

const currentYear = new Date().getFullYear();

const SiteFooter = () => {
  return (
    <footer className="mt-16 border-t border-border bg-card/50">
      <div className="container mx-auto grid gap-8 py-10 md:grid-cols-3">
        <div>
          <h3 className="font-semibold text-lg">Amma Grocery</h3>
          <p className="text-sm text-muted-foreground mt-2">Authentic Indian groceries and spices in Malvern, PA.</p>
          <div className="mt-4 space-y-2 text-sm">
            <p className="flex items-center gap-2"><MapPin className="h-4 w-4"/>123 Lancaster Ave, Malvern, PA 19355</p>
            <p className="flex items-center gap-2"><Phone className="h-4 w-4"/>(610) 555-0123</p>
            <p className="flex items-center gap-2"><Mail className="h-4 w-4"/>info@ammagrocery.com</p>
          </div>
        </div>
        <div id="hours">
          <h4 className="font-semibold">Store Hours</h4>
          <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
            <li>Monday–Saturday: 9:00 AM – 8:00 PM</li>
            <li>Sunday: 10:00 AM – 6:00 PM</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold">Follow Us</h4>
          <div className="mt-3 flex gap-3">
            <a className="text-muted-foreground hover:text-foreground" href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook"><Facebook className="h-5 w-5"/></a>
            <a className="text-muted-foreground hover:text-foreground" href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram className="h-5 w-5"/></a>
          </div>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {currentYear} Amma Grocery. All rights reserved.
      </div>
    </footer>
  );
};

export default SiteFooter;
