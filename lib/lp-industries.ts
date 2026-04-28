export interface IndustryConfig {
  slug: string;
  name: string;
  industry: string; // passed to audit run
  headline: string;
  subheadline: string;
  problems: { title: string; desc: string }[];
  testimonial: { quote: string; name: string; role: string };
}

export const INDUSTRIES: Record<string, IndustryConfig> = {
  hvac: {
    slug: "hvac",
    name: "HVAC",
    industry: "hvac",
    headline: "Algorithms evaluate your HVAC business before customers do.",
    subheadline: "When a homeowner's AC breaks in July, they Google it and call the first company they trust. If that's not you, it's your competitor. We'll show you exactly why — and how to fix it.",
    problems: [
      { title: "You're invisible during peak season", desc: "Homeowners search \"AC repair near me\" in summer and \"furnace repair\" in winter. If you're not on page one for both, you're losing jobs every single day." },
      { title: "Emergency searches go to your competitor", desc: "\"Emergency HVAC repair\" converts within minutes. Competitors bidding on that keyword are taking calls that should be yours." },
      { title: "Your Google Business Profile is costing you jobs", desc: "HVAC customers check reviews before they call. A profile with no photos, low ratings, or missing hours loses to the guy with 80+ five-star reviews." },
      { title: "Seasonal gaps kill your organic traffic", desc: "No heating content in fall, no cooling content in spring — your site disappears from search exactly when customers need you most." },
    ],
    testimonial: { quote: "I had no idea competitors were bidding on my business name. The audit showed me exactly what I was losing every single day.", name: "Mike R.", role: "HVAC Company Owner — Phoenix, AZ" },
  },

  plumbing: {
    slug: "plumbing",
    name: "Plumbing",
    industry: "plumbing",
    headline: "Algorithms evaluate your plumbing business before customers do.",
    subheadline: "When a pipe bursts at 2am, homeowners don't ask friends — they Google it and call the first company that looks trustworthy. Find out if that's you.",
    problems: [
      { title: "Emergency searches convert in minutes — not days", desc: "\"Emergency plumber near me\" is searched 10,000+ times a month. If your site loads slow or ranks low, that job goes to whoever answers first." },
      { title: "You're not in the Google local pack", desc: "The 3 plumbers shown above organic results get 70% of the clicks. If you're not one of them, you're invisible to most of your market." },
      { title: "Competitors are running ads on your service area", desc: "While you rely on referrals, competitors bid on \"plumber [your city]\" and capture customers who've never heard of you." },
      { title: "No reviews strategy means lost jobs", desc: "Plumbing is high-trust. A company with 200 reviews beats a company with 5 — even if your work is better. Most plumbers don't have a system to collect them." },
    ],
    testimonial: { quote: "Within 60 days of fixing what the audit flagged, we were in the Google 3-pack for every neighborhood we serve.", name: "Carlos M.", role: "Plumbing Company Owner — Dallas, TX" },
  },

  electrical: {
    slug: "electrical",
    name: "Electrical",
    industry: "electrical",
    headline: "Algorithms evaluate your electrical business before customers do.",
    subheadline: "Homeowners don't take chances with electrical work — they research online before they call anyone. Find out how your digital presence stacks up against every licensed electrician in your market.",
    problems: [
      { title: "Licensing and trust signals aren't showing up online", desc: "Homeowners search for licensed, insured electricians. If your credentials, certifications, and insurance info aren't visible online, they'll call someone else." },
      { title: "You're losing EV charger and panel upgrade jobs", desc: "High-value electrical jobs — EV charger installation, panel upgrades, home rewiring — are searched constantly. Competitors with SEO are capturing this revenue." },
      { title: "Google Maps visibility determines who gets called", desc: "Most electrical jobs start with a local search. If you're not in the top 3 map results, you're not getting the call — no matter how good your work is." },
      { title: "Your website doesn't build confidence", desc: "A slow, outdated, or thin website signals risk to homeowners. They'll choose the electrician with a fast, professional-looking site every time." },
    ],
    testimonial: { quote: "The audit showed we weren't ranking for EV charger installation at all. That's now our highest-margin job and we rank #1 locally.", name: "Dave K.", role: "Licensed Electrician — Seattle, WA" },
  },

  roofing: {
    slug: "roofing",
    name: "Roofing",
    industry: "roofing",
    headline: "Algorithms evaluate your roofing business before customers do.",
    subheadline: "A roof replacement is a $10,000–$25,000 decision. Homeowners research obsessively before they let anyone on their roof. Find out if your digital presence earns that trust — or loses it.",
    problems: [
      { title: "Storm chasers are outranking local roofers", desc: "After every storm, out-of-town contractors flood your market and outbid you on Google Ads. If your organic ranking is weak, you lose storm season entirely." },
      { title: "You're not showing up for insurance claim searches", desc: "\"Roof replacement insurance claim\" and \"storm damage roof repair\" are high-intent, high-value searches. If competitors rank for them, they're taking your biggest jobs." },
      { title: "Before/after photos and reviews drive roofing decisions", desc: "Roofing is visual. Homeowners want to see past work and read reviews before they sign anything. If your online presence doesn't show this, you're losing bids." },
      { title: "No financing content means lost sales", desc: "Most homeowners need financing for a new roof. Competitors who rank for \"roof financing\" and \"no money down roof replacement\" are closing deals you never knew existed." },
    ],
    testimonial: { quote: "Storm season used to mean fighting for scraps. Now we rank #1 organically and our phone rings before we run a single ad.", name: "Tony B.", role: "Roofing Company Owner — Nashville, TN" },
  },

  landscaping: {
    slug: "landscaping",
    name: "Landscaping",
    industry: "landscaping",
    headline: "Algorithms evaluate your landscaping business before customers do.",
    subheadline: "Homeowners search for landscaping companies every spring. The ones who show up online get the contracts — the ones who don't rely on word of mouth that never scales. Find out where you stand.",
    problems: [
      { title: "Spring search traffic goes to whoever ranks", desc: "\"Landscaping near me\" spikes every March. If you're not on the first page heading into spring, your competitor books your potential customers for the whole season." },
      { title: "You're not ranking for lawn care + your city", desc: "Hyper-local keywords like \"lawn care [city]\" and \"landscaping [neighborhood]\" drive the most qualified leads. Most landscaping sites aren't optimized for any of them." },
      { title: "No recurring service content means no recurring search traffic", desc: "Lawn maintenance, seasonal cleanups, fertilization programs — each is a separate search. If you don't rank for them, you don't get recurring contracts from search." },
      { title: "Competitors run before/after Instagram ads and you don't", desc: "Landscaping is visual. Competitors running Meta ads with job photos are capturing homeowners before they even search Google." },
    ],
    testimonial: { quote: "We tripled our spring inquiries after the audit. Turns out we weren't ranking for a single neighborhood-level keyword.", name: "Jesse L.", role: "Landscaping Owner — Denver, CO" },
  },

  painting: {
    slug: "painting",
    name: "Painting",
    industry: "painting",
    headline: "Algorithms evaluate your painting business before customers do.",
    subheadline: "Homeowners get 3–5 quotes before hiring a painter. The company they found first online already has the advantage. Find out if that's you.",
    problems: [
      { title: "Interior vs. exterior — you're probably missing one", desc: "Homeowners search \"interior painters near me\" and \"exterior house painting\" as separate queries. Most painting sites only rank for one — losing half their potential leads." },
      { title: "Review count wins painting bids before you arrive", desc: "Painting is trust-based. A company with 150 reviews gets the appointment over a company with 12 — before anyone even looks at the portfolio." },
      { title: "Commercial painting is being left on the table", desc: "\"Commercial painting contractors\" searches are high-value and less competitive. Most painters don't have a single page targeting commercial clients." },
      { title: "Competitors run color consultation and estimate CTAs — you don't", desc: "Smart competitors offer free color consultations and instant estimates online. These conversion tools mean they capture the lead before you even know it existed." },
    ],
    testimonial: { quote: "I didn't realize I had zero content about commercial painting. That's now 40% of our revenue.", name: "Brian O.", role: "Painting Contractor — Austin, TX" },
  },

  "general-contractor": {
    slug: "general-contractor",
    name: "General Contractor",
    industry: "general contractor",
    headline: "Algorithms evaluate your contracting business before customers do.",
    subheadline: "Homeowners planning a renovation spend weeks researching before they call anyone. The contractor they find first — and trust most — wins the project. Find out where you stand.",
    problems: [
      { title: "You're not ranking for high-value project types", desc: "\"Kitchen remodel contractor,\" \"bathroom renovation near me,\" \"home addition contractor\" — each is a separate search that sends high-value leads to whoever ranks for it." },
      { title: "Project portfolio visibility is the #1 trust signal", desc: "GC work is expensive. Homeowners want to see completed projects before they call. If your portfolio isn't findable online, you're losing bids before the first conversation." },
      { title: "Competitors have landing pages for every service — you have one", desc: "A single services page can't rank for 12 different project types. Competitors with dedicated pages for each service type dominate the searches that matter." },
      { title: "No presence in the permit and design-build search space", desc: "\"Design-build contractor\" and \"licensed general contractor [city]\" are searched by the most serious, highest-budget homeowners. Most GC websites are invisible for these terms." },
    ],
    testimonial: { quote: "We were getting leads — just not the right ones. The audit showed we ranked for nothing above $15k project value.", name: "Frank D.", role: "General Contractor — Chicago, IL" },
  },

  "cleaning-services": {
    slug: "cleaning-services",
    name: "Cleaning Services",
    industry: "cleaning services",
    headline: "Algorithms evaluate your cleaning business before customers do.",
    subheadline: "The cleaning industry runs on trust and convenience. Customers search, compare reviews, and book — all in under 5 minutes. Find out if your digital presence wins that window or loses it.",
    problems: [
      { title: "Recurring customers come from search — not just referrals", desc: "\"House cleaning service near me\" and \"weekly cleaning [city]\" are searched constantly. If you're not ranking, you're not getting the recurring contracts that build a stable business." },
      { title: "Move-out and deep clean searches are high-value and ignored", desc: "\"Move-out cleaning,\" \"deep clean house,\" and \"post-construction cleaning\" convert at high rates. Most cleaning companies don't have dedicated content for any of them." },
      { title: "Booking friction loses customers to apps like Handy", desc: "Customers want to book cleaning online, instantly. If your site doesn't make that easy, they'll use a platform that does — and you'll pay a referral fee forever." },
      { title: "No differentiation online means competing on price alone", desc: "Without strong reviews, photos, and a clear value proposition online, customers compare only on price. That's a race you can't win against budget operations." },
    ],
    testimonial: { quote: "We weren't showing up for move-out cleaning at all. That's now our most profitable service.", name: "Sandra P.", role: "Cleaning Service Owner — Miami, FL" },
  },

  "pest-control": {
    slug: "pest-control",
    name: "Pest Control",
    industry: "pest control",
    headline: "Algorithms evaluate your pest control business before customers do.",
    subheadline: "Pest problems are urgent. Homeowners search, read two reviews, and call — in under 3 minutes. If you're not the first result they trust, someone else is getting that call.",
    problems: [
      { title: "Urgency searches go to whoever ranks first", desc: "\"Pest control near me,\" \"exterminator same day,\" \"termite inspection\" — these are urgent searches with immediate buying intent. Position 1 gets the call. Position 4 gets nothing." },
      { title: "Seasonal pest content is a missed opportunity", desc: "Ant season, mosquito season, rodent season — each brings a spike in searches. Competitors who publish seasonal content dominate those windows. Most pest control sites don't." },
      { title: "Termite and commercial contracts are high-value and under-targeted", desc: "\"Termite treatment cost,\" \"commercial pest control contract\" — these are high-ticket searches with very few competitors targeting them with dedicated content." },
      { title: "Subscription service customers start with search", desc: "Monthly pest control plans are the most profitable revenue model. If you don't rank for \"pest control plan [city],\" you're missing your best customers." },
    ],
    testimonial: { quote: "I was paying for Google Ads but my organic was zero. The audit showed exactly why — and we fixed it in 6 weeks.", name: "Ray T.", role: "Pest Control Owner — Orlando, FL" },
  },

  "garage-door": {
    slug: "garage-door",
    name: "Garage Door",
    industry: "garage door",
    headline: "Algorithms evaluate your garage door business before customers do.",
    subheadline: "A broken garage door is an emergency. Homeowners search, find someone fast, and call — often within 2 minutes. Find out if your digital presence captures that urgency or loses it.",
    problems: [
      { title: "Same-day repair searches are winner-take-all", desc: "\"Garage door repair same day,\" \"broken spring repair near me\" — customers in emergency mode call whoever ranks first. There's no second place in this search." },
      { title: "Installation and replacement are high-ticket and SEO-ignored", desc: "\"Garage door installation cost\" and \"new garage door replacement\" are searched by customers ready to spend $1,500–$4,000. Most garage door sites don't rank for them at all." },
      { title: "Competitors use Google Ads — and you're paying for it", desc: "If competitors bid on \"garage door repair [your city]\" and you don't, they appear above your organic listing. You're handing them the emergency calls that should be yours." },
      { title: "Brand comparisons drive new door sales", desc: "\"Clopay vs LiftMaster,\" \"best garage door brands\" — homeowners researching new doors read comparisons. Whoever ranks for these comparisons gets the installation job." },
    ],
    testimonial: { quote: "We were getting zero calls from our website. Turns out we ranked for nothing. Now we close 3–4 same-day jobs a week from search alone.", name: "Chris V.", role: "Garage Door Service Owner — Houston, TX" },
  },

  "window-siding": {
    slug: "window-siding",
    name: "Window & Siding",
    industry: "window and siding",
    headline: "Algorithms evaluate your window & siding business before customers do.",
    subheadline: "Window and siding projects are big decisions with long research cycles. The company homeowners find first — and trust most — wins the project. Find out where you stand.",
    problems: [
      { title: "Cost comparison searches start the buying cycle", desc: "\"Window replacement cost,\" \"how much does new siding cost\" — homeowners researching costs are 60 days from buying. Whoever ranks for these questions owns the relationship." },
      { title: "Energy efficiency is the #1 driver and you're not using it", desc: "\"Energy efficient windows near me,\" \"insulated siding contractor\" — these searches come with tax credit awareness and high budgets. Most contractors have zero content targeting them." },
      { title: "Brand-specific searches go to competitors", desc: "\"Andersen window installer,\" \"James Hardie siding contractor near me\" — if you're a certified installer, homeowners are searching for you but not finding you." },
      { title: "Financing content closes projects your competitors lose", desc: "Window and siding projects get postponed over budget concerns. Competitors who rank for \"window financing no credit check\" are closing jobs you never got a chance to bid." },
    ],
    testimonial: { quote: "We were a certified Andersen installer and nobody could find us for it. That one fix tripled our qualified leads.", name: "Paul N.", role: "Window & Siding Contractor — Minneapolis, MN" },
  },

  "water-damage": {
    slug: "water-damage",
    name: "Water Damage / Mold",
    industry: "water damage restoration",
    headline: "Algorithms evaluate your restoration business before customers do.",
    subheadline: "Water damage and mold are emergencies. Homeowners call the first company they find that looks trustworthy — often within minutes of discovering the problem. Find out if that company is you.",
    problems: [
      { title: "Emergency searches are the entire business model", desc: "\"Water damage restoration near me,\" \"emergency flood cleanup,\" \"mold remediation same day\" — these are your highest-value calls and they go to whoever ranks first, period." },
      { title: "Insurance claim content drives the highest-value jobs", desc: "\"Water damage insurance claim help,\" \"does homeowners insurance cover mold\" — homeowners filing claims search these questions. Ranking for them positions you as the expert they call." },
      { title: "Google Ads at 2am wins the job", desc: "Pipes burst at night. If your ads aren't running 24/7 and your site doesn't load fast on mobile, the homeowner calls your competitor while you're asleep." },
      { title: "Certification visibility builds trust in a high-anxiety moment", desc: "IICRC certification, insurance approvals, before/after documentation — homeowners in crisis need to see proof of professionalism instantly. Most restoration sites bury this." },
    ],
    testimonial: { quote: "We were losing every 2am emergency call to a national franchise. The audit showed why — and within 90 days we were ranking above them.", name: "Mark S.", role: "Restoration Company Owner — Atlanta, GA" },
  },

  "foundation-repair": {
    slug: "foundation-repair",
    name: "Foundation Repair",
    industry: "foundation repair",
    headline: "Algorithms evaluate your foundation repair business before customers do.",
    subheadline: "Foundation problems are high-anxiety, high-ticket decisions. Homeowners research for weeks before they call anyone. The company they trust most online wins the job — find out if that's you.",
    problems: [
      { title: "Fear-based searches are your best leads and hardest to rank for", desc: "\"Foundation crack repair,\" \"is my foundation failing,\" \"foundation repair cost\" — homeowners in panic mode search these first. Whoever ranks for them gets the consultation call." },
      { title: "Competitor warranties are being advertised — yours isn't", desc: "Foundation repair is a trust purchase. Competitors promoting lifetime warranties and financing online are closing jobs before you even get a chance to bid." },
      { title: "Real estate transaction searches are a missed vertical", desc: "\"Foundation inspection for home sale,\" \"foundation repair before selling house\" — real estate-related searches bring motivated, deadline-driven customers most contractors ignore." },
      { title: "Educational content builds the trust this work requires", desc: "Homeowners don't understand crawl spaces, helical piers, or waterproofing systems. Companies that explain it clearly in content establish authority and close at higher rates." },
    ],
    testimonial: { quote: "Foundation repair is a trust sale. Once we fixed our online presence, our close rate on consultations went from 30% to 62%.", name: "Greg H.", role: "Foundation Repair Owner — Kansas City, MO" },
  },

  "other-home-service": {
    slug: "other-home-service",
    name: "Home Services",
    industry: "home services",
    headline: "Algorithms evaluate your home service business before customers do.",
    subheadline: "Homeowners search before they call anyone. The company with the strongest digital presence wins the job — before a single conversation happens. Find out exactly where you stand.",
    problems: [
      { title: "Your competitors are running Google Ads and you're not", desc: "While you rely on referrals, competitors bid on your service area keywords and capture customers who've never heard of you." },
      { title: "You're not in the Google local pack", desc: "The 3 businesses shown above organic results get the majority of local clicks. If you're not one of them, most of your market never sees you." },
      { title: "A slow website is losing you mobile leads", desc: "60%+ of home service searches happen on mobile. If your site takes more than 3 seconds to load, most visitors leave before they ever see your number." },
      { title: "Low review count means lost jobs before the first call", desc: "Customers compare reviews before they call anyone. A competitor with 100 reviews beats you with 10 — even if your work is better." },
    ],
    testimonial: { quote: "I had no idea how many leads I was losing online. The audit was eye-opening — and the fixes paid for themselves in the first month.", name: "Lisa M.", role: "Home Service Business Owner" },
  },
};

export function getIndustry(slug: string): IndustryConfig | null {
  return INDUSTRIES[slug] ?? null;
}
