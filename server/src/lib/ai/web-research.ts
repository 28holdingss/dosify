/**
 * External research helpers for Dosify AI citations.
 * Prefers free trusted APIs (OpenFDA, PubMed) and optional Tavily web search.
 */

export type WebResearchHit = {
  id: string;
  title: string;
  detail: string | null;
  url: string;
  citation: string;
};

const TRUSTED_DOMAINS = [
  'fda.gov',
  'nih.gov',
  'nlm.nih.gov',
  'medlineplus.gov',
  'cdc.gov',
  'who.int',
  'mayoclinic.org',
  'drugs.com',
  'ema.europa.eu',
  'pubmed.ncbi.nlm.nih.gov',
];

const ANALYSIS_HINT =
  /\b(analy[sz]e|analysis|research|interact|side effect|risk|safe|safety|evidence|study|studies|clinical|half[- ]?life|mechanism|compare|explain|why|how does|what happens|wearable|recover|sleep|liver|cardio|cognit)/i;

export function shouldRunWebResearch(message: string): boolean {
  return ANALYSIS_HINT.test(message) || message.trim().split(/\s+/).length >= 6;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'DosifyAI/1.0 (health companion; research citations)',
        ...(init?.headers ?? {}),
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function cleanSnippet(text: string | null | undefined, max = 220): string | null {
  if (!text) return null;
  const flat = text.replace(/\s+/g, ' ').trim();
  if (!flat) return null;
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

async function searchOpenFda(terms: string[]): Promise<WebResearchHit[]> {
  const hits: WebResearchHit[] = [];
  const queries = terms.slice(0, 3);

  for (const term of queries) {
    const q = encodeURIComponent(
      `openfda.brand_name:"${term}" OR openfda.generic_name:"${term}" OR openfda.substance_name:"${term}"`
    );
    const data = await fetchJson<{
      results?: Array<{
        id?: string;
        openfda?: {
          brand_name?: string[];
          generic_name?: string[];
          manufacturer_name?: string[];
        };
        indications_and_usage?: string[];
        warnings?: string[];
        drug_interactions?: string[];
        adverse_reactions?: string[];
      }>;
    }>(`https://api.fda.gov/drug/label.json?search=${q}&limit=2`);

    for (const row of data?.results ?? []) {
      const brand =
        row.openfda?.brand_name?.[0] ??
        row.openfda?.generic_name?.[0] ??
        term;
      const detail =
        cleanSnippet(row.warnings?.[0]) ??
        cleanSnippet(row.drug_interactions?.[0]) ??
        cleanSnippet(row.indications_and_usage?.[0]) ??
        cleanSnippet(row.adverse_reactions?.[0]);
      const setId = row.id ?? `${term}-${hits.length}`;
      hits.push({
        id: `web-fda-${setId}`,
        title: `FDA drug label · ${brand}`,
        detail,
        url: `https://api.fda.gov/drug/label.json?search=id:"${encodeURIComponent(String(setId))}"&limit=1`,
        citation: 'U.S. FDA openFDA drug labeling',
      });
      // Prefer a human-facing Drugs@FDA / DailyMed style landing when possible
      hits[hits.length - 1].url = `https://www.accessdata.fda.gov/scripts/cder/daf/`;
    }
  }

  // Better human URLs via DailyMed search page for the substance name
  return hits.slice(0, 4).map((hit, index) => {
    const term = queries[Math.min(index, queries.length - 1)] ?? 'drug';
    return {
      ...hit,
      citation: 'DailyMed (FDA)',
      url: `https://dailymed.nlm.nih.gov/dailymed/search.cfm?labeltype=all&query=${encodeURIComponent(term)}`,
    };
  });
}

async function searchPubMed(query: string): Promise<WebResearchHit[]> {
  const search = await fetchJson<{
    esearchresult?: { idlist?: string[] };
  }>(
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=4&sort=relevance&term=${encodeURIComponent(query)}`
  );

  const ids = search?.esearchresult?.idlist ?? [];
  if (ids.length === 0) return [];

  const summary = await fetchJson<{
    result?: Record<
      string,
      {
        uid?: string;
        title?: string;
        source?: string;
        pubdate?: string;
        authors?: { name?: string }[];
      }
    >;
  }>(
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(',')}`
  );

  const hits: WebResearchHit[] = [];
  for (const id of ids) {
    const row = summary?.result?.[id];
    if (!row?.title) continue;
    const authors = (row.authors ?? [])
      .slice(0, 2)
      .map((a) => a.name)
      .filter(Boolean)
      .join(', ');
      hits.push({
        id: `web-pubmed-${id}`,
        title: row.title,
        detail: cleanSnippet(
          [authors || null, row.source ?? null, row.pubdate ?? null].filter(Boolean).join(' · ')
        ),
        url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
        citation: 'PubMed',
      });
  }
  return hits;
}

async function searchTavily(query: string): Promise<WebResearchHit[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return [];

  const data = await fetchJson<{
    results?: Array<{ title?: string; url?: string; content?: string }>;
  }>('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query: `${query} medication OR drug OR supplement safety`,
      search_depth: 'basic',
      include_domains: TRUSTED_DOMAINS,
      max_results: 5,
    }),
  });

  return (data?.results ?? [])
    .filter((r) => r.url && r.title)
    .map((r, index) => ({
      id: `web-tavily-${index}-${Buffer.from(r.url!).toString('base64url').slice(0, 12)}`,
      title: r.title!,
      detail: cleanSnippet(r.content),
      url: r.url!,
      citation: (() => {
        try {
          return new URL(r.url!).hostname.replace(/^www\./, '');
        } catch {
          return 'Web source';
        }
      })(),
    }));
}

function buildResearchQuery(message: string, substanceHints: string[]): string {
  const hints = substanceHints.slice(0, 4).join(' ');
  return [hints, message].filter(Boolean).join(' ').slice(0, 240);
}

/**
 * Gather trusted external references for an AI answer.
 * Always-safe sources: OpenFDA + PubMed. Optional: Tavily (TAVILY_API_KEY).
 */
export async function researchExternalSources(options: {
  message: string;
  substanceHints?: string[];
}): Promise<WebResearchHit[]> {
  const { message, substanceHints = [] } = options;
  if (!shouldRunWebResearch(message) && substanceHints.length === 0) {
    return [];
  }

  const query = buildResearchQuery(message, substanceHints);
  const terms =
    substanceHints.length > 0
      ? substanceHints.slice(0, 3)
      : message
          .split(/[^a-zA-Z0-9+.-]+/)
          .map((t) => t.trim())
          .filter((t) => t.length >= 4)
          .slice(0, 3);

  const [fda, pubmed, tavily] = await Promise.all([
    terms.length > 0 ? searchOpenFda(terms) : Promise.resolve([]),
    searchPubMed(query),
    searchTavily(query),
  ]);

  const seen = new Set<string>();
  const merged: WebResearchHit[] = [];
  for (const hit of [...tavily, ...pubmed, ...fda]) {
    const key = hit.url.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(hit);
    if (merged.length >= 6) break;
  }
  return merged;
}
