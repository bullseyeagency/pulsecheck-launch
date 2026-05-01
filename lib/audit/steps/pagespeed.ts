// lib/audit/steps/pagespeed.ts

export async function runPageSpeed(url: string) {
  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_PAGESPEED_API_KEY is not configured");

  const fetchPSI = async (strategy: "mobile" | "desktop") => {
    const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}&key=${apiKey}&category=PERFORMANCE&category=ACCESSIBILITY&category=SEO&category=BEST_PRACTICES`;
    const res = await fetch(endpoint, { signal: AbortSignal.timeout(55000) });
    if (!res.ok) throw new Error(`PSI ${strategy} error: ${res.status}`);
    return res.json();
  };

  const [mobile, desktop] = await Promise.allSettled([
    fetchPSI("mobile"),
    fetchPSI("desktop"),
  ]);

  return {
    mobile: mobile.status === "fulfilled" ? mobile.value : null,
    desktop: desktop.status === "fulfilled" ? desktop.value : null,
  };
}
