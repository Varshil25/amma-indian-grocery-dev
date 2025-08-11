import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-5xl font-bold">404</h1>
        <p className="text-lg text-muted-foreground mt-2">Oops! Page not found</p>
        <a href="/" className="inline-block mt-4 text-primary underline underline-offset-4">Return to Home</a>
      </div>
    </main>
  );
};

export default NotFound;
