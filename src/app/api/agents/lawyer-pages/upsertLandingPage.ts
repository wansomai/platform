import { Document, BLOCKS, INLINES } from '@contentful/rich-text-types';
import { getEnvironment } from './contentfulMgmt';

function faqToRichText(faq: { question: string; answer: string }[]): Document {
  return {
    nodeType: BLOCKS.DOCUMENT,
    data: {},
    content: faq.flatMap(({ question, answer }) => [
      {
        nodeType: BLOCKS.HEADING_3,
        content: [{ nodeType: 'text', value: question, marks: [], data: {} }],
        data: {},
      },
      {
        nodeType: BLOCKS.PARAGRAPH,
        content: [{ nodeType: 'text', value: answer, marks: [], data: {} }],
        data: {},
      },
    ]),
  };
}

type LandingPageInput = {
  practiceArea: string;
  practiceAreaName: string;
  location: string;
  locationName: string;
  faq: { question: string; answer: string }[];
};
export async function upsertLandingPage(record: LandingPageInput) {
  const env = await getEnvironment();
  const { practiceArea, practiceAreaName, location, locationName, faq } = record;
  const slug = `${practiceArea}-lawyer-${location}`;

  let entry;
  try {
    entry = await env.getEntry(slug);
  } catch {
    /* will create */
  }

  const fields: any = {
    title:          { 'en-US': `${practiceAreaName} Lawyer in ${locationName} | Book Consultation` },
    slug:           { 'en-US': slug },
    practiceArea:   { 'en-US': practiceAreaName },
    location:       { 'en-US': locationName },
    metaDescription:{ 'en-US': `Find an experienced ${practiceAreaName.toLowerCase()} lawyer in ${locationName}. Book consultation and receive personalized legal advice within 24 working hours.`},
  };

  // ---------- NEW: FAQ ----------
  if (faq && Array.isArray(faq) && faq.length) {
    fields.faq = { 'en-US': faqToRichText(faq) };
  }

  if (entry) {
    entry.fields = fields;
    await entry.update();
  } else {
    entry = await env.createEntryWithId('lawyerPages', slug, { fields });
  }
  await entry.publish();
}
