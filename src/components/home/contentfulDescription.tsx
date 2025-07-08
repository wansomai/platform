import React from "react";
import { Document } from "@contentful/rich-text-types";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { BLOCKS } from "@contentful/rich-text-types";

interface ContentSectionProps {
  /**
   * The FAQ rich‑text field as returned from Contentful
   */
  contentRichText: Document | null;
  /**
   * Optional className to tweak spacing from the parent layout
   */
  className?: string;
}

const ContentSection: React.FC<ContentSectionProps> = ({ contentRichText, className }) => {
  const options = {
    renderNode: {
      [BLOCKS.HEADING_3]: (node: any, children: React.ReactNode) => (
        <h3 className="text-xl font-bold my-2">{children}</h3>
      ),
      [BLOCKS.PARAGRAPH]: (node: any, children: React.ReactNode) => (
        <p className="text-lg mb-4">{children}</p>
      ),
      [BLOCKS.UL_LIST]: (node: any, children: React.ReactNode) => (
        <ul className="list-disc ml-6 mb-4">{children}</ul>
      ),
      [BLOCKS.LIST_ITEM]: (node: any, children: React.ReactNode) => (
        <li className="mb-1">{children}</li>
      ),
    },
  };

  return (
    <section className={`w-full mx-auto my-4 ${className ?? ""}`.trim()}>
      <div>
        {contentRichText ? documentToReactComponents(contentRichText, options) : null}
      </div>
    </section>
  );
};

export default ContentSection;
