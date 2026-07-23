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
  source: 'openfoodfacts' | 'openbeautyfacts' | 'openproductsfacts' | 'upcitemdb';
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
