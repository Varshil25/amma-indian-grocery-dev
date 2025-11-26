import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { HiHome, HiFire, HiMenuAlt3, HiX } from "react-icons/hi";
import { MdViewModule } from "react-icons/md";
import navbarLogo from "../assets/Logos/navbar_logo.svg";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  const navItems = [
    { label: "Home", icon: <HiHome className="w-5 h-5" />, path: "/" },
    {
      label: "Hot deals",
      icon: <HiFire className="w-5 h-5" />,
      path: "/hot-deals",
    },
    { label: "About Us", path: "/about" },
    { label: "Contact Us", path: "/contact" },
  ];

  return (
    <header className="w-full bg-white shadow-sm fixed top-0 left-0 z-50">
      <div className="container mx-auto flex items-center justify-between py-3 px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img src={navbarLogo} className="w-12 h-auto" alt="Amma Grocery" />
        </Link>

        {/* Desktop Nav (Now only shows on large screens) */}
        <nav className="hidden lg:flex items-center gap-10">
          {navItems.map((item, i) => (
            <Link
              key={i}
              to={item.path}
              className={`flex items-center gap-2 text-caption transition ${
                pathname === item.path
                  ? "text-green-500"
                  : "text-text-500 hover:text-green-500"
              }`}
            >
              {item.icon} {item.label}
            </Link>
          ))}
        </nav>

        {/* Categories Button (Desktop only) */}
        <Link
          to="/all-categories"
          className="hidden lg:flex bg-green-500 text-label text-white px-4 py-2 rounded-lg items-center gap-2 hover:bg-green-700 transition"
        >
          <MdViewModule className="w-5 h-5" />
          <span>All Categories</span>
        </Link>

        {/* Mobile + Tablet Toggle Button */}
        <button
          className="lg:hidden text-3xl text-text-500 transition"
          onClick={() => setOpen(!open)}
        >
          {open ? <HiX className="w-7 h-7" /> : <HiMenuAlt3 />}
        </button>
      </div>

      {/* Mobile/Tablet Dropdown */}
      <div
        className={`lg:hidden bg-white w-full border-t transition-all duration-300 ease-out
    overflow-hidden 
    ${open ? "opacity-100 h-auto" : "opacity-0 h-0 -translate-y-4"}
  `}
        style={{
          position: "fixed", // stays under navbar but scrolls with content
          top: "64px", // <— IMPORTANT: matches navbar height
          left: 0,
          right: 0,
          zIndex: 40,
        }}
      >
        <div className="container mx-auto px-4 py-4 space-y-4">
          {navItems.map((item, i) => (
            <Link
              key={i}
              to={item.path}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 text-caption transition ${
                pathname === item.path
                  ? "text-green-500 font-normal"
                  : "text-text-900 hover:text-green-500"
              }`}
            >
              {item.icon} {item.label}
            </Link>
          ))}

          <Link
            to="/all-categories"
            onClick={() => setOpen(false)}
            className="bg-green-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-green-600 transition"
          >
            <MdViewModule className="w-5 h-5" />
            <span>All Categories</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
