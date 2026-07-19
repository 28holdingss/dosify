import { Hono } from 'hono';
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

function serializeProduct(product: ProductWithRelations) {
  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    dosageForm: product.dosageForm,
    manufacturer: product.manufacturer,
    description: product.description,
    substanceId: product.substanceId,
    externalId: product.externalId,
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

/** GET /api/products/by-barcode/:code */
productRoutes.get('/by-barcode/:code', async (c) => {
  const code = c.req.param('code').trim();
  if (!code) {
    return c.json({ error: 'Barcode required', needsManualEntry: true }, 400);
  }

  const barcode = await prisma.productBarcode.findUnique({
    where: { code },
    include: {
      product: { include: productInclude },
    },
  });

  if (!barcode) {
    return c.json(
      {
        error: 'Product not found for this barcode',
        needsManualEntry: true,
      },
      404
    );
  }

  return c.json(serializeProduct(barcode.product));
});

/** GET /api/products/search?q= */
productRoutes.get('/search', async (c) => {
  const q = (c.req.query('q') ?? '').trim();
  if (q.length < 2) {
    return c.json({ products: [], substances: [] });
  }

  const take = Math.min(Number(c.req.query('limit') ?? 20) || 20, 40);

  const [products, substances] = await Promise.all([
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
      take,
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
  ]);

  return c.json({
    products: products.map((p) => serializeProduct(p)),
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
