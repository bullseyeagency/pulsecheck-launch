import { Issue, Priority, Recommendation } from "./types";

/**
 * Generates actionable recommendations from detected issues.
 */
export function generateRecommendations(issues: Issue[]): Recommendation[] {
  const recommendations: Recommendation[] = [];

  for (const iss of issues) {
    const rec = issueToRecommendation(iss);
    if (rec) recommendations.push(rec);
  }

  // Sort by priority
  const priorityOrder: Record<Priority, number> = {
    P0: 0,
    P1: 1,
    P2: 2,
    P3: 3,
  };
  recommendations.sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  return recommendations;
}

function issueToRecommendation(issue: Issue): Recommendation | null {
  const map: Record<
    string,
    { priority: Priority; title: string; description: string; impact: string }
  > = {
    "missing-title": {
      priority: "P0",
      title: "Add a descriptive page title",
      description:
        "Write a unique, keyword-rich title tag between 50-60 characters that accurately describes the page content.",
      impact:
        "Direct ranking factor. Titles appear in search results and browser tabs.",
    },
    "missing-h1": {
      priority: "P0",
      title: "Add an H1 heading",
      description:
        "Add a single H1 tag that includes your primary keyword and clearly describes the page topic.",
      impact:
        "H1 is a strong on-page ranking signal and improves content hierarchy.",
    },
    noindex: {
      priority: "P0",
      title: "Remove noindex directive",
      description:
        "Remove the noindex meta tag or X-Robots-Tag header so search engines can index this page.",
      impact:
        "Page is completely invisible to search engines while noindex is active.",
    },
    "missing-meta-desc": {
      priority: "P1",
      title: "Write a compelling meta description",
      description:
        "Create a 150-160 character meta description that includes target keywords and a clear call to action.",
      impact:
        "Improves click-through rate from search results by 5-10% on average.",
    },
    "missing-canonical": {
      priority: "P1",
      title: "Add a canonical URL tag",
      description:
        "Add a <link rel='canonical'> tag pointing to the preferred version of this URL to prevent duplicate content issues.",
      impact:
        "Consolidates ranking signals and prevents content dilution across duplicate URLs.",
    },
    "no-schema": {
      priority: "P1",
      title: "Add structured data (JSON-LD)",
      description:
        "Implement relevant schema markup (LocalBusiness, Organization, Product, etc.) to enable rich snippets in search results.",
      impact:
        "Rich snippets can increase CTR by 20-30% and improve visibility in AI search.",
    },
    "no-sitemap": {
      priority: "P1",
      title: "Create and submit an XML sitemap",
      description:
        "Generate an XML sitemap listing all important pages and submit it to Google Search Console.",
      impact:
        "Ensures search engines discover and crawl all pages efficiently.",
    },
    "poor-mobile-speed": {
      priority: "P0",
      title: "Fix critical mobile performance issues",
      description:
        "Optimize images (WebP format), minimize JavaScript, enable caching, and reduce render-blocking resources.",
      impact:
        "Core Web Vitals are a direct ranking factor. Poor mobile speed loses visitors and rankings.",
    },
    "avg-mobile-speed": {
      priority: "P1",
      title: "Improve mobile PageSpeed score",
      description:
        "Optimize largest contentful paint, reduce cumulative layout shift, and minimize total blocking time.",
      impact: "Better Core Web Vitals improve rankings and user experience.",
    },
    "poor-desktop-speed": {
      priority: "P1",
      title: "Improve desktop PageSpeed score",
      description:
        "Address performance bottlenecks: optimize images, defer non-critical JS, and leverage browser caching.",
      impact:
        "Faster load times reduce bounce rate and improve conversions.",
    },
    "images-no-alt": {
      priority: "P1",
      title: "Add alt text to all images",
      description:
        "Write descriptive alt text for every image that conveys the image content and context. Include relevant keywords naturally.",
      impact:
        "Improves accessibility compliance and enables image search visibility.",
    },
    "thin-content": {
      priority: "P1",
      title: "Expand page content",
      description:
        "Add comprehensive, valuable content. Aim for at least 500-1000 words covering the topic thoroughly with headings, FAQs, and supporting details.",
      impact:
        "Thin content pages rarely rank. Comprehensive content signals expertise to search engines.",
    },
    "no-backlinks": {
      priority: "P0",
      title: "Build a backlink foundation",
      description:
        "Start with directory listings (Google Business Profile, Yelp, industry directories), then pursue guest posts, partnerships, and PR opportunities.",
      impact:
        "Backlinks are the strongest off-page ranking factor. Zero backlinks severely limits ranking potential.",
    },
    "low-ref-domains": {
      priority: "P1",
      title: "Increase referring domain count",
      description:
        "Target quality backlinks from relevant, authoritative sites. Focus on local directories, industry publications, and content-based link building.",
      impact:
        "More unique referring domains correlates strongly with higher rankings.",
    },
    "incomplete-og": {
      priority: "P2",
      title: "Complete Open Graph tags",
      description:
        "Add og:title, og:description, og:image, and og:url tags to control how the page appears when shared on social media.",
      impact:
        "Better social previews increase engagement and click-through from social platforms.",
    },
    "no-og-image": {
      priority: "P2",
      title: "Add an Open Graph image",
      description:
        "Create a branded 1200x630px image for social sharing. Set it as the og:image tag.",
      impact:
        "Posts with images get 2-3x more engagement on social media.",
    },
    "no-robots-txt": {
      priority: "P2",
      title: "Create a robots.txt file",
      description:
        "Add a robots.txt file that allows crawling of important pages and disallows admin/private areas. Include a link to your sitemap.",
      impact:
        "Guides crawlers efficiently and prevents wasted crawl budget.",
    },
    "multiple-h1": {
      priority: "P2",
      title: "Use a single H1 tag",
      description:
        "Restructure headings so there is exactly one H1 per page. Use H2-H6 for subsections.",
      impact:
        "Clear heading hierarchy helps search engines understand content structure.",
    },
    "short-title": {
      priority: "P2",
      title: "Expand page title",
      description:
        "Lengthen the title to 50-60 characters. Include primary keyword and brand name.",
      impact: "Longer, descriptive titles perform better in search results.",
    },
    "long-title": {
      priority: "P3",
      title: "Shorten page title",
      description:
        "Trim the title to under 60 characters to prevent truncation in search results.",
      impact: "Minor improvement to SERP appearance.",
    },
    "short-meta-desc": {
      priority: "P3",
      title: "Expand meta description",
      description:
        "Write a fuller description (150-160 characters) to maximize SERP real estate.",
      impact: "Minor improvement to click-through rate.",
    },
    "long-meta-desc": {
      priority: "P3",
      title: "Trim meta description",
      description: "Shorten to under 160 characters to prevent truncation.",
      impact: "Minor improvement to SERP appearance.",
    },
    nofollow: {
      priority: "P2",
      title: "Review nofollow directive",
      description:
        "Confirm the nofollow directive is intentional. If not, remove it to allow link equity flow.",
      impact:
        "Links on this page will not pass authority to linked pages.",
    },
  };

  const rec = map[issue.id];
  if (!rec) return null;

  return {
    priority: rec.priority,
    category: issue.category,
    title: rec.title,
    description: rec.description,
    impact: rec.impact,
  };
}
