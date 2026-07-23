import { PrismaClient, RiskLevel, IntakeMethod, NotificationType } from '@prisma/client';
import { hashPassword } from 'better-auth/crypto';
import { INTERACTION_RULES, resolveProfile } from './seed-data.js';
import { SEED_SUBSTANCES } from './seed-substances.js';

const prisma = new PrismaClient();

/** Demo login for local / TestFlight testing. */
export const DEMO_EMAIL = 'alex@bioos.app';
export const DEMO_PASSWORD = 'Demo1234!';

async function ensureDemoCredential(userId: string) {
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const existing = await prisma.account.findFirst({
    where: { userId, providerId: 'credential' },
  });

  if (existing) {
    await prisma.account.update({
      where: { id: existing.id },
      data: {
        password: passwordHash,
        accountId: userId,
        updatedAt: new Date(),
      },
    });
    return;
  }

  await prisma.account.create({
    data: {
      userId,
      accountId: userId,
      providerId: 'credential',
      password: passwordHash,
    },
  });
}

async function main() {
  const categories = [
    { name: 'Prescription Medicines', slug: 'prescription', icon: 'medical' },
    { name: 'OTC Medicines', slug: 'otc', icon: 'bandage' },
    { name: 'Vitamins & Supplements', slug: 'vitamins', icon: 'nutrition' },
    { name: 'Alcohol', slug: 'alcohol', icon: 'wine' },
    { name: 'Cannabis', slug: 'cannabis', icon: 'leaf' },
    { name: 'Nicotine', slug: 'nicotine', icon: 'flame' },
    { name: 'Caffeine', slug: 'caffeine', icon: 'cafe' },
    { name: 'Stimulants', slug: 'stimulants', icon: 'flash' },
    { name: 'Psychedelics', slug: 'psychedelics', icon: 'color-palette' },
    { name: 'Sedatives', slug: 'sedatives', icon: 'water' },
    { name: 'Herbals', slug: 'herbals', icon: 'flower' },
    { name: 'Other', slug: 'other', icon: 'ellipse' },
  ];

  for (const cat of categories) {
    await prisma.substanceCategory.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
  }

  const categoryMap = Object.fromEntries(
    (await prisma.substanceCategory.findMany()).map((c) => [c.slug, c.id])
  );

  for (const s of SEED_SUBSTANCES) {
    const existing = await prisma.substance.findFirst({
      where: { name: s.name },
    });
    const data = {
      name: s.name,
      description: s.description,
      categoryId: categoryMap[s.categorySlug],
      defaultUnit: s.defaultUnit,
      minDose: s.minDose,
      maxDose: s.maxDose,
      isPopular: s.isPopular,
    };
    if (existing) {
      await prisma.substance.update({
        where: { id: existing.id },
        data,
      });
    } else {
      await prisma.substance.create({ data });
    }
  }

  const allSubstances = await prisma.substance.findMany({ include: { category: true } });
  for (const substance of allSubstances) {
    const profile = resolveProfile(substance.name, substance.category.slug);
    await prisma.substanceProfile.upsert({
      where: { substanceId: substance.id },
      update: profile,
      create: { substanceId: substance.id, ...profile },
    });
  }

  for (const rule of INTERACTION_RULES) {
    const existing = await prisma.interactionRule.findFirst({
      where: { title: rule.title },
    });
    if (!existing) {
      await prisma.interactionRule.create({
        data: {
          substanceA: rule.substanceA ?? '',
          substanceB: rule.substanceB ?? '',
          substanceAClass:
            'substanceAClass' in rule && typeof rule.substanceAClass === 'string'
              ? rule.substanceAClass
              : null,
          substanceBClass:
            'substanceBClass' in rule && typeof rule.substanceBClass === 'string'
              ? rule.substanceBClass
              : null,
          riskLevel: rule.riskLevel,
          title: rule.title,
          description: rule.description,
          advice: rule.advice ?? null,
          source: rule.source ?? null,
        },
      });
    }
  }

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {
      name: 'Alex Johnson',
      isPremium: true,
      onboardingCompleted: true,
      emailVerified: true,
    },
    create: {
      email: DEMO_EMAIL,
      name: 'Alex Johnson',
      isPremium: true,
      onboardingCompleted: true,
      emailVerified: true,
      healthProfile: {
        create: {
          age: 24,
          weightKg: 70,
          heightCm: 175,
          gender: 'MALE',
          medicalConditions: 'None',
          allergies: 'Penicillin',
        },
      },
      healthGoals: {
        create: [
          { goal: 'Sleep better' },
          { goal: 'Build muscle' },
          { goal: 'Reduce alcohol' },
        ],
      },
    },
    include: { healthProfile: true },
  });

  await ensureDemoCredential(user.id);
  console.log(`Demo login ready → ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);

  const ibuprofen = await prisma.substance.findFirst({ where: { name: 'Ibuprofen' } });
  const alcohol = await prisma.substance.findFirst({ where: { name: 'Alcohol' } });
  const vitaminD = await prisma.substance.findFirst({ where: { name: 'Vitamin D3' } });
  const aspirin = await prisma.substance.findFirst({ where: { name: 'Aspirin' } });

  if (ibuprofen && alcohol && vitaminD) {
    const now = new Date();
    const morning = new Date(now);
    morning.setHours(8, 20, 0, 0);

    const ibuprofenLog = await prisma.intakeLog.create({
      data: {
        userId: user.id,
        substanceId: ibuprofen.id,
        dose: 200,
        unit: 'mg',
        takenAt: morning,
        method: IntakeMethod.ORAL,
        purpose: 'Pain relief / Headache',
        status: 'ANALYZED',
        analysis: {
          create: {
            overallScore: 42,
            cognitiveScore: 42,
            cardiovascularScore: 28,
            gastrointestinalScore: 15,
            liverScore: 22,
            kidneyScore: 35,
            respiratoryScore: 8,
            interactionRiskScore: 72,
            durationMinHours: 3,
            durationMaxHours: 6,
            summary: 'Moderate risk due to potential interactions with other logged substances.',
          },
        },
      },
    });

    await prisma.intakeLog.createMany({
      data: [
        {
          userId: user.id,
          substanceId: vitaminD.id,
          dose: 1000,
          unit: 'IU',
          takenAt: new Date(morning.getTime() - 5 * 60 * 1000),
          method: IntakeMethod.ORAL,
          status: 'LOGGED',
        },
      ],
    });

    if (aspirin) {
      await prisma.interaction.createMany({
        data: [
          {
            userId: user.id,
            substanceAId: ibuprofen.id,
            substanceBId: alcohol.id,
            riskLevel: RiskLevel.HIGH,
            title: 'Ibuprofen + Alcohol',
            description: 'Combining ibuprofen with alcohol significantly increases risk of stomach bleeding and liver stress.',
            advice: 'Avoid alcohol for 6 hours after taking ibuprofen.',
          },
          {
            userId: user.id,
            substanceAId: ibuprofen.id,
            substanceBId: aspirin.id,
            riskLevel: RiskLevel.MODERATE,
            title: 'Ibuprofen + Aspirin',
            description: 'Both are NSAIDs. Taking together may increase risk of gastrointestinal side effects.',
            advice: 'Do not combine without medical guidance.',
          },
        ],
        skipDuplicates: true,
      });
    }

    await prisma.recoverySnapshot.create({
      data: {
        userId: user.id,
        score: 68,
        cognitivePct: 72,
        cardiovascularPct: 64,
        liverPct: 58,
        sleepPct: 70,
        estimatedRecoveryAt: new Date(Date.now() + 22 * 60 * 60 * 1000),
      },
    });

    await prisma.notification.createMany({
      data: [
        {
          userId: user.id,
          type: NotificationType.INTERACTION_ALERT,
          title: 'Interaction Alert',
          body: 'Moderate risk detected between Ibuprofen and Alcohol.',
        },
        {
          userId: user.id,
          type: NotificationType.HYDRATION_REMINDER,
          title: 'Hydration Reminder',
          body: "You haven't logged water in 3 hours. Stay hydrated!",
        },
        {
          userId: user.id,
          type: NotificationType.MEDICATION_REMINDER,
          title: 'Medication Reminder',
          body: 'Time to take Vitamin D3 — 1000 IU',
        },
        {
          userId: user.id,
          type: NotificationType.GOAL_SUCCESS,
          title: 'Great Job!',
          body: 'You completed 8 of 10 health goals today.',
        },
      ],
    });

    console.log(`Seeded demo intake: ${ibuprofenLog.id}`);
  }

  // Phase 3 — sample products + barcodes (demo UPCs; not real retail codes)
  const productSeeds: Array<{
    substanceName: string;
    name: string;
    brand: string;
    dosageForm: string;
    manufacturer?: string;
    description?: string;
    barcode: string;
    strengthValue?: number;
    strengthUnit?: string;
  }> = [
    {
      substanceName: 'Ibuprofen',
      name: 'Advil Ibuprofen 200 mg',
      brand: 'Advil',
      dosageForm: 'tablet',
      manufacturer: 'Haleon',
      description: 'OTC NSAID pain reliever — sample catalog entry',
      barcode: '305730168109',
      strengthValue: 200,
      strengthUnit: 'mg',
    },
    {
      substanceName: 'Paracetamol',
      name: 'Tylenol Extra Strength 500 mg',
      brand: 'Tylenol',
      dosageForm: 'caplet',
      manufacturer: 'Kenvue',
      description: 'Acetaminophen pain & fever relief — sample catalog entry',
      barcode: '300450444178',
      strengthValue: 500,
      strengthUnit: 'mg',
    },
    {
      substanceName: 'Aspirin',
      name: 'Bayer Aspirin 325 mg',
      brand: 'Bayer',
      dosageForm: 'tablet',
      description: 'Acetylsalicylic acid — sample catalog entry',
      barcode: '016500538403',
      strengthValue: 325,
      strengthUnit: 'mg',
    },
    {
      substanceName: 'Vitamin D3',
      name: 'Nature Made Vitamin D3 2000 IU',
      brand: 'Nature Made',
      dosageForm: 'softgel',
      description: 'Cholecalciferol supplement — sample catalog entry',
      barcode: '031604026156',
      strengthValue: 2000,
      strengthUnit: 'IU',
    },
  ];

  for (const seed of productSeeds) {
    const substance = await prisma.substance.findFirst({
      where: { name: seed.substanceName },
    });
    if (!substance) continue;

    const existingBarcode = await prisma.productBarcode.findUnique({
      where: { code: seed.barcode },
    });
    if (existingBarcode) continue;

    await prisma.product.create({
      data: {
        name: seed.name,
        brand: seed.brand,
        dosageForm: seed.dosageForm,
        manufacturer: seed.manufacturer ?? null,
        description: seed.description ?? null,
        substanceId: substance.id,
        barcodes: {
          create: { code: seed.barcode, symbology: 'UPC' },
        },
        ingredients: {
          create: {
            substanceId: substance.id,
            strengthValue: seed.strengthValue ?? null,
            strengthUnit: seed.strengthUnit ?? null,
          },
        },
      },
    });
  }

  console.log(
    `Database seeded: ${SEED_SUBSTANCES.length} substances, ${INTERACTION_RULES.length} interaction rules, ${productSeeds.length} sample products.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
