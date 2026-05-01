import { CrawlData, Issue } from "./types";

export interface EeatDimension {
  score: number; // 0-100
  signals: string[]; // passing signals
  missing: string[];  // missing signals
}

export interface EeatResult {
  score: number;
  grade: string;
  label: string;
  dimensions: {
    experience: EeatDimension;
    expertise: EeatDimension;
    authoritativeness: EeatDimension;
    trustworthiness: EeatDimension;
  };
  issues: Issue[];
}

export function runEeatAudit(
  crawlData: CrawlData,
  backlinksData?: Record<string, unknown>
): EeatResult {
  const issues: Issue[] = [];
  const jsonLd = crawlData.jsonLd || [];
  const links = crawlData.internalLinks || [];
  const allText = [
    crawlData.title,
    crawlData.metaDescription,
    (crawlData.headings || []).map((h) => h.text).join(" "),
    crawlData.supplementalText || "",
  ].join(" ").toLowerCase();

  // Helper: check if an internal link path exists
  const hasPage = (...paths: string[]) =>
    paths.some((p) => links.some((l) => l.includes(p)));

  // ── Experience ──────────────────────────────────────────────────────────────
  // First-hand signals: "we", "our team", "we found", "in our experience"
  const firstPersonSignals = /\b(we |our team|we found|we've|in our experience|we tested|we use|our clients|our customers)\b/i.test(allText);
  const hasAboutPage = hasPage("/about", "/about-us", "/our-story", "/our-team");
  const hasTeamPage = hasPage("/team", "/staff", "/meet", "/people");
  const hasCaseStudies = hasPage("/case-stud", "/portfolio", "/results", "/work");
  const hasReviewSchema = jsonLd.some(
    (item) => item.aggregateRating || item["@type"] === "Review"
  );

  const expSignals: string[] = [];
  const expMissing: string[] = [];
  if (firstPersonSignals) expSignals.push("First-person content voice");
  else expMissing.push("No first-hand experience signals in content");
  if (hasAboutPage) expSignals.push("About/Our Story page found");
  else expMissing.push("No About page");
  if (hasTeamPage) expSignals.push("Team page found");
  else expMissing.push("No team/staff page");
  if (hasCaseStudies) expSignals.push("Case studies or portfolio found");
  else expMissing.push("No case studies or portfolio");
  if (hasReviewSchema) expSignals.push("Review/rating schema present");
  else expMissing.push("No review schema");

  const experienceScore = Math.round((expSignals.length / 5) * 100);

  // ── Expertise ───────────────────────────────────────────────────────────────
  const hasAuthorSchema = jsonLd.some(
    (item) => item.author || item["@type"] === "Person"
  );
  const hasSpecialtySchema = jsonLd.some(
    (item) => item.hasCredential || item.knowsAbout || item.hasOccupation
  );
  const deepContent = crawlData.wordCount >= 800;
  const hasFaqSchema = jsonLd.some((item) => item["@type"] === "FAQPage");
  const hasServiceSchema = jsonLd.some((item) =>
    ["Service", "Product", "Offer"].includes(String(item["@type"] || ""))
  );

  const exprtSignals: string[] = [];
  const exprtMissing: string[] = [];
  if (hasAuthorSchema) exprtSignals.push("Author schema markup present");
  else exprtMissing.push("No author schema markup");
  if (hasSpecialtySchema) exprtSignals.push("Credentials/expertise schema found");
  else exprtMissing.push("No credentials or knowsAbout schema");
  if (deepContent) exprtSignals.push(`Content depth: ${crawlData.wordCount} words`);
  else exprtMissing.push(`Thin content (${crawlData.wordCount} words — aim for 800+)`);
  if (hasFaqSchema) exprtSignals.push("FAQPage schema (demonstrates expertise)");
  else exprtMissing.push("No FAQ schema");
  if (hasServiceSchema) exprtSignals.push("Service/Product schema present");
  else exprtMissing.push("No Service or Product schema");

  const expertiseScore = Math.round((exprtSignals.length / 5) * 100);

  // ── Authoritativeness ───────────────────────────────────────────────────────
  const hasOrgSchema = jsonLd.some((item) =>
    ["Organization", "LocalBusiness", "Corporation", "ProfessionalService"].includes(
      String(item["@type"] || "")
    )
  );
  const hasAggregateRating = jsonLd.some((item) => item.aggregateRating);
  const hasSameAs = jsonLd.some((item) => item.sameAs); // social/external profiles
  const refDomains = (backlinksData?.referring_domains as number | undefined) ?? null;
  const hasBacklinks = refDomains === null ? null : refDomains >= 10;
  const hasPressOrMedia = hasPage("/press", "/media", "/news", "/in-the-news");

  const authSignals: string[] = [];
  const authMissing: string[] = [];
  if (hasOrgSchema) authSignals.push("Organization/LocalBusiness schema present");
  else authMissing.push("No Organization schema");
  if (hasAggregateRating) authSignals.push("Aggregate rating schema present");
  else authMissing.push("No aggregate rating schema");
  if (hasSameAs) authSignals.push("sameAs links to external profiles");
  else authMissing.push("No sameAs external profile links in schema");
  if (hasBacklinks === true) authSignals.push(`${refDomains} referring domains`);
  else if (hasBacklinks === false) authMissing.push(`Low referring domains (${refDomains}) — build more backlinks`);
  if (hasPressOrMedia) authSignals.push("Press/media page found");
  else authMissing.push("No press or media mentions page");

  const authorityCount = authSignals.length + (hasBacklinks === null ? 1 : 0);
  const authorityScore = Math.round((authSignals.length / 5) * 100);

  // ── Trustworthiness ─────────────────────────────────────────────────────────
  const httpsEnabled = crawlData.url.startsWith("https://");
  const hasPrivacyPolicy = hasPage("/privacy", "/privacy-policy");
  const hasContactPage = hasPage("/contact", "/contact-us", "/get-in-touch");
  const hasNapData =
    !!(crawlData.nap?.phone || crawlData.nap?.address || crawlData.nap?.name);
  const hasLocalBusinessSchema = jsonLd.some((item) =>
    ["LocalBusiness", "MedicalBusiness", "LegalService", "HomeAndConstructionBusiness",
      "FinancialService", "FoodEstablishment", "Store"].includes(String(item["@type"] || ""))
  );
  const hasTerms = hasPage("/terms", "/terms-of-service", "/tos");

  const trustSignals: string[] = [];
  const trustMissing: string[] = [];
  if (httpsEnabled) trustSignals.push("HTTPS enabled");
  else trustMissing.push("Site not on HTTPS");
  if (hasPrivacyPolicy) trustSignals.push("Privacy policy page found");
  else trustMissing.push("No privacy policy");
  if (hasContactPage) trustSignals.push("Contact page found");
  else trustMissing.push("No contact page");
  if (hasNapData) trustSignals.push("Business name/address/phone found");
  else trustMissing.push("No NAP (name, address, phone) data found");
  if (hasLocalBusinessSchema) trustSignals.push("LocalBusiness schema present");
  else trustMissing.push("No LocalBusiness schema");
  if (hasTerms) trustSignals.push("Terms of service page found");
  // Terms optional — don't penalize for missing

  const trustScore = Math.round((trustSignals.length / 5) * 100);

  // ── Overall Score ────────────────────────────────────────────────────────────
  // Experience 20%, Expertise 25%, Authoritativeness 30%, Trustworthiness 25%
  const score = Math.round(
    experienceScore * 0.2 +
    expertiseScore * 0.25 +
    authorityScore * 0.3 +
    trustScore * 0.25
  );

  // ── Issues ───────────────────────────────────────────────────────────────────
  if (!httpsEnabled) {
    issues.push({ id: "eeat-no-https", title: "Site not on HTTPS", description: "Google treats HTTPS as a trust signal. A non-HTTPS site will lose rankings and display security warnings in browsers.", severity: "critical", category: "E-E-A-T" });
  }
  if (!hasAboutPage) {
    issues.push({ id: "eeat-no-about", title: "No About page detected", description: "An About page is one of the strongest E-E-A-T signals. Google wants to know who is behind the site before trusting its content.", severity: "high", category: "E-E-A-T" });
  }
  if (!hasAuthorSchema) {
    issues.push({ id: "eeat-no-author-schema", title: "No author markup", description: "Content without an identifiable author is harder for Google to evaluate. Add a Person schema with name, credentials, and a sameAs link to LinkedIn or a professional profile.", severity: "high", category: "E-E-A-T" });
  }
  if (!hasOrgSchema) {
    issues.push({ id: "eeat-no-org-schema", title: "No Organization or LocalBusiness schema", description: "Structured data for your business establishes authoritative identity. Add an Organization or LocalBusiness schema with address, phone, and sameAs links.", severity: "high", category: "E-E-A-T" });
  }
  if (!hasPrivacyPolicy) {
    issues.push({ id: "eeat-no-privacy", title: "No privacy policy page", description: "A privacy policy is a baseline trust signal. Missing one hurts E-E-A-T and is required by GDPR/CCPA for most businesses.", severity: "medium", category: "E-E-A-T" });
  }
  if (!hasNapData) {
    issues.push({ id: "eeat-no-nap", title: "Business NAP not found", description: "Name, address, and phone number should be clearly visible and consistent with your Google Business Profile. Missing NAP weakens local trust signals.", severity: "medium", category: "E-E-A-T" });
  }
  if (!hasAggregateRating) {
    issues.push({ id: "eeat-no-reviews-schema", title: "No review/rating schema", description: "AggregateRating schema lets Google display your star rating in search results and signals customer trust.", severity: "medium", category: "E-E-A-T" });
  }

  const grade = score >= 80 ? "A" : score >= 65 ? "B" : score >= 45 ? "C" : score >= 25 ? "D" : "F";
  const label =
    grade === "A" ? "Strong trust & authority" :
    grade === "B" ? "Good trust signals" :
    grade === "C" ? "Mixed trust signals" :
    grade === "D" ? "Weak authority" :
    "Low trust — Google may discount this site";

  return {
    score,
    grade,
    label,
    dimensions: {
      experience: { score: experienceScore, signals: expSignals, missing: expMissing },
      expertise: { score: expertiseScore, signals: exprtSignals, missing: exprtMissing },
      authoritativeness: { score: authorityScore, signals: authSignals, missing: authMissing },
      trustworthiness: { score: trustScore, signals: trustSignals, missing: trustMissing },
    },
    issues,
  };
}
