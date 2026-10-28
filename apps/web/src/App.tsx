import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

// Layout (always loaded)
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import { PageLoader } from "./components/LoadingSkeleton";
import CartDrawer from "./components/CartDrawer";

// Public Pages (eager — above-the-fold)
import Home from "./pages/Home/Home";
import NotFound from "./pages/NotFound";

// Lazy-loaded Pages
const Aboutus = lazy(() => import("./pages/AboutUs/Aboutus"));
const Contactus = lazy(() => import("./pages/ContactUs/contactus"));
const AllCategories = lazy(() => import("./pages/AllCategories/AllCategories"));
const ProductList = lazy(() => import("./pages/ProductList/Productlist"));
const ProductDetails = lazy(() => import("./pages/ProductList/ProductDetails"));
const HotDeals = lazy(() => import("./pages/HotDeals/HotDeals"));
const Login = lazy(() => import("./pages/Auth/Login"));
const Signup = lazy(() => import("./pages/Auth/Signup"));
const ForgotPassword = lazy(() => import("./pages/Auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/Auth/ResetPassword"));
const Profile = lazy(() => import("./pages/Profile/Profile"));
const CartPage = lazy(() => import("./pages/Cart/Cart"));
const WishlistPage = lazy(() => import("./pages/Wishlist/Wishlist"));
const Checkout = lazy(() => import("./pages/Checkout/Checkout"));
const OrderHistory = lazy(() => import("./pages/Orders/OrderHistory"));
const OrderDetail = lazy(() => import("./pages/Orders/OrderDetail"));
const Rewards = lazy(() => import("./pages/Rewards/Rewards"));
const StaticPage = lazy(() => import("./pages/StaticPage"));

const App = () => {
  return (
    <HelmetProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <ErrorBoundary>
          <a href="#main-content" className="skip-to-content">
            Skip to content
          </a>
          <Navbar />
          <main id="main-content" className="min-h-screen">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<Aboutus />} />
              <Route path="/contact" element={<Contactus />} />
              <Route path="/all-categories" element={<AllCategories />} />
              <Route path="/categories/:category" element={<ProductList />} />
              <Route path="/product/:productId" element={<ProductDetails />} />
              <Route path="/hot-deals" element={<HotDeals />} />

              {/* Static/Info pages */}
              <Route path="/payments" element={<StaticPage />} />
              <Route path="/refund" element={<StaticPage />} />
              <Route path="/shipping" element={<StaticPage />} />
              <Route path="/qa" element={<StaticPage />} />
              <Route path="/privacy-policy" element={<StaticPage />} />
              <Route path="/page/:slug" element={<StaticPage />} />

              {/* Auth routes */}
              <Route
                path="/login"
                element={
                  <ProtectedRoute requireAuth={false}>
                    <Login />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/signup"
                element={
                  <ProtectedRoute requireAuth={false}>
                    <Signup />
                  </ProtectedRoute>
                }
              />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Protected routes */}
              <Route
                path="/profile"
                element={<ProtectedRoute><Profile /></ProtectedRoute>}
              />
              <Route
                path="/cart"
                element={<ProtectedRoute><CartPage /></ProtectedRoute>}
              />
              <Route
                path="/wishlist"
                element={<ProtectedRoute><WishlistPage /></ProtectedRoute>}
              />
              <Route
                path="/checkout"
                element={<ProtectedRoute><Checkout /></ProtectedRoute>}
              />
              <Route
                path="/orders"
                element={<ProtectedRoute><OrderHistory /></ProtectedRoute>}
              />
              <Route
                path="/orders/:id"
                element={<ProtectedRoute><OrderDetail /></ProtectedRoute>}
              />
              <Route
                path="/rewards"
                element={<ProtectedRoute><Rewards /></ProtectedRoute>}
              />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          </main>
          <Footer />
          <CartDrawer />
        </ErrorBoundary>
      </BrowserRouter>
    </HelmetProvider>
  );
};

export default App;
