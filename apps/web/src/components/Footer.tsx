import { Link } from "react-router-dom";
import { HiLocationMarker, HiPhone, HiMail, HiClock } from "react-icons/hi";
import { FaFacebookF, FaWhatsapp, FaInstagram } from "react-icons/fa";
import footerLogo from "../assets/Logos/footer_logo.svg";
import { useStoreSettings, parseStoreHours, summarizeStoreHours } from "../hooks/use-content";

const Footer = () => {
  const { data: settings } = useStoreSettings();

  // Everything here comes from Admin → Settings; anything not filled in is simply not shown.
  const address = settings?.store_address?.trim();
  const phone = settings?.store_phone?.trim();
  const email = settings?.store_email?.trim();
  const socials = [
    { url: settings?.social_facebook?.trim(), Icon: FaFacebookF, label: "Facebook" },
    { url: settings?.social_whatsapp?.trim(), Icon: FaWhatsapp, label: "WhatsApp" },
    { url: settings?.social_instagram?.trim(), Icon: FaInstagram, label: "Instagram" },
  ].filter((x) => x.url && /^https?:\/\//.test(x.url));

  const hours = parseStoreHours(settings?.store_hours);
  const anyOpen = hours.some((h) => h.time.trim().toLowerCase() !== "closed");
  // e.g. "Mon–Sat 9:00 AM - 8:00 PM", "Sun 10:00 AM - 6:00 PM"; too many different days → link
  const hourLines = anyOpen ? summarizeStoreHours(hours) : [];

  return (
    <footer className="w-full bg-white border-t">
      <div className="container mx-auto px-4 sm:px-6 py-10 md:py-12 grid grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)] gap-x-6 gap-y-10 lg:gap-10">

        {/* Left Section: full width on phones and tablets, the link lists sit side by side under it */}
        <div className="col-span-2 lg:col-span-1 space-y-6">
          <img src={footerLogo} alt="Amma Grocery" className="w-16 md:w-20" />

          {/* min-w-0 + overflow-wrap: a long email/address wraps instead of widening the page */}
          <div className="space-y-4 text-text-900 text-body-md min-w-0 [&_p]:min-w-0 [&_p]:[overflow-wrap:anywhere]">
            {address && (
              <div className="flex gap-3 items-start">
                <HiLocationMarker className="text-green-500 w-5 h-5 mt-1 shrink-0" />
                <p><span className="font-medium">Address:</span> {address}</p>
              </div>
            )}

            {phone && (
              <div className="flex gap-3 items-center">
                <HiPhone className="text-green-500 w-5 h-5 shrink-0" />
                <p>
                  <span className="font-medium">Call Us:</span>{" "}
                  <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="hover:text-green-500">{phone}</a>
                </p>
              </div>
            )}

            {email && (
              <div className="flex gap-3 items-center">
                <HiMail className="text-green-500 w-5 h-5 shrink-0" />
                <p>
                  <span className="font-medium">Email:</span>{" "}
                  <a href={`mailto:${email}`} className="hover:text-green-500">{email}</a>
                </p>
              </div>
            )}

            {hourLines.length > 0 && (
              <div className="flex gap-3 items-start">
                <HiClock className="text-green-500 w-5 h-5 mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium">Work hours:</span>{" "}
                  {hourLines.length <= 3 ? (
                    hourLines.map((line) => <span key={line} className="block">{line}</span>)
                  ) : (
                    <Link to="/contact" className="hover:text-green-500 underline">See store hours</Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Useful Links */}
        <div>
          <h3 className="text-title font-medium text-green-500 mb-3">Useful Links</h3>
          <ul className="space-y-1 text-body-md text-text-900 [&_a]:inline-block [&_a]:py-1.5">
            <li><Link to="/" className="hover:text-green-500 transition">Home</Link></li>
            <li><Link to="/about" className="hover:text-green-500 transition">About Us</Link></li>
            <li><Link to="/hot-deals" className="hover:text-green-500 transition">Hot Deals</Link></li>
            <li><Link to="/contact" className="hover:text-green-500 transition">Contact Us</Link></li>
            <li><Link to="/all-categories" className="hover:text-green-500 transition">All Categories</Link></li>
          </ul>
        </div>

        {/* Help Center */}
        <div>
          <h3 className="text-title font-medium text-green-500 mb-3">Help Center</h3>
          <ul className="space-y-1 text-body-md text-text-900 [&_a]:inline-block [&_a]:py-1.5">
            <li><Link to="/payments" className="hover:text-green-500 transition">Payments</Link></li>
            <li><Link to="/refund" className="hover:text-green-500 transition">Refund</Link></li>
            <li><Link to="/shipping" className="hover:text-green-500 transition">Shipping</Link></li>
            <li><Link to="/qa" className="hover:text-green-500 transition">Q&A</Link></li>
            <li><Link to="/privacy-policy" className="hover:text-green-500 transition">Privacy Policy</Link></li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4">
          <p className="text-body-sm text-text-300 text-center md:text-left">&copy; {new Date().getFullYear()} {settings?.store_name?.trim() || "Amma Grocery"} &mdash; All rights reserved</p>

          {socials.length > 0 && (
            <div className="flex gap-3">
              {socials.map(({ url, Icon, label }) => (
                <a key={label} href={url} target="_blank" rel="noopener noreferrer" aria-label={label} className="w-9 h-9 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition">
                  <Icon className="text-white w-4 h-4" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
