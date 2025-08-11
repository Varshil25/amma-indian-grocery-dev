import Layout from "@/components/layout/Layout";
import SEO from "@/components/SEO";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQ = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {"@type": "Question", "name": "Do you offer delivery?", "acceptedAnswer": {"@type": "Answer", "text": "Not at the moment. We are a walk-in neighborhood store."}},
      {"@type": "Question", "name": "Where do your Indian products come from?", "acceptedAnswer": {"@type": "Answer", "text": "We source authentic Indian products directly from trusted suppliers and importers to ensure quality and authenticity."}},
      {"@type": "Question", "name": "Do you have organic options?", "acceptedAnswer": {"@type": "Answer", "text": "Yes, we carry a curated selection of certified organic products including spices, grains, and produce."}},
      {"@type": "Question", "name": "What payment methods do you accept?", "acceptedAnswer": {"@type": "Answer", "text": "We accept major credit cards, debit cards, and contactless payments."}},
      {"@type": "Question", "name": "Do you carry fresh Indian vegetables?", "acceptedAnswer": {"@type": "Answer", "text": "Yes, we regularly stock fresh Indian vegetables and herbs when in season."}},
      {"@type": "Question", "name": "Can you help me find specific Indian ingredients?", "acceptedAnswer": {"@type": "Answer", "text": "Absolutely! Our staff is knowledgeable about Indian cooking and can help you find the right ingredients for your recipes."}}
    ]
  };

  return (
    <Layout>
      <SEO title="FAQ | Amma Grocery" description="Answers to common questions about Amma Grocery in Malvern, PA." >
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </SEO>
      <section className="container mx-auto py-12 md:py-16">
        <h1 className="text-3xl font-bold">Frequently Asked Questions</h1>
        <Accordion type="single" collapsible className="mt-6 max-w-2xl">
          <AccordionItem value="q1">
            <AccordionTrigger>Do you offer delivery?</AccordionTrigger>
            <AccordionContent>Not at the moment. We are a walk-in neighborhood store.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="q2">
            <AccordionTrigger>Where do your Indian products come from?</AccordionTrigger>
            <AccordionContent>We source authentic Indian products directly from trusted suppliers and importers to ensure quality and authenticity.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="q3">
            <AccordionTrigger>Do you have organic options?</AccordionTrigger>
            <AccordionContent>Yes, we carry a curated selection of certified organic products including spices, grains, and produce.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="q4">
            <AccordionTrigger>What payment methods do you accept?</AccordionTrigger>
            <AccordionContent>We accept major credit cards, debit cards, and contactless payments.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="q5">
            <AccordionTrigger>Do you carry fresh Indian vegetables?</AccordionTrigger>
            <AccordionContent>Yes, we regularly stock fresh Indian vegetables and herbs when in season.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="q6">
            <AccordionTrigger>Can you help me find specific Indian ingredients?</AccordionTrigger>
            <AccordionContent>Absolutely! Our staff is knowledgeable about Indian cooking and can help you find the right ingredients for your recipes.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
    </Layout>
  );
};

export default FAQ;
