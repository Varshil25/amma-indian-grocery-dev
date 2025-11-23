import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { HiHome, HiFire, HiMenuAlt3 } from "react-icons/hi";
import { MdViewModule } from "react-icons/md";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  const navItems = [
    { label: "Home", icon: <HiHome className="w-5 h-5" />, path: "/" },
    { label: "Hot deals", icon: <HiFire className="w-5 h-5" />, path: "/hot-deals" },
    { label: "About Us", path: "/about" },
    { label: "Contact Us", path: "/contact" },
  ];

  return (
    <header className="w-full bg-white shadow-sm">
      <div className="container mx-auto flex items-center justify-between py-6 px-6">

        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img src="/logo.svg" className="w-16 h-auto" alt="Amma Grocery" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-10">
          {navItems.map((item, i) => (
            <Link
              key={i}
              to={item.path}
              className={`flex items-center gap-2 text-caption transition ${
                pathname === item.path
                  ? "text-green-500 "
                  : "text-text-500 hover:text-green-500"
              }`}
            >
              {item.icon} {item.label}
            </Link>
          ))}
        </nav>

        {/* Categories Button */}
        <button className="hidden md:flex bg-green-500 text-caption text-white px-6 py-3 rounded-lg items-center gap-2 hover:bg-green-700 transition">
          <MdViewModule className="w-5 h-5" />
          <span>All Categories</span>
        </button>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-3xl text-text-500"
          onClick={() => setOpen(!open)}
        >
          <HiMenuAlt3 />
        </button>
      </div>

      {/* Mobile Dropdown */}
      {open && (
        <div className="md:hidden bg-white px-6 py-4 space-y-4 border-t">
          {navItems.map((item, i) => (
            <Link
              key={i}
              to={item.path}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 text-title ${
                pathname === item.path
                  ? "text-green-600 font-semibold"
                  : "text-text-900"
              }`}
            >
              {item.icon} {item.label}
            </Link>
          ))}

          <button className="bg-green-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 w-full">
            <MdViewModule className="w-5 h-5" />
            <span>All Categories</span>
          </button>
        </div>
      )}
    </header>
  );
};

export default Navbar;
