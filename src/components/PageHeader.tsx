import React from "react";
import { Link, useLocation } from "react-router-dom";

// Allow breadcrumb prop to optionally accept a pre-formatted string (e.g. "Home / About Us") or BreadcrumbItem[]
type BreadcrumbItem = {
  label: string;
  to?: string;
};
type PageHeaderProps = {
  title: string;
  breadcrumb?: BreadcrumbItem[] | string; // Accept string also
};

// Build breadcrumb array from string ("Home / About Us") or fallback to default builder
function parseBreadcrumbString(breadcrumb: string): BreadcrumbItem[] {
  const parts = breadcrumb.split("/").map(part => part.trim()).filter(Boolean);
  return parts.map((label, idx) => {
    // Only Home gets a link
    if (idx === 0) {
      return { label, to: "/" };
    }
    return { label };
  });
}

function createDefaultBreadcrumb(location: ReturnType<typeof useLocation>): BreadcrumbItem[] {
  const paths = location.pathname.split("/").filter(Boolean);
  let currentPath = "";
  const items: BreadcrumbItem[] = [
    { label: "Home", to: "/" }
  ];

  paths.forEach((part, idx) => {
    currentPath += "/" + part;
    const label = part.replace(/[-_]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    if (idx === paths.length - 1) {
      items.push({ label });
    } else {
      items.push({ label, to: currentPath });
    }
  });

  return items;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, breadcrumb }) => {
  const location = useLocation();
  let crumbs: BreadcrumbItem[] = [];

  if (typeof breadcrumb === "string") {
    crumbs = parseBreadcrumbString(breadcrumb);
  } else if (breadcrumb && breadcrumb.length > 0) {
    crumbs = breadcrumb;
  } else {
    crumbs = createDefaultBreadcrumb(location);
  }

  return (
    <section className="w-full mt-12 py-10 md:py-14 bg-background-secondary select-none">
      <div className="container mx-auto flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-h4 md:text-h2 font-semibold text-text-500">{title}</h1>
        <nav className="text-body-lg md:text-body-xl text-text-400 mt-3 flex flex-wrap items-center justify-center gap-1" aria-label="Breadcrumb">
          {crumbs.map((item, idx) => (
            <span className="flex items-center gap-1" key={idx}>
              {item.to ? (
                <Link
                  to={item.to}
                  className="hover:text-green-500 transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-green-500 font-medium">{item.label}</span>
              )}
              {idx < crumbs.length - 1 && <span className="mx-1 text-text-300">/</span>}
            </span>
          ))}
        </nav>
      </div>
    </section>
  );
};

export default PageHeader;
