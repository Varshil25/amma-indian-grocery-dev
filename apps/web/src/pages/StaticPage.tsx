import { useParams, useLocation } from "react-router-dom";
import { Loader2, FileText } from "lucide-react";
import PageHeader from "../components/PageHeader";
import SEO from "../components/SEO";
import { useStaticPage } from "../hooks/use-content";

const slugToTitle: Record<string, string> = {
  "payments": "Payments",
  "refund": "Refund Policy",
  "shipping": "Shipping Policy",
  "qa": "Q&A",
  "faq": "Q&A",
  "privacy-policy": "Privacy Policy",
};

export default function StaticPage() {
  const { slug: paramSlug } = useParams();
  const location = useLocation();
  // Use param slug for /page/:slug, otherwise derive from path (e.g. /payments -> payments)
  const slug = paramSlug || location.pathname.replace(/^\//, "");
  const { data: page, isLoading, isError } = useStaticPage(slug || "");

  const fallbackTitle = slugToTitle[slug || ""] || slug?.replace(/-/g, " ") || "Page";

  if (isLoading) {
    return (
      <>
        <PageHeader
          title={fallbackTitle}
          breadcrumbs={[{ label: "Home", href: "/" }, { label: fallbackTitle }]}
        />
        <div className="container mx-auto px-4 sm:px-6 py-16 md:py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        </div>
      </>
    );
  }

  if (isError || !page) {
    return (
      <>
        <PageHeader
          title={fallbackTitle}
          breadcrumbs={[{ label: "Home", href: "/" }, { label: fallbackTitle }]}
        />
        <div className="container mx-auto px-4 sm:px-6 py-16 md:py-20 text-center">
          <FileText size={48} className="mx-auto text-text-100 mb-4" />
          <h2 className="text-h5 font-semibold text-text-500 mb-2">Coming Soon</h2>
          <p className="text-text-300 text-body-lg">
            This page is being updated. Please check back later.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title={page.title} />
      <PageHeader
        title={page.title}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: page.title }]}
      />
      <div className="container mx-auto px-4 sm:px-6 py-8 md:py-12">
        <div className="max-w-3xl mx-auto text-body-md sm:text-body-lg text-text-400 whitespace-pre-line [overflow-wrap:anywhere]">
          {page.content}
        </div>
      </div>
    </>
  );
}
