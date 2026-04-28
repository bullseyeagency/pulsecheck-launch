const SERPAPI_BASE = "https://www.searchapi.io/api/v1/search";

interface SerpAPIParams {
  engine: string;
  [key: string]: string | number | boolean | undefined;
}

/**
 * Calls a SearchAPI endpoint and returns parsed JSON.
 * All search params are passed as query parameters.
 */
export async function searchSerpAPI(params: SerpAPIParams) {
  const apiKey = process.env.SEARCHAPI_KEY;
  if (!apiKey) {
    throw new Error("SEARCHAPI_KEY is not configured");
  }

  const searchParams = new URLSearchParams();
  searchParams.set("api_key", apiKey);
  searchParams.set("output", "json");

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.set(key, String(value));
    }
  }

  const url = `${SERPAPI_BASE}?${searchParams.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: { "Accept": "application/json" },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SerpAPI error ${response.status}: ${text}`);
  }

  return response.json();
}
