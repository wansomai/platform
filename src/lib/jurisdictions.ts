// src/lib/jurisdictions.ts

import { Jurisdiction } from "../types/projects";

export const JURISDICTIONS: Jurisdiction[] = [
  // United States
  {
    id: 'us-federal',
    name: 'United States (Federal)',
    country: 'United States',
    region: 'North America',
    legalSystem: 'common-law',
    citationStyle: 'bluebook',
    courtSystem: ['Supreme Court', 'Circuit Courts', 'District Courts'],
    languages: ['English'],
    isPopular: true
  },
  {
    id: 'us-ca',
    name: 'California',
    country: 'United States',
    state: 'California',
    region: 'North America',
    legalSystem: 'common-law',
    citationStyle: 'bluebook',
    courtSystem: ['California Supreme Court', 'Courts of Appeal', 'Superior Courts'],
    languages: ['English'],
    isPopular: true
  },
  {
    id: 'us-ny',
    name: 'New York',
    country: 'United States',
    state: 'New York',
    region: 'North America',
    legalSystem: 'common-law',
    citationStyle: 'bluebook',
    courtSystem: ['New York Court of Appeals', 'Appellate Division', 'Supreme Court'],
    languages: ['English'],
    isPopular: true
  },
  {
    id: 'us-tx',
    name: 'Texas',
    country: 'United States',
    state: 'Texas',
    region: 'North America',
    legalSystem: 'common-law',
    citationStyle: 'bluebook',
    courtSystem: ['Texas Supreme Court', 'Courts of Appeals', 'District Courts'],
    languages: ['English']
  },
  {
    id: 'us-fl',
    name: 'Florida',
    country: 'United States',
    state: 'Florida',
    region: 'North America',
    legalSystem: 'common-law',
    citationStyle: 'bluebook',
    courtSystem: ['Florida Supreme Court', 'District Courts of Appeal', 'Circuit Courts'],
    languages: ['English']
  },

  // United Kingdom
  {
    id: 'uk-england-wales',
    name: 'England and Wales',
    country: 'United Kingdom',
    region: 'Europe',
    legalSystem: 'common-law',
    citationStyle: 'oscola',
    courtSystem: ['Supreme Court', 'Court of Appeal', 'High Court'],
    languages: ['English'],
    isPopular: true
  },
  {
    id: 'uk-scotland',
    name: 'Scotland',
    country: 'United Kingdom',
    region: 'Europe',
    legalSystem: 'mixed',
    citationStyle: 'oscola',
    courtSystem: ['Supreme Court', 'Court of Session', 'Sheriff Courts'],
    languages: ['English', 'Scots Gaelic']
  },
  {
    id: 'uk-northern-ireland',
    name: 'Northern Ireland',
    country: 'United Kingdom',
    region: 'Europe',
    legalSystem: 'common-law',
    citationStyle: 'oscola',
    courtSystem: ['Supreme Court', 'Court of Appeal', 'High Court'],
    languages: ['English']
  },

  // Canada
  {
    id: 'ca-federal',
    name: 'Canada (Federal)',
    country: 'Canada',
    region: 'North America',
    legalSystem: 'common-law',
    citationStyle: 'mcgill',
    courtSystem: ['Supreme Court of Canada', 'Federal Court of Appeal', 'Federal Court'],
    languages: ['English', 'French'],
    isPopular: true
  },
  {
    id: 'ca-on',
    name: 'Ontario',
    country: 'Canada',
    state: 'Ontario',
    region: 'North America',
    legalSystem: 'common-law',
    citationStyle: 'mcgill',
    courtSystem: ['Court of Appeal for Ontario', 'Superior Court of Justice'],
    languages: ['English', 'French']
  },
  {
    id: 'ca-qc',
    name: 'Quebec',
    country: 'Canada',
    state: 'Quebec',
    region: 'North America',
    legalSystem: 'mixed',
    citationStyle: 'mcgill',
    courtSystem: ['Quebec Court of Appeal', 'Superior Court'],
    languages: ['French', 'English']
  },

  // Australia
  {
    id: 'au-federal',
    name: 'Australia (Federal)',
    country: 'Australia',
    region: 'Oceania',
    legalSystem: 'common-law',
    citationStyle: 'aglc',
    courtSystem: ['High Court of Australia', 'Federal Court', 'Federal Circuit Court'],
    languages: ['English'],
    isPopular: true
  },
  {
    id: 'au-nsw',
    name: 'New South Wales',
    country: 'Australia',
    state: 'New South Wales',
    region: 'Oceania',
    legalSystem: 'common-law',
    citationStyle: 'aglc',
    courtSystem: ['NSW Court of Appeal', 'NSW Supreme Court'],
    languages: ['English']
  },

  // Kenya
  {
    id: 'ke',
    name: 'Kenya',
    country: 'Kenya',
    region: 'Africa',
    legalSystem: 'mixed',
    citationStyle: 'local',
    courtSystem: ['Supreme Court', 'Court of Appeal', 'High Court'],
    languages: ['English', 'Swahili'],
    isPopular: true
  },

  // Uganda
  {
    id: 'ug',
    name: 'Uganda',
    country: 'Uganda',
    region: 'Africa',
    legalSystem: 'mixed',
    citationStyle: 'local',
    courtSystem: ['Supreme Court', 'Court of Appeal', 'High Court', 'Magistrate Courts'],
    languages: ['English', 'Swahili'],
    isPopular: true
  },

  // Tanzania
  {
    id: 'tz',
    name: 'Tanzania',
    country: 'Tanzania',
    region: 'Africa',
    legalSystem: 'mixed',
    citationStyle: 'local',
    courtSystem: ['Supreme Court', 'Court of Appeal', 'High Court', 'District Courts'],
    languages: ['English', 'Swahili'],
    isPopular: true
  },

  // Nigeria
  {
    id: 'ng',
    name: 'Nigeria',
    country: 'Nigeria',
    region: 'Africa',
    legalSystem: 'mixed',
    citationStyle: 'local',
    courtSystem: ['Supreme Court', 'Court of Appeal', 'Federal High Court'],
    languages: ['English'],
    isPopular: true
  },

  // South Africa
  {
    id: 'za',
    name: 'South Africa',
    country: 'South Africa',
    region: 'Africa',
    legalSystem: 'mixed',
    citationStyle: 'local',
    courtSystem: ['Constitutional Court', 'Supreme Court of Appeal', 'High Courts'],
    languages: ['English', 'Afrikaans'],
    isPopular: true
  },

  // Zambia
  {
    id: 'zm',
    name: 'Zambia',
    country: 'Zambia',
    region: 'Africa',
    legalSystem: 'mixed',
    citationStyle: 'local',
    courtSystem: ['Supreme Court', 'Court of Appeal', 'High Court', 'Subordinate Courts'],
    languages: ['English'],
    isPopular: false
  },

  // Malawi
  {
    id: 'mw',
    name: 'Malawi',
    country: 'Malawi',
    region: 'Africa',
    legalSystem: 'mixed',
    citationStyle: 'local',
    courtSystem: ['Supreme Court', 'High Court', 'Magistrate Courts'],
    languages: ['English', 'Chichewa'],
    isPopular: false
  },

  // Ethiopia
  {
    id: 'et',
    name: 'Ethiopia',
    country: 'Ethiopia',
    region: 'Africa',
    legalSystem: 'civil-law',
    citationStyle: 'local',
    courtSystem: ['Federal Supreme Court', 'Federal High Court', 'Federal First Instance Court'],
    languages: ['Amharic', 'English'],
    isPopular: false
  },

  // Rwanda
  {
    id: 'rw',
    name: 'Rwanda',
    country: 'Rwanda',
    region: 'Africa',
    legalSystem: 'civil-law',
    citationStyle: 'local',
    courtSystem: ['Supreme Court', 'High Court', 'Intermediate Courts', 'Primary Courts'],
    languages: ['Kinyarwanda', 'English', 'French'],
    isPopular: false
  },

  // European Union
  {
    id: 'eu',
    name: 'European Union',
    country: 'European Union',
    region: 'Europe',
    legalSystem: 'civil-law',
    citationStyle: 'local',
    courtSystem: ['Court of Justice', 'General Court'],
    languages: ['English', 'French', 'German', 'Spanish', 'Italian'],
    isPopular: true
  },

  // Germany
  {
    id: 'de',
    name: 'Germany',
    country: 'Germany',
    region: 'Europe',
    legalSystem: 'civil-law',
    citationStyle: 'local',
    courtSystem: ['Federal Constitutional Court', 'Federal Court of Justice'],
    languages: ['German'],
    isPopular: true
  },

  // France
  {
    id: 'fr',
    name: 'France',
    country: 'France',
    region: 'Europe',
    legalSystem: 'civil-law',
    citationStyle: 'local',
    courtSystem: ['Court of Cassation', 'Council of State'],
    languages: ['French']
  },

  // India
  {
    id: 'in',
    name: 'India',
    country: 'India',
    region: 'Asia',
    legalSystem: 'mixed',
    citationStyle: 'local',
    courtSystem: ['Supreme Court', 'High Courts', 'District Courts'],
    languages: ['English', 'Hindi'],
    isPopular: true
  },

  // Singapore
  {
    id: 'sg',
    name: 'Singapore',
    country: 'Singapore',
    region: 'Asia',
    legalSystem: 'common-law',
    citationStyle: 'local',
    courtSystem: ['Court of Appeal', 'High Court', 'State Courts'],
    languages: ['English']
  },

  // Hong Kong
  {
    id: 'hk',
    name: 'Hong Kong',
    country: 'Hong Kong',
    region: 'Asia',
    legalSystem: 'common-law',
    citationStyle: 'local',
    courtSystem: ['Court of Final Appeal', 'Court of Appeal', 'Court of First Instance'],
    languages: ['English', 'Chinese']
  }
];

// Helper functions
export const getJurisdictionById = (id: string): Jurisdiction | undefined => {
  return JURISDICTIONS.find(j => j.id === id);
};

export const getJurisdictionsByRegion = (region: string): Jurisdiction[] => {
  return JURISDICTIONS.filter(j => j.region === region);
};

export const getPopularJurisdictions = (): Jurisdiction[] => {
  return JURISDICTIONS.filter(j => j.isPopular);
};

export const searchJurisdictions = (query: string): Jurisdiction[] => {
  const searchTerm = query.toLowerCase();
  return JURISDICTIONS.filter(j => 
    j.name.toLowerCase().includes(searchTerm) ||
    j.country.toLowerCase().includes(searchTerm) ||
    j.state?.toLowerCase().includes(searchTerm)
  );
};

export const REGIONS = [
  'North America',
  'Europe', 
  'Africa',
  'Asia',
  'Oceania',
  'South America'
];

// Jurisdiction-specific instruction templates
export const getJurisdictionInstructions = (jurisdiction: Jurisdiction): string => {
  const baseInstructions = `You are now operating under ${jurisdiction.name} jurisdiction. `;
  
  let specificInstructions = '';
  
  switch (jurisdiction.legalSystem) {
    case 'common-law':
      specificInstructions += 'This is a common law jurisdiction. Prioritize case law and judicial precedent in your analysis. ';
      break;
    case 'civil-law':
      specificInstructions += 'This is a civil law jurisdiction. Focus on statutory interpretation and codified law. ';
      break;
    case 'mixed':
      specificInstructions += 'This is a mixed legal system. Consider both statutory law and case law as appropriate. ';
      break;
  }
  
  specificInstructions += `Use ${jurisdiction.citationStyle} citation style for legal references. `;
  
  if (jurisdiction.languages.length > 1) {
    specificInstructions += `This jurisdiction operates in multiple languages: ${jurisdiction.languages.join(', ')}. `;
  }
  
  if (jurisdiction.courtSystem.length > 0) {
    specificInstructions += `The court system includes: ${jurisdiction.courtSystem.join(', ')}. `;
  }
  
  return baseInstructions + specificInstructions;
};