import React from "react";
import { Link } from "react-router-dom";

// A simple, project-themed, industry-standard CTA component.
interface CTAProps {
  title?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  secondaryText?: string;
  secondaryLink?: string;
}

const CTA: React.FC<CTAProps> = ({
  title = "Join Amma Grocery Today!",
  description = "Experience fresh, fast, and quality groceries at great prices. Sign up and get your first delivery today.",
  buttonText = "Get Started",
  buttonLink = "/all-categories",
  secondaryText,
  secondaryLink
}) => {
  return (
    <section className="w-full bg-green-500 py-12 md:py-16 mx-auto mt-12 shadow-md text-center select-none">
      <div className="container mx-auto px-4 flex flex-col items-center justify-center">
        <h2 className="text-h4 md:text-h2 font-semibold text-white mb-4">{title}</h2>
        <p className="text-body-lg md:text-body-xl text-green-50 mb-8 max-w-2xl">{description}</p>
        <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
          <Link
            to={buttonLink}
            className="bg-white text-green-600 font-semibold px-8 py-3 rounded-lg hover:bg-yellow-600 hover:text-white transition-all shadow focus:outline-none focus:ring-2 focus:ring-green-300"
          >
            {buttonText}
          </Link>
          {secondaryText && secondaryLink && (
            <Link
              to={secondaryLink}
              className="text-white underline hover:text-yellow-300 transition mt-2 md:mt-0"
            >
              {secondaryText}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
};

export default CTA;
