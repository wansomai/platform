import React, { useMemo } from "react";
import { Document, BLOCKS } from "@contentful/rich-text-types";
import { documentToPlainTextString } from "@contentful/rich-text-plain-text-renderer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FaqSectionProps {
  /**
   * The FAQ rich‑text field as returned from Contentful
   */
  faqRichText: Document | null;
  /**
   * Optional className to tweak spacing from the parent layout
   */
  className?: string;
}

/**
 * Extracts a list of Q‑and‑A pairs from a Contentful Rich‑text document.
 * We expect the structure to be:
 *   H3 (question)
 *   Paragraph (answer)
 * repeated three times.
 */
function extractPairs(rich: Document | null) {
  if (!rich) return [] as { q: string; a: string }[];
  const pairs: { q: string; a: string }[] = [];
  const { content } = rich;
  for (let i = 0; i < content.length; i++) {
    const node = content[i];
    if (node.nodeType === BLOCKS.HEADING_3) {
      const next = content[i + 1];
      const question = documentToPlainTextString(node);
      const answer = next ? documentToPlainTextString(next) : "";
      pairs.push({ q: question, a: answer });
    }
  }
  return pairs;
}

const FaqSection: React.FC<FaqSectionProps> = ({ faqRichText, className }) => {
  const qaPairs = useMemo(() => extractPairs(faqRichText), [faqRichText]);

  if (qaPairs.length === 0) return null;

  // Build FAQPage JSON‑LD once for SEO rich results
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: qaPairs.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: {
        "@type": "Answer",
        text: a,
      },
    })),
  };

  return (
    <section
      className={`w-full max-w-3xl mx-auto my-12 ${className ?? ""}`.trim()}
    >
      <h2 className="text-3xl font-semibold mb-6 text-center">
        Frequently Asked Questions
      </h2>

      {/* FAQ accordion */}
      <Accordion
        type="single"
        collapsible
        className="rounded-2xl shadow-sm divide-y divide-gray-200"
      >
        {qaPairs.map(({ q, a }, idx) => (
          <AccordionItem key={idx} value={`faq-${idx}`}>
            <AccordionTrigger className="py-4 px-4 text-left text-lg font-medium">
              {q}
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 leading-relaxed text-base text-gray-700">
              {a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Inject JSON‑LD for Google FAQ rich snippets */}
      <script type="application/ld+json">
        {JSON.stringify(faqSchema)}
      </script>
    </section>
  );
};

export default FaqSection;
