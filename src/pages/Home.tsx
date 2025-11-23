import { Helmet } from "react-helmet-async";

export default function Home() {
  return (
    <>
       <div className="p-10 space-y-4">
      <h1 className="heading-1">Amma Grocery Store</h1>
      <p className="body-lg">
        Fresh Indian groceries delivered with love 🇮🇳❤️
      </p>

      <button className="btn-primary">Shop Now</button>
    </div>
    </>
  );
}
