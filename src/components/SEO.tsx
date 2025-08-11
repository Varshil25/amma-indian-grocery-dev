import { Helmet } from "react-helmet-async";

type SEOProps = {
  title: string;
  description: string;
  canonical?: string;
  children?: React.ReactNode;
};

const SEO = ({ title, description, canonical, children }: SEOProps) => {
  const url = canonical || (typeof window !== 'undefined' ? window.location.href : undefined);
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {url && <link rel="canonical" href={url} />}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {url && <meta property="og:url" content={url} />}
      {children}
    </Helmet>
  );
};

export default SEO;
