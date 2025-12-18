// ============================================
// BLOG POST QUERIES
// ============================================

// Fetch all blog posts with author and categories
export const postsQuery = `*[_type == "post"] | order(publishedAt desc) {
  _id,
  title,
  "slug": slug.current,
  publishedAt,
  "excerpt": array::join(string::split((pt::text(body)), "")[0..200], "") + "...",
  mainImage {
    asset->{
      _id,
      url
    },
    alt
  },
  author->{
    _id,
    name,
    "slug": slug.current,
    image {
      asset->{
        _id,
        url
      }
    }
  },
  categories[]->{
    _id,
    title,
    description
  },
  body
}`;

// Fetch single post by slug
export const postBySlugQuery = `*[_type == "post" && slug.current == $slug][0] {
  _id,
  title,
  "slug": slug.current,
  publishedAt,
  mainImage {
    asset->{
      _id,
      url
    },
    alt
  },
  body,
  author->{
    _id,
    name,
    "slug": slug.current,
    image {
      asset->{
        _id,
        url
      }
    },
    bio
  },
  categories[]->{
    _id,
    title,
    description
  }
}`;

// ============================================
// LEGAL DOCUMENT QUERIES
// ============================================

// Fetch all legal documents
export const legalDocumentsQuery = `*[_type == "legalDocument"] | order(_createdAt desc) {
  _id,
  title,
  "slug": slug.current,
  category,
  jurisdiction,
  tags,
  preview {
    asset->{
      _id,
      url
    },
    alt
  },
  "descriptionPreview": array::join(string::split((pt::text(description)), "")[0..150], "") + "..."
}`;

// Fetch legal documents by category
export const legalDocumentsByCategoryQuery = `*[_type == "legalDocument" && category == $category] | order(_createdAt desc) {
  _id,
  title,
  "slug": slug.current,
  category,
  jurisdiction,
  tags,
  preview {
    asset->{
      _id,
      url
    },
    alt
  },
  "descriptionPreview": array::join(string::split((pt::text(description)), "")[0..150], "") + "..."
}`;

// Fetch single legal document by slug
export const legalDocumentBySlugQuery = `*[_type == "legalDocument" && slug.current == $slug][0] {
  _id,
  title,
  "slug": slug.current,
  category,
  jurisdiction,
  tags,
  description,
  preview {
    asset->{
      _id,
      url
    },
    alt
  },
  image {
    asset->{
      _id,
      url
    },
    alt
  },
  template {
    asset->{
      _id,
      url,
      originalFilename,
      size
    }
  },
  _createdAt
}`;

// Get all unique categories
export const categoriesQuery = `array::unique(*[_type == "legalDocument"].category)`;

// Get all unique jurisdictions
export const jurisdictionsQuery = `array::unique(*[_type == "legalDocument"].jurisdiction)`;
