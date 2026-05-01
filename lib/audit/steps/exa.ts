// lib/audit/steps/exa.ts
import { CrawlData } from "@/lib/audit/types";
import { getBusinessName } from "./shared";

export async function runExaResearch(
  domain: string,
  location: string,
  crawlData: CrawlData
) {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) throw new Error("EXA_API_KEY is not configured");

  const businessName = getBusinessName(crawlData, domain);
  const query = `${businessName} ${domain} ${location} company reviews reputation digital marketing`;

  const res = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      type: "deep-lite",
      numResults: 5,
      outputSchema: {
        type: "object",
        required: ["company_name", "years_in_business", "services", "pain_points", "reputation", "digital_presence"],
        properties: {
          company_name: { type: "string" },
          years_in_business: { type: "string", description: 'How long in business, or "unknown"' },
          services: { type: "array", description: "Main services offered", items: { type: "string" } },
          pain_points: {
            type: "array",
            description: "Digital marketing weaknesses: poor SEO, no ads, bad reviews, outdated site, etc.",
            items: { type: "string" },
          },
          reputation: { type: "string", description: "One sentence summary of their online reputation" },
          digital_presence: { type: "string", description: "Overall digital marketing strength: weak / moderate / strong" },
        },
      },
    }),
  });

  if (!res.ok) throw new Error(`Exa HTTP ${res.status}: ${await res.text()}`);
  const data = await res.json();

  return {
    ...(data.output?.content || {}),
    sources: data.results?.length || 0,
  };
}
