import { Hono } from 'hono';
import {
  barcodeVariants,
  cacheExternalProduct,
  lookupExternalBarcode,
  matchSubstanceForProduct,
  searchExternalProducts,
  type ExternalProductHit,
} from '../lib/barcode-lookup.js';
import { prisma } from '../lib/prisma.js';

export const productRoutes = new Hono();

const productInclude = {
  substance: {
    include: { category: true },
  },
  barcodes: true,
  ingredients: {
    include: {
      substance: {
        include: { category: true },
      },
    },
  },
} as const;

type ProductWithRelations = NonNullable<
  Awaited<
    ReturnType<
      typeof prisma.product.findFirst<{ include: typeof productInclude }>
    >
  >
>;

function serializeProduct(
  product: ProductWithRelations,
  extras?: { catalogSource?: 'local' | 'public' }
) {
  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    dosageForm: product.dosageForm,
    manufacturer: product.manufacturer,
    description: product.description,
    substanceId: product.substanceId,
    externalId: product.externalId,
    catalogSource: extras?.catalogSource ?? (product.externalId ? 'public' : 'local'),
    createdAt: product.createdAt.toISOString(),
    substance: product.substance
      ? {
          id: product.substance.id,
          name: product.substance.name,
          description: product.substance.description,
          defaultUnit: product.substance.defaultUnit,
          minDose: product.substance.minDose,
          maxDose: product.substance.maxDose,
          isPopular: product.substance.isPopular,
          category: product.substance.category,
        }
      : null,
    barcodes: product.barcodes.map((b) => ({
      id: b.id,
      code: b.code,
      symbology: b.symbology,
    })),
    ingredients: product.ingredients.map((ing) => ({
      id: ing.id,
      substanceId: ing.substanceId,
      strengthValue: ing.strengthValue,
      strengthUnit: ing.strengthUnit,
      substance: {
        id: ing.substance.id,
        name: ing.substance.name,
        description: ing.substance.description,
        defaultUnit: ing.substance.defaultUnit,
        minDose: ing.substance.minDose,
        maxDose: ing.substance.maxDose,
        isPopular: ing.substance.isPopular,
        category: ing.substance.category,
      },
    })),
  };
}

function serializeExternalHit(
  hit: ExternalProductHit,
  substanceId: string | null,
  substance: ProductWithRelations['substance'] | null
) {
  return {
    id: `public-${hit.externalId}`,
    name: hit.name,
    brand: hit.brand,
    dosageForm: hit.dosageForm,
    manufacturer: hit.manufacturer,
    description: hit.description,
    substanceId,
    externalId: hit.externalId,
    catalogSource: 'public' as const,
    createdAt: new Date().toISOString(),
    substance: substance
      ? {
          id: substance.id,
          name: substance.name,
          description: substance.description,
          defaultUnit: substance.defaultUnit,
          minDose: substance.minDose,
          maxDose: substance.maxDose,
          isPopular: substance.isPopular,
          category: substance.category,
        }
      : null,
    barcodes: hit.canonicalCode
      ? [{ id: 'tmp', code: hit.canonicalCode, symbology: 'UPC' }]
      : [],
    ingredients: [],
  };
}

async function findLocalProduct(rawCode: string): Promise<ProductWithRelations | null> {
  const variants = barcodeVariants(rawCode);
  if (!variants.length) return null;

  const barcode = await prisma.productBarcode.findFirst({
    where: { code: { in: variants } },
    include: {
      product: { include: productInclude },
    },
  });

  return barcode?.product ?? null;
}

/** GET /api/products/by-barcode/:code */
productRoutes.get('/by-barcode/:code', async (c) => {
  const code = c.req.param('code').trim();
  if (!code) {
    return c.json({ error: 'Barcode required', needsManualEntry: true }, 400);
  }

  const local = await findLocalProduct(code);
  if (local) {
    return c.json(serializeProduct(local));
  }

  const external = await lookupExternalBarcode(code);
  if (!external) {
    return c.json(
      {
        error:
          'No product found for this barcode in Dosify or public catalogs. Search by name instead.',
        needsManualEntry: true,
      },
      404
    );
  }

  const substanceId = await matchSubstanceForProduct(external);

  try {
    const productId = await cacheExternalProduct(external, code, substanceId);
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: productInclude,
    });
    if (product) {
      return c.json(serializeProduct(product));
    }
  } catch (err) {
    // Concurrent scan may have inserted the same barcode — re-read local.
    console.warn('[products] cacheExternalProduct failed', err);
    const again = await findLocalProduct(code);
    if (again) return c.json(serializeProduct(again));
  }

  // Fallback: return unsaved external shape if cache somehow failed
  return c.json({
    id: `external-${external.canonicalCode}`,
    name: external.name,
    brand: external.brand,
    dosageForm: external.dosageForm,
    manufacturer: external.manufacturer,
    description: external.description,
    substanceId,
    externalId: external.externalId,
    createdAt: new Date().toISOString(),
    substance: null,
    barcodes: [{ id: 'tmp', code: external.canonicalCode, symbology: 'UPC' }],
    ingredients: [],
  });
});

/** GET /api/products/search?q= — local library + public internet catalogs */
productRoutes.get('/search', async (c) => {
  const q = (c.req.query('q') ?? '').trim();
  if (q.length < 2) {
    return c.json({ products: [], substances: [] });
  }

  const take = Math.min(Number(c.req.query('limit') ?? 20) || 20, 40);
  const localTake = Math.min(10, take);

  const [products, substances, externalHits] = await Promise.all([
    prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { brand: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { substance: { name: { contains: q, mode: 'insensitive' } } },
        ],
      },
      include: productInclude,
      orderBy: { name: 'asc' },
      take: localTake,
    }),
    prisma.substance.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      },
      include: { category: true },
      orderBy: [{ isPopular: 'desc' }, { name: 'asc' }],
      take,
    }),
    searchExternalProducts(q, Math.max(8, take - localTake)),
  ]);

  const localExternalIds = new Set(
    products.map((p) => p.externalId).filter((id): id is string => Boolean(id))
  );
  const localNameKeys = new Set(
    products.map((p) => `${p.name.toLowerCase()}|${(p.brand ?? '').toLowerCase()}`)
  );

  const publicRows = await Promise.all(
    externalHits.map(async (hit) => {
      if (localExternalIds.has(hit.externalId)) return null;
      const nameKey = `${hit.name.toLowerCase()}|${(hit.brand ?? '').toLowerCase()}`;
      if (localNameKeys.has(nameKey)) return null;

      const substanceId = await matchSubstanceForProduct(hit);
      const substance = substanceId
        ? await prisma.substance.findUnique({
            where: { id: substanceId },
            include: { category: true },
          })
        : null;

      return serializeExternalHit(hit, substanceId, substance);
    })
  );

  const mergedProducts = [
    ...products.map((p) => serializeProduct(p)),
    ...publicRows.filter((row): row is NonNullable<typeof row> => row != null),
  ].slice(0, take);

  return c.json({
    products: mergedProducts,
    substances: substances.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      defaultUnit: s.defaultUnit,
      minDose: s.minDose,
      maxDose: s.maxDose,
      isPopular: s.isPopular,
      category: s.category,
    })),
  });
});
