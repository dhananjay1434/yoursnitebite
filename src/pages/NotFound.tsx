import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-nitebite-midnight">
      <SEO
        title="Page Not Found - 404"
        description="The page you're looking for doesn't exist. Return to Nitebite homepage to order late-night snacks and beverages delivered in 10 minutes."
        noindex={true}
      />

      <div className="text-center max-w-md mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-8xl font-bold text-nitebite-purple mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-nitebite-text mb-4">
            Oops! Page not found
          </h2>
          <p className="text-nitebite-text-secondary mb-8">
            The page you're looking for doesn't exist or has been moved.
            Let's get you back to ordering your favorite late-night snacks!
          </p>
        </div>

        <div className="space-y-4">
          <Button asChild className="w-full bg-nitebite-purple hover:bg-nitebite-purple/90">
            <Link to="/">
              <Home className="w-4 h-4 mr-2" />
              Return to Home
            </Link>
          </Button>

          <Button asChild variant="outline" className="w-full">
            <Link to="/products">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Browse Products
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
