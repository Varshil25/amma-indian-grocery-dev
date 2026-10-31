import React from "react";
import { Link } from "react-router-dom";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  breadcrumbs?: Breadcrumb[];
  /** Use "p" when the page has its own h1 below (e.g. the product name), so there is only one h1. */
  titleAs?: "h1" | "p";
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, breadcrumbs, titleAs: Title = "h1" }) => {
  return (
    // pt-12 + mt-8 clears the fixed site header
    <section className="w-full bg-background-secondary pt-12 pb-8 md:pb-12">
      <div className="container mt-8 mx-auto px-4 sm:px-6 flex flex-col items-center text-center">

        <Title className="text-h3 font-semibold text-text-500 [overflow-wrap:anywhere]">{title}</Title>

        {/* Conditional breadcrumb render */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mt-1 max-w-full">
            <ol className="text-body-sm sm:text-body-md text-text-400 flex flex-wrap justify-center gap-x-1">
              {breadcrumbs.map((item, index) => {
                const last = index === breadcrumbs.length - 1;
                return (
                  <li key={index} className={`flex gap-1 ${last ? "min-w-0" : ""}`}>
                    {item.href ? (
                      <Link to={item.href} className="hover:text-green-500 font-normal">
                        {item.label}
                      </Link>
                    ) : (
                      // a long product name stays on one line instead of wrapping the trail
                      <span aria-current="page" className="font-medium text-green-600 line-clamp-1 [overflow-wrap:anywhere]">
                        {item.label}
                      </span>
                    )}
                    {!last && <span aria-hidden="true">/</span>}
                  </li>
                );
              })}
            </ol>
          </nav>
        )}
      </div>
    </section>
  );
};

export default PageHeader;
