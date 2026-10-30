import React from "react";
import { Link } from "react-router-dom";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  breadcrumbs?: Breadcrumb[];
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, breadcrumbs }) => {
  return (
    // pt-12 + mt-8 clears the fixed site header
    <section className="w-full bg-background-secondary pt-12 pb-8 md:pb-12 select-none">
      <div className="container mt-8 mx-auto px-6 flex flex-col items-center text-center">

        <h1 className="text-[32px] sm:text-[40px] md:text-h3 leading-tight font-semibold text-text-500 [overflow-wrap:anywhere]">{title}</h1>

        {/* Conditional breadcrumb render */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="text-body-lg text-text-400 flex gap-1 flex-wrap">
            {breadcrumbs.map((item, index) => (
              <span key={index} className="flex gap-1">
                {item.href ? (
                  <Link to={item.href} className="hover:text-green-500 font-normal">
                    {item.label}
                  </Link>
                ) : (
                  <span className="font-medium text-green-600">{item.label}</span>
                )}
                {index < breadcrumbs.length - 1 && <span>/</span>}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default PageHeader;
