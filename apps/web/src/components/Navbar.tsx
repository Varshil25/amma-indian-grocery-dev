import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { HiHome, HiFire, HiMenuAlt3, HiX } from "react-icons/hi";
import { MdViewModule } from "react-icons/md";
import { User, LogOut, ChevronDown, ShoppingBag, Heart, Package, Gift } from "lucide-react";
import navbarLogo from "../assets/Logos/navbar_logo.svg";
import { useAuthStore } from "../stores/auth-store";
import { useLogout } from "../hooks/use-auth";
import { useCart } from "../hooks/use-cart";
import { useCartUIStore } from "../stores/cart-ui-store";
import SearchBar from "./SearchBar";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const { user, isAuthenticated } = useAuthStore();
  const logoutMutation = useLogout();
  const { data: cart } = useCart();
  const openDrawer = useCartUIStore((s) => s.openDrawer);
  const cartCount = cart?.itemCount ?? 0;
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : "";

  return (
    <header className="w-full bg-white shadow-sm fixed top-0 left-0 z-50">
      <div className="container mx-auto flex items-center justify-between py-3 px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img src={navbarLogo} className="w-12 h-auto" alt="Amma Grocery" />
        </Link>

        {/* Desktop Nav */}
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

        {/* Right side: Search + Categories + Auth */}
        <div className="hidden lg:flex items-center gap-4">
          <SearchBar className="w-64" />
          <Link
            to="/all-categories"
            className="bg-green-500 text-label text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition"
          >
            <MdViewModule className="w-5 h-5" />
            <span>All Categories</span>
          </Link>

          {/* Wishlist */}
          <Link
            to="/wishlist"
            className="relative p-2 rounded-lg text-text-300 hover:text-red-500 hover:bg-red-50 transition"
            title="Wishlist"
          >
            <Heart size={20} />
          </Link>

          {/* Cart */}
          <button
            onClick={openDrawer}
            className="relative p-2 rounded-lg text-text-300 hover:text-green-600 hover:bg-green-50 transition"
            title="Cart"
          >
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </button>

          {isAuthenticated && user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-background-secondary transition"
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.firstName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-body-sm font-semibold">
                    {initials}
                  </div>
                )}
                <span className="text-body-sm font-medium text-text-500 max-w-[100px] truncate">
                  {user.firstName}
                </span>
                <ChevronDown
                  size={14}
                  className={`text-text-200 transition-transform ${
                    userMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-text-50 py-2 z-50">
                  <div className="px-4 py-2 border-b border-text-50">
                    <p className="text-body-sm font-semibold text-text-500 truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-body-xs text-text-200 truncate">
                      {user.email}
                    </p>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-body-sm text-text-400 hover:bg-background-secondary transition"
                  >
                    <User size={16} />
                    My Account
                  </Link>
                  <Link
                    to="/orders"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-body-sm text-text-400 hover:bg-background-secondary transition"
                  >
                    <Package size={16} />
                    My Orders
                  </Link>
                  <Link
                    to="/rewards"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-body-sm text-text-400 hover:bg-background-secondary transition"
                  >
                    <Gift size={16} />
                    Rewards & Referrals
                  </Link>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      logoutMutation.mutate();
                    }}
                    className="flex items-center gap-3 px-4 py-2.5 text-body-sm text-red-500 hover:bg-red-50 transition w-full text-left"
                  >
                    <LogOut size={16} />
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-green-500 text-green-600 hover:bg-green-50 transition text-body-sm font-medium"
            >
              <User size={16} />
              Login
            </Link>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="lg:hidden text-3xl text-text-500 transition"
          onClick={() => setOpen(!open)}
        >
          {open ? <HiX className="w-7 h-7" /> : <HiMenuAlt3 />}
        </button>
      </div>

      {/* Mobile/Tablet Dropdown */}
      <div
        className={`lg:hidden bg-white w-full border-t transition-all duration-300 ease-out overflow-hidden fixed top-16 left-0 right-0 z-40 ${
          open ? "opacity-100 max-h-screen" : "opacity-0 max-h-0 -translate-y-4"
        }`}
      >
        <div className="container mx-auto px-4 py-4 space-y-4">
          <SearchBar onClose={() => setOpen(false)} />
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

          {/* Mobile Wishlist & Cart */}
          <Link
            to="/wishlist"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 text-caption text-text-500 hover:text-red-500 transition"
          >
            <Heart className="w-5 h-5" />
            Wishlist
          </Link>
          <button
            onClick={() => {
              setOpen(false);
              openDrawer();
            }}
            className="flex items-center gap-3 text-caption text-text-500 hover:text-green-500 transition"
          >
            <ShoppingBag className="w-5 h-5" />
            Cart {cartCount > 0 && `(${cartCount})`}
          </button>

          {/* Mobile Auth */}
          {isAuthenticated && user ? (
            <>
              <Link
                to="/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 text-caption text-text-500 hover:text-green-500 transition"
              >
                <User className="w-5 h-5" />
                My Account
              </Link>
              <Link
                to="/rewards"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 text-caption text-text-500 hover:text-green-500 transition"
              >
                <Gift className="w-5 h-5" />
                Rewards & Referrals
              </Link>
              <button
                onClick={() => {
                  setOpen(false);
                  logoutMutation.mutate();
                }}
                className="flex items-center gap-3 text-caption text-red-500 hover:text-red-600 transition"
              >
                <LogOut className="w-5 h-5" />
                Log Out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 text-caption text-green-600 hover:text-green-700 transition"
            >
              <User className="w-5 h-5" />
              Login / Sign Up
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
