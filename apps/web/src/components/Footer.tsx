import { Link } from "react-router-dom";
import { HiLocationMarker, HiPhone, HiMail, HiClock } from "react-icons/hi";
import { FaFacebookF, FaWhatsapp, FaInstagram } from "react-icons/fa";
import footerLogo from "../assets/Logos/footer_logo.svg";
import { useStoreSettings } from "../hooks/use-content";

const Footer = () => {
  const { data: settings } = useStoreSettings();

  const address = settings?.store_address || "1762 School House Road, ON L4N 9B3, Canada";
  const phone = settings?.store_phone || "1233-777";
  const email = settings?.store_email || "groceryish@contact.com";
  const facebookUrl = settings?.social_facebook || "https://facebook.com";
  const whatsappUrl = settings?.social_whatsapp || "https://wa.me";
  const instagramUrl = settings?.social_instagram || "https://instagram.com";

  // Build summary hours from store_hours JSON
  let workHours = "Tue-Sat";
  if (settings?.store_hours) {
    try {
      const hours: { day: string; time: string }[] = JSON.parse(settings.store_hours);
      const openDays = hours.filter((h) => h.time !== "Closed");
      if (openDays.length > 0) {
        const firstDay = openDays[0].day.slice(0, 3);
        const lastDay = openDays[openDays.length - 1].day.slice(0, 3);
        const firstTime = openDays[0].time;
        workHours = `${firstTime}, ${firstDay}-${lastDay}`;
      }
    } catch { /* use default */ }
  }

  return (
    <footer className="w-full bg-white border-t">
      <div className="container mx-auto px-6 py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">

        {/* Left Section */}
        <div className="space-y-6">
          <img src={footerLogo} alt="Amma Grocery" className="w-20" />

          <div className="space-y-4 text-text-900 text-caption">
            <div className="flex gap-3 items-start">
              <HiLocationMarker className="text-green-500 w-5 h-5 mt-1" />
              <p><span className="font-medium">Address:</span> {address}</p>
            </div>

            <div className="flex gap-3 items-top">
              <HiPhone className="text-green-500 w-5 h-5" />
              <p><span className="font-medium">Call Us:</span> {phone}</p>
            </div>

            <div className="flex gap-3 items-center">
              <HiMail className="text-green-500 w-5 h-5" />
              <p><span className="font-medium">Email:</span> {email}</p>
            </div>

            <div className="flex gap-3 items-center">
              <HiClock className="text-green-500 w-5 h-5" />
              <p><span className="font-medium">Work hours:</span> {workHours}</p>
            </div>
          </div>
        </div>

        {/* Useful Links */}
        <div>
          <h3 className="text-title font-medium text-green-500 mb-4">Useful Links</h3>
          <ul className="space-y-3 text-caption text-text-900">
            <li><Link to="/" className="hover:text-green-500 transition">Home</Link></li>
            <li><Link to="/about" className="hover:text-green-500 transition">About Us</Link></li>
            <li><Link to="/hot-deals" className="hover:text-green-500 transition">Hot Deals</Link></li>
            <li><Link to="/contact" className="hover:text-green-500 transition">Contact Us</Link></li>
            <li><Link to="/all-categories" className="hover:text-green-500 transition">All Categories</Link></li>
          </ul>
        </div>

        {/* Help Center */}
        <div>
          <h3 className="text-title font-medium text-green-500 mb-4">Help Center</h3>
          <ul className="space-y-3 text-caption text-text-900">
            <li><Link to="/payments" className="hover:text-green-500 transition">Payments</Link></li>
            <li><Link to="/refund" className="hover:text-green-500 transition">Refund</Link></li>
            <li><Link to="/shipping" className="hover:text-green-500 transition">Shipping</Link></li>
            <li><Link to="/qa" className="hover:text-green-500 transition">Q&A</Link></li>
            <li><Link to="/privacy-policy" className="hover:text-green-500 transition">Privacy Policy</Link></li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t mt-10">
        <div className="container mx-auto px-6 py-4 flex flex-col lg:flex-row justify-between items-center gap-4">
          <p className="text-label text-text-300">&copy; {new Date().getFullYear()} &mdash; All rights reserved</p>

          <div className="flex gap-3">
            <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition">
              <FaFacebookF className="text-white w-3 h-3" />
            </a>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition">
              <FaWhatsapp className="text-white w-3 h-3" />
            </a>
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition">
              <FaInstagram className="text-white w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
