/**
 * Barcode → product resolution beyond the local ProductBarcode table.
 * Tries Open*Facts, then UPCitemdb; matches hits to catalog substances when possible.
 */

import { prisma } from './prisma.js';

export type ExternalProductHit = {
  name: string;
  brand: string | null;
  dosageForm: string | null;
  manufacturer: string | null;
  description: string | null;
  externalId: string;
  canonicalCode: string;
  source:
    | 'openfoodfacts'
    | 'openbeautyfacts'
    | 'openproductsfacts'
    | 'upcitemdb'
    | 'openfda';
};

const UA = 'Dosify/1.0 (health companion; barcode lookup; contact support@mydosify.com)';

/** Digits-only variants so UPC-A / EAN-13 leading-zero differences still match. */
export function barcodeVariants(raw: string): string[] {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return [];

  const set = new Set<string>([digits]);

  if (digits.length === 12) {
    set.add(`0${digits}`);
  }
  if (digits.length === 13 && digits.startsWith('0')) {
    set.add(digits.slice(1));
  }
  if (digits.length > 8) {
    const trimmed = digits.replace(/^0+/, '');
    if (trimmed.length >= 8 && trimmed !== digits) {
      set.add(trimmed);
      if (trimmed.length === 12) set.add(`0${trimmed}`);
      if (trimmed.length === 11) {
        set.add(`0${trimmed}`);
        set.add(`00${trimmed}`);
      }
    }
  }

  return [...set];
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': UA,
      },
      signal: AbortSignal.timeout(9000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

type OffProduct = {
  status?: number;
  code?: string;
  product?: {
    product_name?: string;
    product_name_en?: string;
    generic_name?: string;
    brands?: string;
    quantity?: string;
    categories?: string;
    ingredients_text?: string;
    countries?: string;
  };
};

async function lookupOpenFacts(
  code: string,
  host: 'world.openfoodfacts.org' | 'world.openbeautyfacts.org' | 'world.openproductsfacts.org',
  source: ExternalProductHit['source']
): Promise<ExternalProductHit | null> {
  const fields =
    'code,product_name,product_name_en,generic_name,brands,quantity,categories,ingredients_text';
  const data = await fetchJson<OffProduct>(
    `https://${host}/api/v2/product/${encodeURIComponent(code)}.json?fields=${fields}`
  );
  if (!data || data.status !== 1 || !data.product) return null;

  const p = data.product;
  const name =
    clean(p.product_name) ||
    clean(p.product_name_en) ||
    clean(p.generic_name) ||
    null;
  if (!name) return null;

  const brand = clean(p.brands)?.split(',')[0]?.trim() ?? null;
  const bits = [
    clean(p.quantity),
    clean(p.categories)?.split(',')[0]?.trim(),
    clean(p.ingredients_text),
  ].filter(Boolean);

  return {
    name,
    brand,
    dosageForm: clean(p.quantity),
    manufacturer: brand,
    description: bits.length
      ? `${bits.join(' · ')} (via ${sourceLabel(source)})`
      : `Catalog match via ${sourceLabel(source)}`,
    externalId: `${source}:${data.code ?? code}`,
    canonicalCode: String(data.code ?? code).replace(/\D/g, '') || code,
    source,
  };
}

type UpcItemDbResponse = {
  code?: string;
  total?: number;
  items?: Array<{
    title?: string;
    brand?: string;
    description?: string;
    category?: string;
    upc?: string;
    ean?: string;
  }>;
};

async function lookupUpcItemDb(code: string): Promise<ExternalProductHit | null> {
  const data = await fetchJson<UpcItemDbResponse>(
    `https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(code)}`
  );
  const item = data?.items?.[0];
  if (!item?.title) return null;

  const brand = clean(item.brand);
  const descBits = [clean(item.category), clean(item.description)].filter(Boolean);

  return {
    name: item.title.trim(),
    brand,
    dosageForm: null,
    manufacturer: brand,
    description: descBits.length
      ? `${descBits.join(' · ')} (via UPCitemdb)`
      : 'Catalog match via UPCitemdb',
    externalId: `upcitemdb:${item.upc ?? item.ean ?? code}`,
    canonicalCode: String(item.upc ?? item.ean ?? code).replace(/\D/g, '') || code,
    source: 'upcitemdb',
  };
}

function clean(value: string | null | undefined): string | null {
  if (!value) return null;
  const flat = value.replace(/\s+/g, ' ').trim();
  return flat || null;
}

function sourceLabel(source: ExternalProductHit['source']): string {
  switch (source) {
    case 'openfoodfacts':
      return 'Open Food Facts';
    case 'openbeautyfacts':
      return 'Open Beauty Facts';
    case 'openproductsfacts':
      return 'Open Products Facts';
    case 'upcitemdb':
      return 'UPCitemdb';
    case 'openfda':
      return 'openFDA';
  }
}

/** Resolve a retail barcode via public catalogs (no API key required). */
export async function lookupExternalBarcode(
  rawCode: string
): Promise<ExternalProductHit | null> {
  const variants = barcodeVariants(rawCode);
  if (!variants.length) return null;

  for (const code of variants) {
    const off = await lookupOpenFacts(code, 'world.openfoodfacts.org', 'openfoodfacts');
    if (off) return off;
  }
  for (const code of variants) {
    const beauty = await lookupOpenFacts(code, 'world.openbeautyfacts.org', 'openbeautyfacts');
    if (beauty) return beauty;
  }
  for (const code of variants) {
    const products = await lookupOpenFacts(
      code,
      'world.openproductsfacts.org',
      'openproductsfacts'
    );
    if (products) return products;
  }
  for (const code of variants) {
    const upc = await lookupUpcItemDb(code);
    if (upc) return upc;
  }

  return null;
}

type OffSearchResponse = {
  products?: Array<{
    code?: string;
    product_name?: string;
    product_name_en?: string;
    generic_name?: string;
    brands?: string;
    quantity?: string;
    categories?: string;
    ingredients_text?: string;
  }>;
};

type OpenFdaNdcResponse = {
  results?: Array<{
    product_ndc?: string;
    brand_name?: string;
    generic_name?: string;
    labeler_name?: string;
    dosage_form?: string;
    active_ingredients?: Array<{ name?: string; strength?: string }>;
    packaging?: Array<{ package_ndc?: string; description?: string }>;
  }>;
};

async function searchOpenFoodFacts(query: string, limit: number): Promise<ExternalProductHit[]> {
  const url =
    `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}` +
    `&search_simple=1&action=process&json=1&page_size=${limit}` +
    `&fields=code,product_name,product_name_en,generic_name,brands,quantity,categories,ingredients_text`;
  const data = await fetchJson<OffSearchResponse>(url);
  const hits: ExternalProductHit[] = [];

  for (const p of data?.products ?? []) {
    const name =
      clean(p.product_name) ||
      clean(p.product_name_en) ||
      clean(p.generic_name);
    if (!name) continue;
    const code = String(p.code ?? '').replace(/\D/g, '') || `off-search-${hits.length}`;
    const brand = clean(p.brands)?.split(',')[0]?.trim() ?? null;
    const bits = [
      clean(p.quantity),
      clean(p.categories)?.split(',')[0]?.trim(),
      clean(p.ingredients_text),
    ].filter(Boolean);
    hits.push({
      name,
      brand,
      dosageForm: clean(p.quantity),
      manufacturer: brand,
      description: bits.length
        ? `${bits.join(' · ')} (via Open Food Facts)`
        : 'Public catalog match via Open Food Facts',
      externalId: `openfoodfacts:${code}`,
      canonicalCode: code,
      source: 'openfoodfacts',
    });
  }

  return hits;
}

async function searchOpenFda(query: string, limit: number): Promise<ExternalProductHit[]> {
  const safe = query
    .replace(/[^\w\s.+-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
  if (!safe) return [];
  const first = safe.split(/\s+/)[0] ?? safe;
  // Phrase + first-token OR so "Advil" and "vitamin d" both resolve.
  const lucene = `(brand_name:"${safe}" OR generic_name:"${safe}" OR brand_name:${first} OR generic_name:${first})`;
  const data = await fetchJson<OpenFdaNdcResponse>(
    `https://api.fda.gov/drug/ndc.json?search=${encodeURIComponent(lucene)}&limit=${limit}`
  );
  const hits: ExternalProductHit[] = [];

  for (const row of data?.results ?? []) {
    const brand = clean(row.brand_name);
    const generic = clean(row.generic_name);
    const name = brand || generic;
    if (!name) continue;
    const strength = row.active_ingredients
      ?.map((a) => [clean(a.name), clean(a.strength)].filter(Boolean).join(' '))
      .filter(Boolean)
      .slice(0, 3)
      .join('; ');
    const ndc = clean(row.product_ndc) || clean(row.packaging?.[0]?.package_ndc) || `fda-${hits.length}`;
    hits.push({
      name: brand && generic && brand.toLowerCase() !== generic.toLowerCase()
        ? `${brand} (${generic})`
        : name,
      brand,
      dosageForm: clean(row.dosage_form),
      manufacturer: clean(row.labeler_name),
      description: [
        strength,
        clean(row.packaging?.[0]?.description),
        'Public drug listing via openFDA',
      ]
        .filter(Boolean)
        .join(' · '),
      externalId: `openfda:${ndc}`,
      canonicalCode: ndc.replace(/\D/g, '') || ndc,
      source: 'openfda',
    });
  }

  return hits;
}

/**
 * Public internet product/medication search (OpenFDA + Open Food Facts).
 * Used when the user types a name — not limited to Dosify's local library.
 */
export async function searchExternalProducts(
  query: string,
  limit = 12
): Promise<ExternalProductHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const perSource = Math.max(4, Math.ceil(limit / 2));
  const [fda, off] = await Promise.all([
    searchOpenFda(q, perSource),
    searchOpenFoodFacts(q, perSource),
  ]);

  const seen = new Set<string>();
  const merged: ExternalProductHit[] = [];
  for (const hit of [...fda, ...off]) {
    const key = `${hit.name.toLowerCase()}|${(hit.brand ?? '').toLowerCase()}|${hit.externalId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(hit);
    if (merged.length >= limit) break;
  }
  return merged;
}

type SubstanceRow = {
  id: string;
  name: string;
};

/**
 * Prefer the longest catalog substance name that appears in the product title/brand,
 * so "Advil Ibuprofen 200 mg" links to Ibuprofen, not a shorter false hit.
 */
export async function matchSubstanceForProduct(hit: ExternalProductHit): Promise<string | null> {
  const haystack = `${hit.name} ${hit.brand ?? ''} ${hit.description ?? ''}`.toLowerCase();
  if (haystack.length < 3) return null;

  const tokens = haystack
    .split(/[^a-z0-9+]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length >= 4);

  const uniqueTokens = [...new Set(tokens)].slice(0, 12);
  if (!uniqueTokens.length) return null;

  const candidates: SubstanceRow[] = await prisma.substance.findMany({
    where: {
      OR: [
        ...uniqueTokens.map((t) => ({
          name: { equals: t, mode: 'insensitive' as const },
        })),
        ...uniqueTokens.map((t) => ({
          name: { contains: t, mode: 'insensitive' as const },
        })),
      ],
    },
    select: { id: true, name: true },
    take: 40,
  });

  if (!candidates.length) return null;

  let best: SubstanceRow | null = null;
  for (const s of candidates) {
    const name = s.name.toLowerCase();
    if (name.length < 3) continue;
    if (!haystack.includes(name) && !uniqueTokens.includes(name)) continue;
    if (!best || s.name.length > best.name.length) best = s;
  }

  return best?.id ?? null;
}

/** Persist an external hit so the next scan is a local hit. */
export async function cacheExternalProduct(
  hit: ExternalProductHit,
  scannedCode: string,
  substanceId: string | null
) {
  const codes = new Set(barcodeVariants(scannedCode));
  codes.add(hit.canonicalCode);
  codes.add(scannedCode.replace(/\D/g, '') || scannedCode.trim());

  const existingByExternal = hit.externalId
    ? await prisma.product.findFirst({
        where: { externalId: hit.externalId },
        include: { barcodes: true },
      })
    : null;

  if (existingByExternal) {
    const have = new Set(existingByExternal.barcodes.map((b) => b.code));
    const missing = [...codes].filter((c) => c && !have.has(c));
    if (missing.length) {
      await prisma.productBarcode.createMany({
        data: missing.map((code) => ({
          productId: existingByExternal.id,
          code,
          symbology: code.length === 13 ? 'EAN' : 'UPC',
        })),
        skipDuplicates: true,
      });
    }
    if (substanceId && !existingByExternal.substanceId) {
      await prisma.product.update({
        where: { id: existingByExternal.id },
        data: { substanceId },
      });
      await prisma.productIngredient.upsert({
        where: {
          productId_substanceId: {
            productId: existingByExternal.id,
            substanceId,
          },
        },
        create: { productId: existingByExternal.id, substanceId },
        update: {},
      });
    }
    return existingByExternal.id;
  }

  // Reuse a product if any variant barcode already exists
  for (const code of codes) {
    const row = await prisma.productBarcode.findUnique({ where: { code } });
    if (row) return row.productId;
  }

  const created = await prisma.product.create({
    data: {
      name: hit.name.slice(0, 200),
      brand: hit.brand?.slice(0, 120) ?? null,
      dosageForm: hit.dosageForm?.slice(0, 80) ?? null,
      manufacturer: hit.manufacturer?.slice(0, 120) ?? null,
      description: hit.description?.slice(0, 1000) ?? null,
      substanceId,
      externalId: hit.externalId,
      barcodes: {
        create: [...codes]
          .filter(Boolean)
          .slice(0, 6)
          .map((code) => ({
            code,
            symbology: code.length === 13 ? 'EAN' : 'UPC',
          })),
      },
      ...(substanceId
        ? {
            ingredients: {
              create: { substanceId },
            },
          }
        : {}),
    },
  });

  return created.id;
}
