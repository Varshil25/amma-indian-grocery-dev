import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

// Pages
import Home from "./pages/Home/Home";
import NotFound from "./pages/NotFound";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Aboutus from "./pages/AboutUs/Aboutus";
import Contactus from "./pages/ContactUs/contactus";
import AllCategories from "./pages/AllCategories/AllCategories";
import ProductList from "./pages/ProductList/Productlist";
import ProductDetails from "./pages/ProductList/ProductDetails";
import HotDeals from "./pages/HotDeals/HotDeals";

const App = () => {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<Aboutus />}/>
          <Route path="/contact" element={<Contactus />} />
          <Route path="/all-categories" element={<AllCategories />} />
          <Route path="/categories/:category" element={<ProductList />} />
          <Route path="/product/:productId" element={<ProductDetails />} />
          import HotDeals from "./pages/HotDeals/HotDeals";
          <Route path="/hot-deals" element={<HotDeals />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </HelmetProvider>
  );
};

export default App;
