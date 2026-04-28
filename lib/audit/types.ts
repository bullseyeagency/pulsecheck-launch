export interface HeadingTag {
  level: number;
  text: string;
}

export interface ImageInfo {
  src: string;
  alt: string;
  hasAlt: boolean;
}

export interface OgTags {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  siteName?: string;
}

export interface TwitterCard {
  card?: string;
  title?: string;
  description?: string;
  image?: string;
  site?: string;
}

export interface CrawlData {
  url: string;
  domain: string;
  title: string;
  metaDescription: string;
  canonical: string;
  robotsDirectives: string[];
  headings: HeadingTag[];
  headingCounts: Record<string, number>;
  jsonLd: Record<string, unknown>[];
  ogTags: OgTags;
  twitterCard: TwitterCard;
  robotsTxt: string;
  sitemapXml: string;
  internalLinks: string[];
  nap: { name: string; address: string; phone: string };
  wordCount: number;
  technologies: string[];
  images: ImageInfo[];
}

export type Severity = "critical" | "high" | "medium" | "low";

export interface Issue {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  category: string;
}

export type Priority = "P0" | "P1" | "P2" | "P3";

export interface Recommendation {
  priority: Priority;
  category: string;
  title: string;
  description: string;
  impact: string;
}

export interface Report {
  overallGrade: string;
  scores: {
    pagespeedMobile: number;
    pagespeedDesktop: number;
    seo: number;
    accessibility: number;
  };
  totalKeywords: number;
  estimatedTraffic: number;
  totalIssues: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  topOpportunities: Array<{
    keyword: string;
    volume: number;
    difficulty: number;
    opportunity: number;
  }>;
  topCompetitors: Array<{
    domain: string;
    keywords: number;
    traffic: number;
    overlap: number;
  }>;
}

export interface AuditData {
  crawlData?: CrawlData;
  pageSpeedData?: Record<string, unknown>;
  keywordData?: Record<string, unknown>;
  rankingsData?: Record<string, unknown>;
  backlinksData?: Record<string, unknown>;
  serpData?: Record<string, unknown>;
  adsData?: Record<string, unknown>;
  competitorData?: Record<string, unknown>;
  issues: Issue[];
  recommendations: Recommendation[];
}
