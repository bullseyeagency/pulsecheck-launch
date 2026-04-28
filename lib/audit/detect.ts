import { CrawlData } from "./types";

interface DetectionResult {
  industry: string;
  location: string;
}

/**
 * Detects the industry and location of a business from crawl data.
 * Uses JSON-LD, meta tags, headings, and page content for signals.
 */
export function detectIndustryAndLocation(
  crawlData: CrawlData
): DetectionResult {
  const industry = detectIndustry(crawlData);
  const location = detectLocation(crawlData);
  return { industry, location };
}

function detectIndustry(crawlData: CrawlData): string {
  // Check JSON-LD for business type
  for (const item of crawlData.jsonLd) {
    const type = item["@type"] as string | undefined;
    if (type && type !== "WebSite" && type !== "WebPage") {
      const industryMap: Record<string, string> = {
        Restaurant: "restaurant",
        FoodEstablishment: "restaurant",
        Dentist: "dentist",
        MedicalBusiness: "medical",
        HealthAndBeautyBusiness: "beauty",
        HomeAndConstructionBusiness: "home services",
        Plumber: "plumbing",
        Electrician: "electrician",
        RoofingContractor: "roofing",
        LegalService: "legal",
        Attorney: "legal",
        RealEstateAgent: "real estate",
        AutoRepair: "auto repair",
        AutoDealer: "auto dealer",
        FinancialService: "financial services",
        InsuranceAgency: "insurance",
        Store: "retail",
        LodgingBusiness: "hospitality",
        FitnessCenter: "fitness",
        EducationalOrganization: "education",
      };
      if (industryMap[type]) return industryMap[type];
    }

    if (item.industry) return String(item.industry).toLowerCase();
  }

  // Analyze title + description for industry signals
  const text = `${crawlData.title} ${crawlData.metaDescription} ${crawlData.headings.map((h) => h.text).join(" ")}`.toLowerCase();

  const industryKeywords: Record<string, string[]> = {
    "fence contractor": ["fence", "fencing", "vinyl fence", "chain link"],
    restaurant: ["restaurant", "dining", "menu", "cuisine", "food"],
    dentist: ["dental", "dentist", "orthodont", "teeth"],
    plumbing: ["plumber", "plumbing", "drain", "pipe"],
    roofing: ["roof", "roofing", "shingle"],
    hvac: ["hvac", "heating", "cooling", "air conditioning"],
    legal: ["attorney", "lawyer", "law firm", "legal"],
    "real estate": ["real estate", "realtor", "homes for sale", "property"],
    "auto repair": ["auto repair", "mechanic", "car repair"],
    ecommerce: ["shop", "store", "buy", "cart", "checkout"],
    saas: ["software", "platform", "saas", "cloud"],
    marketing: ["marketing", "advertising", "agency", "seo", "digital"],
    fitness: ["gym", "fitness", "training", "workout"],
    beauty: ["salon", "spa", "beauty", "hair"],
    medical: ["doctor", "clinic", "medical", "health"],
    landscaping: ["landscaping", "lawn", "garden", "tree service"],
    cleaning: ["cleaning", "janitorial", "maid", "pressure wash"],
    pest: ["pest control", "exterminator", "termite"],
    photography: ["photographer", "photography", "photo", "portrait"],
    construction: ["construction", "contractor", "builder", "remodel"],
  };

  for (const [industry, keywords] of Object.entries(industryKeywords)) {
    if (keywords.some((kw) => text.includes(kw))) {
      return industry;
    }
  }

  return "general business";
}

function detectLocation(crawlData: CrawlData): string {
  // Check JSON-LD for address
  for (const item of crawlData.jsonLd) {
    const address = item.address as Record<string, string> | undefined;
    if (address) {
      const city = address.addressLocality || "";
      const state = address.addressRegion || "";
      if (city && state) return `${city}, ${state}`;
      if (city) return city;
      if (state) return state;
    }
    const areaServed = item.areaServed;
    if (typeof areaServed === "string") return areaServed;
    if (areaServed && typeof areaServed === "object") {
      const area = areaServed as Record<string, string>;
      if (area.name) return area.name;
    }
  }

  // Check NAP
  if (crawlData.nap.address) {
    return crawlData.nap.address;
  }

  // Scan title, meta, headings, and OG tags for location signals
  const headingText = crawlData.headings.map((h) => h.text).join(' ');
  const ogLocation = crawlData.ogTags?.description || '';
  const text = `${crawlData.title} ${crawlData.metaDescription} ${headingText} ${ogLocation}`;

  // "City, ST" pattern (e.g. "Phoenix, AZ")
  const cityStateMatch = text.match(
    /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)?),?\s+([A-Z]{2})\b/
  );
  if (cityStateMatch) {
    return `${cityStateMatch[1]}, ${cityStateMatch[2]}`;
  }

  // Phone area code → state fallback
  const phoneMatch = (crawlData.nap?.phone || text).match(/\((\d{3})\)|\b(\d{3})[-.\s]\d{3}/);
  if (phoneMatch) {
    const areaCode = phoneMatch[1] || phoneMatch[2];
    const areaCodeState = getStateFromAreaCode(areaCode);
    if (areaCodeState) return areaCodeState;
  }

  return "United States";
}

function getStateFromAreaCode(code: string): string | null {
  const map: Record<string, string> = {
    '205': 'Alabama', '251': 'Alabama', '256': 'Alabama', '334': 'Alabama',
    '907': 'Alaska',
    '480': 'Arizona', '520': 'Arizona', '602': 'Arizona', '623': 'Arizona', '928': 'Arizona',
    '479': 'Arkansas', '501': 'Arkansas', '870': 'Arkansas',
    '209': 'California', '213': 'California', '310': 'California', '323': 'California',
    '408': 'California', '415': 'California', '424': 'California', '442': 'California',
    '510': 'California', '530': 'California', '559': 'California', '562': 'California',
    '619': 'California', '626': 'California', '650': 'California', '657': 'California',
    '661': 'California', '669': 'California', '707': 'California', '714': 'California',
    '747': 'California', '760': 'California', '805': 'California', '818': 'California',
    '831': 'California', '858': 'California', '909': 'California', '916': 'California',
    '925': 'California', '949': 'California', '951': 'California',
    '303': 'Colorado', '719': 'Colorado', '720': 'Colorado', '970': 'Colorado',
    '203': 'Connecticut', '475': 'Connecticut', '860': 'Connecticut',
    '302': 'Delaware',
    '239': 'Florida', '305': 'Florida', '321': 'Florida', '352': 'Florida',
    '386': 'Florida', '407': 'Florida', '561': 'Florida', '727': 'Florida',
    '754': 'Florida', '772': 'Florida', '786': 'Florida', '813': 'Florida',
    '850': 'Florida', '863': 'Florida', '904': 'Florida', '941': 'Florida', '954': 'Florida',
    '229': 'Georgia', '404': 'Georgia', '470': 'Georgia', '478': 'Georgia',
    '678': 'Georgia', '706': 'Georgia', '762': 'Georgia', '770': 'Georgia', '912': 'Georgia',
    '808': 'Hawaii',
    '208': 'Idaho',
    '217': 'Illinois', '224': 'Illinois', '309': 'Illinois', '312': 'Illinois',
    '331': 'Illinois', '618': 'Illinois', '630': 'Illinois', '708': 'Illinois',
    '773': 'Illinois', '779': 'Illinois', '815': 'Illinois', '847': 'Illinois', '872': 'Illinois',
    '219': 'Indiana', '260': 'Indiana', '317': 'Indiana', '463': 'Indiana',
    '574': 'Indiana', '765': 'Indiana', '812': 'Indiana', '930': 'Indiana',
    '319': 'Iowa', '515': 'Iowa', '563': 'Iowa', '641': 'Iowa', '712': 'Iowa',
    '316': 'Kansas', '620': 'Kansas', '785': 'Kansas', '913': 'Kansas',
    '270': 'Kentucky', '364': 'Kentucky', '502': 'Kentucky', '606': 'Kentucky', '859': 'Kentucky',
    '225': 'Louisiana', '318': 'Louisiana', '337': 'Louisiana', '504': 'Louisiana', '985': 'Louisiana',
    '207': 'Maine',
    '240': 'Maryland', '301': 'Maryland', '410': 'Maryland', '443': 'Maryland', '667': 'Maryland',
    '339': 'Massachusetts', '351': 'Massachusetts', '413': 'Massachusetts',
    '508': 'Massachusetts', '617': 'Massachusetts', '774': 'Massachusetts',
    '781': 'Massachusetts', '857': 'Massachusetts', '978': 'Massachusetts',
    '231': 'Michigan', '248': 'Michigan', '269': 'Michigan', '313': 'Michigan',
    '517': 'Michigan', '586': 'Michigan', '616': 'Michigan', '734': 'Michigan',
    '810': 'Michigan', '906': 'Michigan', '947': 'Michigan', '989': 'Michigan',
    '218': 'Minnesota', '320': 'Minnesota', '507': 'Minnesota',
    '612': 'Minnesota', '651': 'Minnesota', '763': 'Minnesota', '952': 'Minnesota',
    '228': 'Mississippi', '601': 'Mississippi', '662': 'Mississippi', '769': 'Mississippi',
    '314': 'Missouri', '417': 'Missouri', '573': 'Missouri',
    '636': 'Missouri', '660': 'Missouri', '816': 'Missouri',
    '406': 'Montana',
    '308': 'Nebraska', '402': 'Nebraska', '531': 'Nebraska',
    '702': 'Nevada', '725': 'Nevada', '775': 'Nevada',
    '603': 'New Hampshire',
    '201': 'New Jersey', '551': 'New Jersey', '609': 'New Jersey',
    '732': 'New Jersey', '848': 'New Jersey', '856': 'New Jersey',
    '862': 'New Jersey', '908': 'New Jersey', '973': 'New Jersey',
    '505': 'New Mexico', '575': 'New Mexico',
    '212': 'New York', '315': 'New York', '332': 'New York', '347': 'New York',
    '516': 'New York', '518': 'New York', '585': 'New York', '607': 'New York',
    '631': 'New York', '646': 'New York', '680': 'New York', '716': 'New York',
    '718': 'New York', '845': 'New York', '914': 'New York', '917': 'New York', '929': 'New York',
    '252': 'North Carolina', '336': 'North Carolina', '704': 'North Carolina',
    '743': 'North Carolina', '828': 'North Carolina', '910': 'North Carolina',
    '919': 'North Carolina', '980': 'North Carolina', '984': 'North Carolina',
    '701': 'North Dakota',
    '216': 'Ohio', '220': 'Ohio', '234': 'Ohio', '330': 'Ohio', '380': 'Ohio',
    '419': 'Ohio', '440': 'Ohio', '513': 'Ohio', '567': 'Ohio',
    '614': 'Ohio', '740': 'Ohio', '937': 'Ohio',
    '405': 'Oklahoma', '539': 'Oklahoma', '580': 'Oklahoma', '918': 'Oklahoma',
    '458': 'Oregon', '503': 'Oregon', '541': 'Oregon', '971': 'Oregon',
    '215': 'Pennsylvania', '223': 'Pennsylvania', '267': 'Pennsylvania',
    '272': 'Pennsylvania', '412': 'Pennsylvania', '445': 'Pennsylvania',
    '484': 'Pennsylvania', '570': 'Pennsylvania', '610': 'Pennsylvania',
    '717': 'Pennsylvania', '724': 'Pennsylvania', '814': 'Pennsylvania',
    '878': 'Pennsylvania',
    '401': 'Rhode Island',
    '803': 'South Carolina', '839': 'South Carolina', '843': 'South Carolina', '864': 'South Carolina',
    '605': 'South Dakota',
    '423': 'Tennessee', '615': 'Tennessee', '629': 'Tennessee',
    '731': 'Tennessee', '865': 'Tennessee', '901': 'Tennessee', '931': 'Tennessee',
    '210': 'Texas', '214': 'Texas', '254': 'Texas', '281': 'Texas', '325': 'Texas',
    '346': 'Texas', '361': 'Texas', '409': 'Texas', '430': 'Texas', '432': 'Texas',
    '469': 'Texas', '512': 'Texas', '682': 'Texas', '713': 'Texas', '726': 'Texas',
    '737': 'Texas', '806': 'Texas', '817': 'Texas', '830': 'Texas', '832': 'Texas',
    '903': 'Texas', '915': 'Texas', '936': 'Texas', '940': 'Texas',
    '956': 'Texas', '972': 'Texas', '979': 'Texas',
    '385': 'Utah', '435': 'Utah', '801': 'Utah',
    '802': 'Vermont',
    '276': 'Virginia', '434': 'Virginia', '540': 'Virginia',
    '571': 'Virginia', '703': 'Virginia', '757': 'Virginia', '804': 'Virginia',
    '206': 'Washington', '253': 'Washington', '360': 'Washington',
    '425': 'Washington', '509': 'Washington', '564': 'Washington',
    '304': 'West Virginia', '681': 'West Virginia',
    '262': 'Wisconsin', '414': 'Wisconsin', '534': 'Wisconsin',
    '608': 'Wisconsin', '715': 'Wisconsin', '920': 'Wisconsin',
    '307': 'Wyoming',
  };
  return map[code] || null;
}
