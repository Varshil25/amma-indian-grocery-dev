import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center text-center p-6 gap-4">
      <h1 className="text-h3 font-bold text-green-500">404</h1>
      <p className="text-title text-text-300">Oops! The page you're looking for doesn't exist.</p>
      <Link
        to="/"
        className="mt-4 bg-green-500 text-white px-6 py-3 rounded-full hover:bg-green-600 transition font-medium"
      >
        Back to Home
      </Link>
    </div>
  );
};

export default NotFound;
