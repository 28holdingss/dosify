import { SEED_SUBSTANCES } from './seed-substances.js';

export type SubstanceProfile = {
  drugClass?: string;
  halfLifeHours?: number;
  cognitiveImpact?: number;
  cardiovascularImpact?: number;
  gastrointestinalImpact?: number;
  liverImpact?: number;
  kidneyImpact?: number;
  respiratoryImpact?: number;
  typicalDurationMinHours?: number;
  typicalDurationMaxHours?: number;
  maxDailyDose?: number;
};

export const SUBSTANCE_PROFILES: Record<string, SubstanceProfile> = {
  // OTC & analgesics
  Ibuprofen: { drugClass: 'NSAID', halfLifeHours: 2, cognitiveImpact: 0.15, cardiovascularImpact: 0.25, gastrointestinalImpact: 0.55, liverImpact: 0.35, kidneyImpact: 0.5, typicalDurationMinHours: 3, typicalDurationMaxHours: 6, maxDailyDose: 1200 },
  Paracetamol: { drugClass: 'ANALGESIC', halfLifeHours: 2.5, cognitiveImpact: 0.1, cardiovascularImpact: 0.1, gastrointestinalImpact: 0.2, liverImpact: 0.45, kidneyImpact: 0.15, typicalDurationMinHours: 4, typicalDurationMaxHours: 6, maxDailyDose: 3000 },
  Aspirin: { drugClass: 'NSAID', halfLifeHours: 3, cognitiveImpact: 0.1, cardiovascularImpact: 0.3, gastrointestinalImpact: 0.5, liverImpact: 0.25, kidneyImpact: 0.4, typicalDurationMinHours: 4, typicalDurationMaxHours: 8, maxDailyDose: 4000 },
  Naproxen: { drugClass: 'NSAID', halfLifeHours: 12, cognitiveImpact: 0.12, cardiovascularImpact: 0.28, gastrointestinalImpact: 0.52, liverImpact: 0.3, kidneyImpact: 0.48, typicalDurationMinHours: 8, typicalDurationMaxHours: 12, maxDailyDose: 880 },
  Diphenhydramine: { drugClass: 'ANTIHISTAMINE', halfLifeHours: 4, cognitiveImpact: 0.55, cardiovascularImpact: 0.2, gastrointestinalImpact: 0.15, liverImpact: 0.15, typicalDurationMinHours: 4, typicalDurationMaxHours: 8, maxDailyDose: 50 },
  Loratadine: { drugClass: 'ANTIHISTAMINE', halfLifeHours: 8, cognitiveImpact: 0.08, cardiovascularImpact: 0.05, gastrointestinalImpact: 0.08, liverImpact: 0.08, typicalDurationMinHours: 12, typicalDurationMaxHours: 24 },
  Omeprazole: { drugClass: 'PPI', halfLifeHours: 1, cognitiveImpact: 0.05, gastrointestinalImpact: 0.1, liverImpact: 0.12, typicalDurationMinHours: 12, typicalDurationMaxHours: 24 },
  Dextromethorphan: { drugClass: 'DISSOCIATIVE', halfLifeHours: 3, cognitiveImpact: 0.75, cardiovascularImpact: 0.35, gastrointestinalImpact: 0.25, liverImpact: 0.2, typicalDurationMinHours: 4, typicalDurationMaxHours: 8, maxDailyDose: 60 },
  Loperamide: { drugClass: 'OPIOID', halfLifeHours: 11, cognitiveImpact: 0.2, cardiovascularImpact: 0.15, gastrointestinalImpact: 0.5, liverImpact: 0.25, typicalDurationMinHours: 8, typicalDurationMaxHours: 24 },
  Pseudoephedrine: { drugClass: 'DECONGESTANT', halfLifeHours: 6, cognitiveImpact: 0.4, cardiovascularImpact: 0.45, gastrointestinalImpact: 0.12, liverImpact: 0.08, typicalDurationMinHours: 4, typicalDurationMaxHours: 8, maxDailyDose: 60 },
  Cetirizine: { drugClass: 'ANTIHISTAMINE', halfLifeHours: 8, cognitiveImpact: 0.1, cardiovascularImpact: 0.05, gastrointestinalImpact: 0.08, liverImpact: 0.08, typicalDurationMinHours: 12, typicalDurationMaxHours: 24 },
  Doxylamine: { drugClass: 'ANTIHISTAMINE', halfLifeHours: 10, cognitiveImpact: 0.58, cardiovascularImpact: 0.15, gastrointestinalImpact: 0.12, liverImpact: 0.12, typicalDurationMinHours: 6, typicalDurationMaxHours: 12 },
  Guaifenesin: { drugClass: 'EXPECTORANT', halfLifeHours: 1, cognitiveImpact: 0.05, gastrointestinalImpact: 0.12, typicalDurationMinHours: 4, typicalDurationMaxHours: 8 },
  Phenylephrine: { drugClass: 'DECONGESTANT', halfLifeHours: 2.5, cognitiveImpact: 0.25, cardiovascularImpact: 0.38, gastrointestinalImpact: 0.1, typicalDurationMinHours: 2, typicalDurationMaxHours: 4 },

  // Prescription — psych & pain
  Amoxicillin: { drugClass: 'ANTIBIOTIC', halfLifeHours: 1.5, cognitiveImpact: 0.1, gastrointestinalImpact: 0.35, liverImpact: 0.2, typicalDurationMinHours: 6, typicalDurationMaxHours: 12 },
  Sertraline: { drugClass: 'SSRI', halfLifeHours: 26, cognitiveImpact: 0.2, cardiovascularImpact: 0.15, gastrointestinalImpact: 0.3, liverImpact: 0.2, typicalDurationMinHours: 24, typicalDurationMaxHours: 48 },
  Fluoxetine: { drugClass: 'SSRI', halfLifeHours: 96, cognitiveImpact: 0.22, cardiovascularImpact: 0.12, gastrointestinalImpact: 0.32, liverImpact: 0.22, typicalDurationMinHours: 24, typicalDurationMaxHours: 72 },
  Escitalopram: { drugClass: 'SSRI', halfLifeHours: 27, cognitiveImpact: 0.18, cardiovascularImpact: 0.12, gastrointestinalImpact: 0.28, liverImpact: 0.18, typicalDurationMinHours: 24, typicalDurationMaxHours: 48 },
  Lorazepam: { drugClass: 'BENZODIAZEPINE', halfLifeHours: 12, cognitiveImpact: 0.65, cardiovascularImpact: 0.2, gastrointestinalImpact: 0.1, liverImpact: 0.2, respiratoryImpact: 0.55, typicalDurationMinHours: 6, typicalDurationMaxHours: 12, maxDailyDose: 2 },
  Alprazolam: { drugClass: 'BENZODIAZEPINE', halfLifeHours: 11, cognitiveImpact: 0.68, cardiovascularImpact: 0.18, gastrointestinalImpact: 0.1, liverImpact: 0.22, respiratoryImpact: 0.55, typicalDurationMinHours: 4, typicalDurationMaxHours: 8, maxDailyDose: 2 },
  Clonazepam: { drugClass: 'BENZODIAZEPINE', halfLifeHours: 30, cognitiveImpact: 0.62, cardiovascularImpact: 0.18, gastrointestinalImpact: 0.1, liverImpact: 0.2, respiratoryImpact: 0.5, typicalDurationMinHours: 8, typicalDurationMaxHours: 24, maxDailyDose: 2 },
  Oxycodone: { drugClass: 'OPIOID', halfLifeHours: 4, cognitiveImpact: 0.7, cardiovascularImpact: 0.25, gastrointestinalImpact: 0.45, liverImpact: 0.4, respiratoryImpact: 0.7, kidneyImpact: 0.25, typicalDurationMinHours: 3, typicalDurationMaxHours: 6, maxDailyDose: 30 },
  Hydrocodone: { drugClass: 'OPIOID', halfLifeHours: 4, cognitiveImpact: 0.68, cardiovascularImpact: 0.22, gastrointestinalImpact: 0.42, liverImpact: 0.38, respiratoryImpact: 0.65, kidneyImpact: 0.22, typicalDurationMinHours: 3, typicalDurationMaxHours: 6, maxDailyDose: 20 },
  Tramadol: { drugClass: 'OPIOID', halfLifeHours: 6, cognitiveImpact: 0.55, cardiovascularImpact: 0.2, gastrointestinalImpact: 0.38, liverImpact: 0.35, respiratoryImpact: 0.55, kidneyImpact: 0.3, typicalDurationMinHours: 4, typicalDurationMaxHours: 8, maxDailyDose: 100 },
  Gabapentin: { drugClass: 'GABAERGIC', halfLifeHours: 6, cognitiveImpact: 0.45, cardiovascularImpact: 0.1, gastrointestinalImpact: 0.2, liverImpact: 0.08, kidneyImpact: 0.55, typicalDurationMinHours: 6, typicalDurationMaxHours: 12 },
  Pregabalin: { drugClass: 'GABAERGIC', halfLifeHours: 6, cognitiveImpact: 0.48, cardiovascularImpact: 0.12, gastrointestinalImpact: 0.22, liverImpact: 0.05, kidneyImpact: 0.55, typicalDurationMinHours: 6, typicalDurationMaxHours: 12 },
  Methadone: { drugClass: 'OPIOID', halfLifeHours: 24, cognitiveImpact: 0.72, cardiovascularImpact: 0.35, gastrointestinalImpact: 0.4, liverImpact: 0.45, respiratoryImpact: 0.72, typicalDurationMinHours: 12, typicalDurationMaxHours: 36, maxDailyDose: 40 },
  Buprenorphine: { drugClass: 'OPIOID', halfLifeHours: 24, cognitiveImpact: 0.6, cardiovascularImpact: 0.2, gastrointestinalImpact: 0.35, liverImpact: 0.4, respiratoryImpact: 0.55, typicalDurationMinHours: 12, typicalDurationMaxHours: 36, maxDailyDose: 16 },
  Zolpidem: { drugClass: 'HYPNOTIC', halfLifeHours: 2.5, cognitiveImpact: 0.7, cardiovascularImpact: 0.12, gastrointestinalImpact: 0.1, liverImpact: 0.18, respiratoryImpact: 0.4, typicalDurationMinHours: 4, typicalDurationMaxHours: 8, maxDailyDose: 10 },
  Metformin: { drugClass: 'ANTIDIABETIC', halfLifeHours: 5, cognitiveImpact: 0.05, gastrointestinalImpact: 0.35, liverImpact: 0.05, kidneyImpact: 0.55, typicalDurationMinHours: 8, typicalDurationMaxHours: 12 },
  Prednisone: { drugClass: 'CORTICOSTEROID', halfLifeHours: 3, cognitiveImpact: 0.25, cardiovascularImpact: 0.3, gastrointestinalImpact: 0.35, liverImpact: 0.25, typicalDurationMinHours: 12, typicalDurationMaxHours: 24 },
  Methylphenidate: { drugClass: 'STIMULANT', halfLifeHours: 3, cognitiveImpact: 0.7, cardiovascularImpact: 0.62, gastrointestinalImpact: 0.22, liverImpact: 0.25, typicalDurationMinHours: 3, typicalDurationMaxHours: 6, maxDailyDose: 60 },
  Lisdexamfetamine: { drugClass: 'STIMULANT', halfLifeHours: 11, cognitiveImpact: 0.72, cardiovascularImpact: 0.65, gastrointestinalImpact: 0.25, liverImpact: 0.28, typicalDurationMinHours: 8, typicalDurationMaxHours: 14, maxDailyDose: 70 },
  Citalopram: { drugClass: 'SSRI', halfLifeHours: 35, cognitiveImpact: 0.19, cardiovascularImpact: 0.14, gastrointestinalImpact: 0.28, liverImpact: 0.18, typicalDurationMinHours: 24, typicalDurationMaxHours: 48 },
  Venlafaxine: { drugClass: 'SNRI', halfLifeHours: 5, cognitiveImpact: 0.22, cardiovascularImpact: 0.18, gastrointestinalImpact: 0.32, liverImpact: 0.2, typicalDurationMinHours: 24, typicalDurationMaxHours: 48 },
  Bupropion: { drugClass: 'NDRI', halfLifeHours: 21, cognitiveImpact: 0.35, cardiovascularImpact: 0.22, gastrointestinalImpact: 0.25, liverImpact: 0.25, typicalDurationMinHours: 24, typicalDurationMaxHours: 48 },
  Mirtazapine: { drugClass: 'ANTIDEPRESSANT', halfLifeHours: 20, cognitiveImpact: 0.55, cardiovascularImpact: 0.12, gastrointestinalImpact: 0.2, liverImpact: 0.18, typicalDurationMinHours: 24, typicalDurationMaxHours: 48 },
  Trazodone: { drugClass: 'ANTIDEPRESSANT', halfLifeHours: 7, cognitiveImpact: 0.6, cardiovascularImpact: 0.15, gastrointestinalImpact: 0.18, liverImpact: 0.15, typicalDurationMinHours: 6, typicalDurationMaxHours: 12, maxDailyDose: 150 },
  Diazepam: { drugClass: 'BENZODIAZEPINE', halfLifeHours: 48, cognitiveImpact: 0.62, cardiovascularImpact: 0.18, gastrointestinalImpact: 0.1, liverImpact: 0.2, respiratoryImpact: 0.5, typicalDurationMinHours: 8, typicalDurationMaxHours: 24, maxDailyDose: 10 },
  Codeine: { drugClass: 'OPIOID', halfLifeHours: 3, cognitiveImpact: 0.55, cardiovascularImpact: 0.18, gastrointestinalImpact: 0.4, liverImpact: 0.35, respiratoryImpact: 0.6, kidneyImpact: 0.2, typicalDurationMinHours: 3, typicalDurationMaxHours: 6, maxDailyDose: 60 },
  Morphine: { drugClass: 'OPIOID', halfLifeHours: 2.5, cognitiveImpact: 0.75, cardiovascularImpact: 0.28, gastrointestinalImpact: 0.48, liverImpact: 0.42, respiratoryImpact: 0.75, kidneyImpact: 0.25, typicalDurationMinHours: 3, typicalDurationMaxHours: 6, maxDailyDose: 30 },
  Fentanyl: { drugClass: 'OPIOID', halfLifeHours: 3.5, cognitiveImpact: 0.85, cardiovascularImpact: 0.35, gastrointestinalImpact: 0.42, liverImpact: 0.4, respiratoryImpact: 0.85, typicalDurationMinHours: 2, typicalDurationMaxHours: 6, maxDailyDose: 100 },
  Heroin: { drugClass: 'OPIOID', halfLifeHours: 0.5, cognitiveImpact: 0.82, cardiovascularImpact: 0.3, gastrointestinalImpact: 0.45, liverImpact: 0.45, respiratoryImpact: 0.8, typicalDurationMinHours: 2, typicalDurationMaxHours: 5, maxDailyDose: 50 },
  Quetiapine: { drugClass: 'ANTIPSYCHOTIC', halfLifeHours: 6, cognitiveImpact: 0.65, cardiovascularImpact: 0.22, gastrointestinalImpact: 0.2, liverImpact: 0.25, typicalDurationMinHours: 8, typicalDurationMaxHours: 24 },
  Lithium: { drugClass: 'MOOD_STABILIZER', halfLifeHours: 24, cognitiveImpact: 0.25, cardiovascularImpact: 0.12, gastrointestinalImpact: 0.25, liverImpact: 0.05, kidneyImpact: 0.6, typicalDurationMinHours: 24, typicalDurationMaxHours: 48 },
  Atorvastatin: { drugClass: 'STATIN', halfLifeHours: 14, cognitiveImpact: 0.08, cardiovascularImpact: 0.1, gastrointestinalImpact: 0.15, liverImpact: 0.2, typicalDurationMinHours: 24, typicalDurationMaxHours: 48 },
  Levothyroxine: { drugClass: 'HORMONE', halfLifeHours: 168, cognitiveImpact: 0.1, cardiovascularImpact: 0.15, typicalDurationMinHours: 24, typicalDurationMaxHours: 72 },
  Lisinopril: { drugClass: 'ACE_INHIBITOR', halfLifeHours: 12, cognitiveImpact: 0.05, cardiovascularImpact: 0.2, gastrointestinalImpact: 0.1, liverImpact: 0.05, typicalDurationMinHours: 12, typicalDurationMaxHours: 24 },
  Cyclobenzaprine: { drugClass: 'MUSCLE_RELAXANT', halfLifeHours: 18, cognitiveImpact: 0.55, cardiovascularImpact: 0.15, gastrointestinalImpact: 0.15, liverImpact: 0.12, typicalDurationMinHours: 6, typicalDurationMaxHours: 12 },
  Sumatriptan: { drugClass: 'TRIPTAN', halfLifeHours: 2, cognitiveImpact: 0.2, cardiovascularImpact: 0.35, gastrointestinalImpact: 0.15, liverImpact: 0.1, typicalDurationMinHours: 2, typicalDurationMaxHours: 4 },
  Doxycycline: { drugClass: 'ANTIBIOTIC', halfLifeHours: 18, cognitiveImpact: 0.08, gastrointestinalImpact: 0.35, liverImpact: 0.15, typicalDurationMinHours: 12, typicalDurationMaxHours: 24 },
  Sildenafil: { drugClass: 'PDE5_INHIBITOR', halfLifeHours: 4, cognitiveImpact: 0.05, cardiovascularImpact: 0.35, gastrointestinalImpact: 0.1, liverImpact: 0.12, typicalDurationMinHours: 4, typicalDurationMaxHours: 6 },
  'Birth Control Pill': { drugClass: 'HORMONE', halfLifeHours: 24, cognitiveImpact: 0.08, cardiovascularImpact: 0.18, gastrointestinalImpact: 0.12, liverImpact: 0.15, typicalDurationMinHours: 24, typicalDurationMaxHours: 48 },

  // Vitamins
  'Vitamin D3': { drugClass: 'VITAMIN', halfLifeHours: 24, cognitiveImpact: 0.05, cardiovascularImpact: 0.05, gastrointestinalImpact: 0.05, liverImpact: 0.05, typicalDurationMinHours: 12, typicalDurationMaxHours: 24 },
  'Vitamin C': { drugClass: 'VITAMIN', halfLifeHours: 2, cognitiveImpact: 0.04, gastrointestinalImpact: 0.08, typicalDurationMinHours: 4, typicalDurationMaxHours: 8 },
  'Vitamin B12': { drugClass: 'VITAMIN', halfLifeHours: 6, cognitiveImpact: 0.06, typicalDurationMinHours: 8, typicalDurationMaxHours: 24 },
  Magnesium: { drugClass: 'MINERAL', halfLifeHours: 12, cognitiveImpact: 0.1, gastrointestinalImpact: 0.2, liverImpact: 0.05, typicalDurationMinHours: 6, typicalDurationMaxHours: 12 },
  Iron: { drugClass: 'MINERAL', halfLifeHours: 6, gastrointestinalImpact: 0.35, typicalDurationMinHours: 8, typicalDurationMaxHours: 24 },
  Zinc: { drugClass: 'MINERAL', halfLifeHours: 4, gastrointestinalImpact: 0.15, typicalDurationMinHours: 6, typicalDurationMaxHours: 12 },
  'Omega 3': { drugClass: 'SUPPLEMENT', cognitiveImpact: 0.05, cardiovascularImpact: 0.1, gastrointestinalImpact: 0.1, liverImpact: 0.05, typicalDurationMinHours: 8, typicalDurationMaxHours: 24 },
  Creatine: { drugClass: 'SUPPLEMENT', cognitiveImpact: 0.08, cardiovascularImpact: 0.05, gastrointestinalImpact: 0.1, typicalDurationMinHours: 24, typicalDurationMaxHours: 48 },
  Melatonin: { drugClass: 'HORMONE', halfLifeHours: 0.75, cognitiveImpact: 0.35, cardiovascularImpact: 0.05, typicalDurationMinHours: 4, typicalDurationMaxHours: 8, maxDailyDose: 10 },
  Electrolytes: { drugClass: 'SUPPLEMENT', cardiovascularImpact: 0.08, typicalDurationMinHours: 2, typicalDurationMaxHours: 6 },
  'L-Theanine': { drugClass: 'AMINO_ACID', halfLifeHours: 3, cognitiveImpact: 0.15, cardiovascularImpact: 0.05, gastrointestinalImpact: 0.05, typicalDurationMinHours: 3, typicalDurationMaxHours: 6 },
  'Vitamin B Complex': { drugClass: 'VITAMIN', cognitiveImpact: 0.08, gastrointestinalImpact: 0.1, typicalDurationMinHours: 8, typicalDurationMaxHours: 24 },
  Probiotics: { drugClass: 'SUPPLEMENT', gastrointestinalImpact: 0.08, typicalDurationMinHours: 8, typicalDurationMaxHours: 24 },
  CoQ10: { drugClass: 'SUPPLEMENT', cardiovascularImpact: 0.1, typicalDurationMinHours: 8, typicalDurationMaxHours: 24 },
  '5-HTP': { drugClass: 'SEROTONIN_PRECURSOR', halfLifeHours: 2, cognitiveImpact: 0.25, gastrointestinalImpact: 0.15, typicalDurationMinHours: 4, typicalDurationMaxHours: 8, maxDailyDose: 300 },
  Turmeric: { drugClass: 'HERBAL', cognitiveImpact: 0.08, gastrointestinalImpact: 0.12, liverImpact: 0.08, typicalDurationMinHours: 6, typicalDurationMaxHours: 12 },
  Biotin: { drugClass: 'VITAMIN', cognitiveImpact: 0.04, typicalDurationMinHours: 8, typicalDurationMaxHours: 24 },
  Calcium: { drugClass: 'MINERAL', gastrointestinalImpact: 0.12, typicalDurationMinHours: 8, typicalDurationMaxHours: 24 },

  // Alcohol
  Alcohol: { drugClass: 'DEPRESSANT', halfLifeHours: 4, cognitiveImpact: 0.7, cardiovascularImpact: 0.45, gastrointestinalImpact: 0.4, liverImpact: 0.65, respiratoryImpact: 0.45, typicalDurationMinHours: 2, typicalDurationMaxHours: 8, maxDailyDose: 4 },
  Beer: { drugClass: 'DEPRESSANT', halfLifeHours: 4, cognitiveImpact: 0.65, cardiovascularImpact: 0.42, gastrointestinalImpact: 0.38, liverImpact: 0.6, respiratoryImpact: 0.4, typicalDurationMinHours: 2, typicalDurationMaxHours: 8 },
  Wine: { drugClass: 'DEPRESSANT', halfLifeHours: 4, cognitiveImpact: 0.68, cardiovascularImpact: 0.44, gastrointestinalImpact: 0.4, liverImpact: 0.62, respiratoryImpact: 0.42, typicalDurationMinHours: 2, typicalDurationMaxHours: 8 },
  Spirits: { drugClass: 'DEPRESSANT', halfLifeHours: 4, cognitiveImpact: 0.75, cardiovascularImpact: 0.48, gastrointestinalImpact: 0.42, liverImpact: 0.68, respiratoryImpact: 0.48, typicalDurationMinHours: 2, typicalDurationMaxHours: 8 },

  // Cannabis
  Cannabis: { drugClass: 'CANNABINOID', halfLifeHours: 6, cognitiveImpact: 0.75, cardiovascularImpact: 0.35, gastrointestinalImpact: 0.15, liverImpact: 0.2, typicalDurationMinHours: 2, typicalDurationMaxHours: 6 },
  'THC Edible': { drugClass: 'CANNABINOID', halfLifeHours: 8, cognitiveImpact: 0.8, cardiovascularImpact: 0.38, gastrointestinalImpact: 0.25, liverImpact: 0.22, typicalDurationMinHours: 4, typicalDurationMaxHours: 10 },
  'CBD Oil': { drugClass: 'CANNABINOID', halfLifeHours: 18, cognitiveImpact: 0.15, cardiovascularImpact: 0.08, gastrointestinalImpact: 0.1, liverImpact: 0.12, typicalDurationMinHours: 6, typicalDurationMaxHours: 12 },
  'Delta-8 THC': { drugClass: 'CANNABINOID', halfLifeHours: 5, cognitiveImpact: 0.72, cardiovascularImpact: 0.32, gastrointestinalImpact: 0.18, liverImpact: 0.18, typicalDurationMinHours: 2, typicalDurationMaxHours: 6 },
  HHC: { drugClass: 'CANNABINOID', halfLifeHours: 5, cognitiveImpact: 0.74, cardiovascularImpact: 0.34, gastrointestinalImpact: 0.18, liverImpact: 0.18, typicalDurationMinHours: 2, typicalDurationMaxHours: 6 },
  'THCA Flower': { drugClass: 'CANNABINOID', halfLifeHours: 6, cognitiveImpact: 0.73, cardiovascularImpact: 0.33, gastrointestinalImpact: 0.16, liverImpact: 0.19, typicalDurationMinHours: 2, typicalDurationMaxHours: 6 },
  'Cannabis Concentrate': { drugClass: 'CANNABINOID', halfLifeHours: 4, cognitiveImpact: 0.88, cardiovascularImpact: 0.42, gastrointestinalImpact: 0.2, liverImpact: 0.22, typicalDurationMinHours: 1, typicalDurationMaxHours: 4 },
  'Cannabis Vape': { drugClass: 'CANNABINOID', halfLifeHours: 3, cognitiveImpact: 0.78, cardiovascularImpact: 0.38, gastrointestinalImpact: 0.15, liverImpact: 0.18, typicalDurationMinHours: 1, typicalDurationMaxHours: 3 },

  // Nicotine
  Nicotine: { drugClass: 'STIMULANT', halfLifeHours: 2, cognitiveImpact: 0.45, cardiovascularImpact: 0.55, gastrointestinalImpact: 0.2, liverImpact: 0.15, typicalDurationMinHours: 1, typicalDurationMaxHours: 2, maxDailyDose: 24 },
  'Nicotine Pouch': { drugClass: 'STIMULANT', halfLifeHours: 2, cognitiveImpact: 0.42, cardiovascularImpact: 0.52, gastrointestinalImpact: 0.18, liverImpact: 0.12, typicalDurationMinHours: 0.5, typicalDurationMaxHours: 2 },
  'Nicotine Patch': { drugClass: 'STIMULANT', halfLifeHours: 2, cognitiveImpact: 0.35, cardiovascularImpact: 0.4, gastrointestinalImpact: 0.12, liverImpact: 0.1, typicalDurationMinHours: 8, typicalDurationMaxHours: 24 },
  'Nicotine Gum': { drugClass: 'STIMULANT', halfLifeHours: 2, cognitiveImpact: 0.4, cardiovascularImpact: 0.48, gastrointestinalImpact: 0.15, liverImpact: 0.1, typicalDurationMinHours: 0.5, typicalDurationMaxHours: 2 },

  // Caffeine
  Coffee: { drugClass: 'STIMULANT', halfLifeHours: 5, cognitiveImpact: 0.5, cardiovascularImpact: 0.4, gastrointestinalImpact: 0.25, liverImpact: 0.05, typicalDurationMinHours: 3, typicalDurationMaxHours: 6, maxDailyDose: 4 },
  Tea: { drugClass: 'STIMULANT', halfLifeHours: 4, cognitiveImpact: 0.35, cardiovascularImpact: 0.25, gastrointestinalImpact: 0.15, liverImpact: 0.04, typicalDurationMinHours: 3, typicalDurationMaxHours: 5 },
  'Energy Drink': { drugClass: 'STIMULANT', halfLifeHours: 5, cognitiveImpact: 0.55, cardiovascularImpact: 0.48, gastrointestinalImpact: 0.28, liverImpact: 0.06, typicalDurationMinHours: 2, typicalDurationMaxHours: 6 },
  'Caffeine Pill': { drugClass: 'STIMULANT', halfLifeHours: 5, cognitiveImpact: 0.52, cardiovascularImpact: 0.42, gastrointestinalImpact: 0.22, liverImpact: 0.05, typicalDurationMinHours: 3, typicalDurationMaxHours: 6, maxDailyDose: 400 },
  'Pre-Workout': { drugClass: 'STIMULANT', halfLifeHours: 4, cognitiveImpact: 0.58, cardiovascularImpact: 0.5, gastrointestinalImpact: 0.3, liverImpact: 0.08, typicalDurationMinHours: 2, typicalDurationMaxHours: 5 },
  Matcha: { drugClass: 'STIMULANT', halfLifeHours: 4, cognitiveImpact: 0.42, cardiovascularImpact: 0.3, gastrointestinalImpact: 0.12, liverImpact: 0.04, typicalDurationMinHours: 3, typicalDurationMaxHours: 6 },
  'Yerba Mate': { drugClass: 'STIMULANT', halfLifeHours: 4.5, cognitiveImpact: 0.45, cardiovascularImpact: 0.32, gastrointestinalImpact: 0.18, liverImpact: 0.05, typicalDurationMinHours: 3, typicalDurationMaxHours: 6 },

  // Stimulants
  MDMA: { drugClass: 'EMPATHOGEN', halfLifeHours: 8, cognitiveImpact: 0.85, cardiovascularImpact: 0.75, gastrointestinalImpact: 0.45, liverImpact: 0.55, typicalDurationMinHours: 3, typicalDurationMaxHours: 8, maxDailyDose: 150 },
  Cocaine: { drugClass: 'STIMULANT', halfLifeHours: 1, cognitiveImpact: 0.8, cardiovascularImpact: 0.9, gastrointestinalImpact: 0.25, liverImpact: 0.35, typicalDurationMinHours: 0.5, typicalDurationMaxHours: 2, maxDailyDose: 100 },
  'Crack Cocaine': { drugClass: 'STIMULANT', halfLifeHours: 0.5, cognitiveImpact: 0.85, cardiovascularImpact: 0.92, gastrointestinalImpact: 0.22, liverImpact: 0.38, typicalDurationMinHours: 0.25, typicalDurationMaxHours: 1, maxDailyDose: 50 },
  Amphetamine: { drugClass: 'STIMULANT', halfLifeHours: 11, cognitiveImpact: 0.72, cardiovascularImpact: 0.65, gastrointestinalImpact: 0.25, liverImpact: 0.3, typicalDurationMinHours: 4, typicalDurationMaxHours: 8, maxDailyDose: 60 },
  Methamphetamine: { drugClass: 'STIMULANT', halfLifeHours: 10, cognitiveImpact: 0.88, cardiovascularImpact: 0.85, gastrointestinalImpact: 0.3, liverImpact: 0.45, typicalDurationMinHours: 4, typicalDurationMaxHours: 12, maxDailyDose: 50 },
  Modafinil: { drugClass: 'STIMULANT', halfLifeHours: 15, cognitiveImpact: 0.55, cardiovascularImpact: 0.35, gastrointestinalImpact: 0.18, liverImpact: 0.15, typicalDurationMinHours: 8, typicalDurationMaxHours: 14, maxDailyDose: 200 },
  Khat: { drugClass: 'STIMULANT', halfLifeHours: 3, cognitiveImpact: 0.65, cardiovascularImpact: 0.55, gastrointestinalImpact: 0.3, liverImpact: 0.2, typicalDurationMinHours: 2, typicalDurationMaxHours: 5 },
  '3-MMC': { drugClass: 'CATHINONE', halfLifeHours: 2, cognitiveImpact: 0.82, cardiovascularImpact: 0.78, gastrointestinalImpact: 0.35, liverImpact: 0.35, typicalDurationMinHours: 2, typicalDurationMaxHours: 5, maxDailyDose: 200 },
  Mephedrone: { drugClass: 'CATHINONE', halfLifeHours: 2, cognitiveImpact: 0.84, cardiovascularImpact: 0.8, gastrointestinalImpact: 0.38, liverImpact: 0.38, typicalDurationMinHours: 2, typicalDurationMaxHours: 5, maxDailyDose: 200 },
  MDPV: { drugClass: 'CATHINONE', halfLifeHours: 1.5, cognitiveImpact: 0.9, cardiovascularImpact: 0.92, gastrointestinalImpact: 0.3, liverImpact: 0.4, typicalDurationMinHours: 1, typicalDurationMaxHours: 4, maxDailyDose: 50 },
  '4-FA': { drugClass: 'STIMULANT', halfLifeHours: 4, cognitiveImpact: 0.78, cardiovascularImpact: 0.7, gastrointestinalImpact: 0.3, liverImpact: 0.3, typicalDurationMinHours: 3, typicalDurationMaxHours: 8, maxDailyDose: 150 },

  // Psychedelics
  LSD: { drugClass: 'PSYCHEDELIC', halfLifeHours: 3.5, cognitiveImpact: 0.95, cardiovascularImpact: 0.45, gastrointestinalImpact: 0.2, liverImpact: 0.15, typicalDurationMinHours: 6, typicalDurationMaxHours: 12, maxDailyDose: 200 },
  Psilocybin: { drugClass: 'PSYCHEDELIC', halfLifeHours: 2, cognitiveImpact: 0.9, cardiovascularImpact: 0.4, gastrointestinalImpact: 0.35, liverImpact: 0.15, typicalDurationMinHours: 4, typicalDurationMaxHours: 6, maxDailyDose: 5 },
  DMT: { drugClass: 'PSYCHEDELIC', halfLifeHours: 0.25, cognitiveImpact: 0.98, cardiovascularImpact: 0.5, gastrointestinalImpact: 0.15, liverImpact: 0.1, typicalDurationMinHours: 0.25, typicalDurationMaxHours: 0.5, maxDailyDose: 50 },
  '5-MeO-DMT': { drugClass: 'PSYCHEDELIC', halfLifeHours: 0.5, cognitiveImpact: 0.99, cardiovascularImpact: 0.55, gastrointestinalImpact: 0.18, liverImpact: 0.1, typicalDurationMinHours: 0.25, typicalDurationMaxHours: 1 },
  '2C-B': { drugClass: 'PSYCHEDELIC', halfLifeHours: 4, cognitiveImpact: 0.88, cardiovascularImpact: 0.5, gastrointestinalImpact: 0.3, liverImpact: 0.2, typicalDurationMinHours: 4, typicalDurationMaxHours: 8, maxDailyDose: 25 },
  Mescaline: { drugClass: 'PSYCHEDELIC', halfLifeHours: 6, cognitiveImpact: 0.88, cardiovascularImpact: 0.42, gastrointestinalImpact: 0.45, liverImpact: 0.15, typicalDurationMinHours: 8, typicalDurationMaxHours: 14 },
  Ayahuasca: { drugClass: 'PSYCHEDELIC', halfLifeHours: 2, cognitiveImpact: 0.95, cardiovascularImpact: 0.48, gastrointestinalImpact: 0.55, liverImpact: 0.2, typicalDurationMinHours: 4, typicalDurationMaxHours: 8 },
  LSA: { drugClass: 'PSYCHEDELIC', halfLifeHours: 3, cognitiveImpact: 0.82, cardiovascularImpact: 0.4, gastrointestinalImpact: 0.5, liverImpact: 0.15, typicalDurationMinHours: 6, typicalDurationMaxHours: 10 },
  Salvia: { drugClass: 'DISSOCIATIVE', halfLifeHours: 0.5, cognitiveImpact: 0.96, cardiovascularImpact: 0.35, gastrointestinalImpact: 0.1, liverImpact: 0.08, typicalDurationMinHours: 0.1, typicalDurationMaxHours: 0.5 },
  NBOMe: { drugClass: 'PSYCHEDELIC', halfLifeHours: 3, cognitiveImpact: 0.92, cardiovascularImpact: 0.65, gastrointestinalImpact: 0.25, liverImpact: 0.25, typicalDurationMinHours: 4, typicalDurationMaxHours: 10 },
  '1P-LSD': { drugClass: 'PSYCHEDELIC', halfLifeHours: 3.5, cognitiveImpact: 0.95, cardiovascularImpact: 0.45, gastrointestinalImpact: 0.2, liverImpact: 0.15, typicalDurationMinHours: 6, typicalDurationMaxHours: 12, maxDailyDose: 200 },
  '4-AcO-DMT': { drugClass: 'PSYCHEDELIC', halfLifeHours: 2, cognitiveImpact: 0.9, cardiovascularImpact: 0.4, gastrointestinalImpact: 0.35, liverImpact: 0.15, typicalDurationMinHours: 4, typicalDurationMaxHours: 6, maxDailyDose: 35 },
  '2C-I': { drugClass: 'PSYCHEDELIC', halfLifeHours: 4, cognitiveImpact: 0.88, cardiovascularImpact: 0.48, gastrointestinalImpact: 0.28, liverImpact: 0.2, typicalDurationMinHours: 6, typicalDurationMaxHours: 10, maxDailyDose: 20 },
  '2C-E': { drugClass: 'PSYCHEDELIC', halfLifeHours: 5, cognitiveImpact: 0.9, cardiovascularImpact: 0.5, gastrointestinalImpact: 0.32, liverImpact: 0.22, typicalDurationMinHours: 8, typicalDurationMaxHours: 14, maxDailyDose: 20 },
  DOM: { drugClass: 'PSYCHEDELIC', halfLifeHours: 14, cognitiveImpact: 0.92, cardiovascularImpact: 0.55, gastrointestinalImpact: 0.35, liverImpact: 0.2, typicalDurationMinHours: 12, typicalDurationMaxHours: 24, maxDailyDose: 5 },
  Ibogaine: { drugClass: 'PSYCHEDELIC', halfLifeHours: 24, cognitiveImpact: 0.95, cardiovascularImpact: 0.65, gastrointestinalImpact: 0.55, liverImpact: 0.35, typicalDurationMinHours: 12, typicalDurationMaxHours: 36, maxDailyDose: 500 },

  // Sedatives
  Ketamine: { drugClass: 'DISSOCIATIVE', halfLifeHours: 2.5, cognitiveImpact: 0.92, cardiovascularImpact: 0.55, gastrointestinalImpact: 0.35, liverImpact: 0.3, typicalDurationMinHours: 0.75, typicalDurationMaxHours: 2, maxDailyDose: 150 },
  GHB: { drugClass: 'DEPRESSANT', halfLifeHours: 1, cognitiveImpact: 0.85, cardiovascularImpact: 0.3, gastrointestinalImpact: 0.2, liverImpact: 0.25, typicalDurationMinHours: 1, typicalDurationMaxHours: 3, maxDailyDose: 3 },
  GBL: { drugClass: 'DEPRESSANT', halfLifeHours: 1, cognitiveImpact: 0.86, cardiovascularImpact: 0.32, gastrointestinalImpact: 0.22, liverImpact: 0.28, typicalDurationMinHours: 1, typicalDurationMaxHours: 3 },
  Phenibut: { drugClass: 'GABAERGIC', halfLifeHours: 5, cognitiveImpact: 0.5, cardiovascularImpact: 0.12, gastrointestinalImpact: 0.15, liverImpact: 0.12, typicalDurationMinHours: 4, typicalDurationMaxHours: 10, maxDailyDose: 2000 },
  Kava: { drugClass: 'GABAERGIC', halfLifeHours: 3, cognitiveImpact: 0.45, cardiovascularImpact: 0.1, gastrointestinalImpact: 0.12, liverImpact: 0.35, typicalDurationMinHours: 2, typicalDurationMaxHours: 6 },
  PCP: { drugClass: 'DISSOCIATIVE', halfLifeHours: 7, cognitiveImpact: 0.95, cardiovascularImpact: 0.6, gastrointestinalImpact: 0.2, liverImpact: 0.25, typicalDurationMinHours: 4, typicalDurationMaxHours: 12, maxDailyDose: 15 },
  '2-FDCK': { drugClass: 'DISSOCIATIVE', halfLifeHours: 2.5, cognitiveImpact: 0.9, cardiovascularImpact: 0.52, gastrointestinalImpact: 0.32, liverImpact: 0.28, typicalDurationMinHours: 0.75, typicalDurationMaxHours: 2, maxDailyDose: 150 },
  Baclofen: { drugClass: 'GABAERGIC', halfLifeHours: 4, cognitiveImpact: 0.5, cardiovascularImpact: 0.1, gastrointestinalImpact: 0.15, liverImpact: 0.08, typicalDurationMinHours: 4, typicalDurationMaxHours: 8 },

  // Herbals
  Kratom: { drugClass: 'OPIOID_LIKE', halfLifeHours: 3, cognitiveImpact: 0.55, cardiovascularImpact: 0.35, gastrointestinalImpact: 0.4, liverImpact: 0.35, typicalDurationMinHours: 2, typicalDurationMaxHours: 6, maxDailyDose: 8 },
  Ashwagandha: { drugClass: 'ADAPTOGEN', halfLifeHours: 6, cognitiveImpact: 0.15, cardiovascularImpact: 0.08, gastrointestinalImpact: 0.1, liverImpact: 0.08, typicalDurationMinHours: 8, typicalDurationMaxHours: 24 },
  'Valerian Root': { drugClass: 'HERBAL', halfLifeHours: 2, cognitiveImpact: 0.4, cardiovascularImpact: 0.08, gastrointestinalImpact: 0.12, liverImpact: 0.1, typicalDurationMinHours: 4, typicalDurationMaxHours: 8 },
  "St. John's Wort": { drugClass: 'HERBAL', halfLifeHours: 24, cognitiveImpact: 0.18, gastrointestinalImpact: 0.15, liverImpact: 0.2, typicalDurationMinHours: 24, typicalDurationMaxHours: 48 },
  Kanna: { drugClass: 'HERBAL', halfLifeHours: 2, cognitiveImpact: 0.35, cardiovascularImpact: 0.15, gastrointestinalImpact: 0.1, typicalDurationMinHours: 2, typicalDurationMaxHours: 4 },
  Chamomile: { drugClass: 'HERBAL', halfLifeHours: 2, cognitiveImpact: 0.25, cardiovascularImpact: 0.05, gastrointestinalImpact: 0.1, typicalDurationMinHours: 2, typicalDurationMaxHours: 6 },
  Ginseng: { drugClass: 'ADAPTOGEN', halfLifeHours: 6, cognitiveImpact: 0.2, cardiovascularImpact: 0.12, gastrointestinalImpact: 0.12, typicalDurationMinHours: 6, typicalDurationMaxHours: 12 },
  Rhodiola: { drugClass: 'ADAPTOGEN', halfLifeHours: 4, cognitiveImpact: 0.18, cardiovascularImpact: 0.08, gastrointestinalImpact: 0.08, typicalDurationMinHours: 4, typicalDurationMaxHours: 8 },
  'Lions Mane': { drugClass: 'MUSHROOM', halfLifeHours: 6, cognitiveImpact: 0.12, gastrointestinalImpact: 0.1, typicalDurationMinHours: 8, typicalDurationMaxHours: 24 },
  'Amanita Muscaria': { drugClass: 'DELIRIANT', halfLifeHours: 4, cognitiveImpact: 0.92, cardiovascularImpact: 0.35, gastrointestinalImpact: 0.45, liverImpact: 0.2, typicalDurationMinHours: 4, typicalDurationMaxHours: 10 },
  'Blue Lotus': { drugClass: 'HERBAL', halfLifeHours: 2, cognitiveImpact: 0.3, cardiovascularImpact: 0.08, gastrointestinalImpact: 0.08, typicalDurationMinHours: 2, typicalDurationMaxHours: 5 },

  // Other
  'Nitrous Oxide': { drugClass: 'DISSOCIATIVE', halfLifeHours: 0.05, cognitiveImpact: 0.9, cardiovascularImpact: 0.2, typicalDurationMinHours: 0.05, typicalDurationMaxHours: 0.25 },
  Poppers: { drugClass: 'VASODILATOR', halfLifeHours: 0.05, cognitiveImpact: 0.25, cardiovascularImpact: 0.45, typicalDurationMinHours: 0.05, typicalDurationMaxHours: 0.15 },
};

/** Fallback profile for substances without explicit pharmacology data. */
export function profileForSubstance(name: string, categorySlug: string): SubstanceProfile {
  if (SUBSTANCE_PROFILES[name]) return SUBSTANCE_PROFILES[name];

  const byCategory: Record<string, SubstanceProfile> = {
    prescription: { drugClass: 'PRESCRIPTION', cognitiveImpact: 0.25, cardiovascularImpact: 0.15, gastrointestinalImpact: 0.2, liverImpact: 0.15, typicalDurationMinHours: 6, typicalDurationMaxHours: 12 },
    otc: { drugClass: 'OTC', cognitiveImpact: 0.12, gastrointestinalImpact: 0.2, liverImpact: 0.12, typicalDurationMinHours: 4, typicalDurationMaxHours: 8 },
    vitamins: { drugClass: 'SUPPLEMENT', cognitiveImpact: 0.06, gastrointestinalImpact: 0.08, liverImpact: 0.05, typicalDurationMinHours: 8, typicalDurationMaxHours: 24 },
    alcohol: { drugClass: 'DEPRESSANT', cognitiveImpact: 0.7, cardiovascularImpact: 0.45, liverImpact: 0.6, typicalDurationMinHours: 2, typicalDurationMaxHours: 8 },
    cannabis: { drugClass: 'CANNABINOID', cognitiveImpact: 0.72, cardiovascularImpact: 0.32, typicalDurationMinHours: 2, typicalDurationMaxHours: 6 },
    nicotine: { drugClass: 'STIMULANT', cognitiveImpact: 0.44, cardiovascularImpact: 0.52, typicalDurationMinHours: 1, typicalDurationMaxHours: 2 },
    caffeine: { drugClass: 'STIMULANT', cognitiveImpact: 0.48, cardiovascularImpact: 0.38, typicalDurationMinHours: 2, typicalDurationMaxHours: 6 },
    stimulants: { drugClass: 'STIMULANT', cognitiveImpact: 0.78, cardiovascularImpact: 0.72, liverImpact: 0.3, typicalDurationMinHours: 2, typicalDurationMaxHours: 8 },
    psychedelics: { drugClass: 'PSYCHEDELIC', cognitiveImpact: 0.92, cardiovascularImpact: 0.42, typicalDurationMinHours: 4, typicalDurationMaxHours: 10 },
    sedatives: { drugClass: 'DEPRESSANT', cognitiveImpact: 0.75, cardiovascularImpact: 0.25, liverImpact: 0.2, typicalDurationMinHours: 2, typicalDurationMaxHours: 6 },
    herbals: { drugClass: 'HERBAL', cognitiveImpact: 0.2, gastrointestinalImpact: 0.15, liverImpact: 0.12, typicalDurationMinHours: 4, typicalDurationMaxHours: 12 },
    other: { drugClass: 'UNKNOWN', cognitiveImpact: 0.3, cardiovascularImpact: 0.2, typicalDurationMinHours: 2, typicalDurationMaxHours: 6 },
  };

  return byCategory[categorySlug] ?? { drugClass: 'UNKNOWN', cognitiveImpact: 0.25, typicalDurationMinHours: 4, typicalDurationMaxHours: 8 };
}

/** Ensure every seeded substance has a resolvable profile. */
export function resolveProfile(name: string, categorySlug: string): SubstanceProfile {
  return SUBSTANCE_PROFILES[name] ?? profileForSubstance(name, categorySlug);
}

export const INTERACTION_RULES = [
  { substanceA: 'Ibuprofen', substanceB: 'Alcohol', riskLevel: 'HIGH' as const, title: 'Ibuprofen + Alcohol', description: 'Combining NSAIDs with alcohol significantly increases the risk of stomach bleeding and liver stress.', advice: 'Avoid alcohol for at least 6 hours after taking ibuprofen.', source: 'FDA drug safety communication' },
  { substanceA: 'Ibuprofen', substanceB: 'Aspirin', riskLevel: 'MODERATE' as const, title: 'Ibuprofen + Aspirin', description: 'Both are NSAIDs. Combined use increases risk of gastrointestinal bleeding and ulcers.', advice: 'Do not combine without medical guidance.', source: 'Clinical pharmacology reference' },
  { substanceA: 'Naproxen', substanceB: 'Alcohol', riskLevel: 'HIGH' as const, title: 'Naproxen + Alcohol', description: 'NSAID and alcohol combination increases GI bleeding and liver stress.', advice: 'Avoid alcohol while taking naproxen.', source: 'FDA' },
  { substanceA: 'Magnesium', substanceB: 'Amoxicillin', riskLevel: 'LOW' as const, title: 'Magnesium + Antibiotic', description: 'Magnesium and other minerals may reduce absorption of certain antibiotics.', advice: 'Take them at least 2 hours apart.', source: 'Drug interaction database' },
  { substanceAClass: 'NSAID', substanceB: 'Alcohol', riskLevel: 'HIGH' as const, title: 'NSAID + Alcohol', description: 'NSAIDs combined with alcohol elevate GI bleeding risk and may stress the liver.', advice: 'Limit or avoid alcohol while taking NSAIDs.', source: 'FDA' },
  { substanceA: 'Coffee', substanceB: 'Alcohol', riskLevel: 'LOW' as const, title: 'Caffeine + Alcohol', description: 'Caffeine may mask depressant effects of alcohol, increasing risk of overconsumption.', advice: 'Avoid mixing caffeine with alcohol when possible.', source: 'CDC' },
  { substanceA: 'Energy Drink', substanceB: 'Alcohol', riskLevel: 'MODERATE' as const, title: 'Energy Drink + Alcohol', description: 'High caffeine masks alcohol impairment, increasing injury and cardiac strain risk.', advice: 'Do not mix energy drinks with alcohol.', source: 'CDC' },
  { substanceA: 'Cannabis', substanceB: 'Alcohol', riskLevel: 'HIGH' as const, title: 'Cannabis + Alcohol', description: 'Combined use significantly increases impairment, nausea, and cardiovascular strain.', advice: 'Do not combine. Effects are unpredictable and amplified.', source: 'Clinical toxicology reference' },
  { substanceA: 'Paracetamol', substanceB: 'Alcohol', riskLevel: 'HIGH' as const, title: 'Paracetamol + Alcohol', description: 'Alcohol increases hepatotoxicity risk when combined with paracetamol (acetaminophen).', advice: 'Avoid alcohol for 24 hours when taking paracetamol.', source: 'FDA liver toxicity warning' },
  { substanceA: 'MDMA', substanceB: 'Cocaine', riskLevel: 'HIGH' as const, title: 'MDMA + Cocaine', description: 'Combining empathogens with cocaine creates severe cardiovascular strain and unpredictable neurotoxic stress.', advice: 'Do not combine. Seek medical help if chest pain, overheating, or confusion occurs.', source: 'Clinical toxicology reference' },
  { substanceA: 'MDMA', substanceB: 'Alcohol', riskLevel: 'HIGH' as const, title: 'MDMA + Alcohol', description: 'Alcohol masks MDMA effects, increases dehydration, and raises risk of overheating and impaired judgment.', advice: 'Avoid combining. Hydrate and avoid further substances if already mixed.', source: 'Harm reduction pharmacology reference' },
  { substanceA: 'MDMA', substanceB: 'Sertraline', riskLevel: 'HIGH' as const, title: 'MDMA + SSRI', description: 'Serotonergic stacking with SSRIs increases serotonin syndrome risk — agitation, fever, muscle rigidity.', advice: 'Do not combine MDMA with antidepressants.', source: 'Clinical pharmacology reference' },
  { substanceA: 'MDMA', substanceB: 'Amphetamine', riskLevel: 'HIGH' as const, title: 'MDMA + Amphetamine', description: 'Stacking stimulants increases heart rate, blood pressure, overheating, and serotonin-related toxicity risk.', advice: 'Do not combine stimulants.', source: 'Clinical pharmacology reference' },
  { substanceA: 'Cocaine', substanceB: 'Alcohol', riskLevel: 'HIGH' as const, title: 'Cocaine + Alcohol', description: 'This combination forms cocaethylene in the body, increasing cardiac toxicity and sudden death risk.', advice: 'Do not combine.', source: 'Clinical toxicology reference' },
  { substanceA: 'Ketamine', substanceB: 'Alcohol', riskLevel: 'HIGH' as const, title: 'Ketamine + Alcohol', description: 'Both depress respiration and coordination. Combined use increases blackout and injury risk.', advice: 'Do not combine CNS depressants.', source: 'Anesthesia and toxicology reference' },
  { substanceA: 'GHB', substanceB: 'Alcohol', riskLevel: 'HIGH' as const, title: 'GHB + Alcohol', description: 'Combined CNS depression can cause respiratory failure and loss of consciousness.', advice: 'Never combine GHB with alcohol or other depressants.', source: 'Clinical toxicology reference' },
  { substanceA: 'LSD', substanceB: 'Cannabis', riskLevel: 'MODERATE' as const, title: 'LSD + Cannabis', description: 'Cannabis can intensify psychedelic effects unpredictably and may increase anxiety or dissociation.', advice: 'Avoid mixing if prone to anxiety.', source: 'Psychedelic interaction literature' },
  { substanceA: 'LSD', substanceB: 'Lithium', riskLevel: 'HIGH' as const, title: 'LSD + Lithium (class caution)', description: 'Psychedelics with mood stabilizers may increase seizure and psychosis risk.', advice: 'Avoid psychedelics if on lithium or similar agents.', source: 'Psychopharmacology reference' },
  { substanceA: 'Ketamine', substanceB: 'Cocaine', riskLevel: 'HIGH' as const, title: 'Ketamine + Cocaine', description: 'Dissociatives with stimulants create conflicting CNS effects and elevated cardiovascular stress.', advice: 'Do not combine.', source: 'Clinical toxicology reference' },
  { substanceAClass: 'STIMULANT', substanceB: 'Alcohol', riskLevel: 'HIGH' as const, title: 'Stimulant + Alcohol', description: 'Stimulants can mask alcohol sedation, increasing risk of overconsumption and cardiovascular strain.', advice: 'Avoid mixing stimulants with alcohol.', source: 'CDC / toxicology reference' },
  { substanceA: 'Oxycodone', substanceB: 'Alcohol', riskLevel: 'HIGH' as const, title: 'Opioid + Alcohol', description: 'Combined respiratory depression is a leading cause of overdose death.', advice: 'Never combine opioids with alcohol or sedatives.', source: 'CDC overdose prevention' },
  { substanceA: 'Oxycodone', substanceB: 'Alprazolam', riskLevel: 'HIGH' as const, title: 'Opioid + Benzodiazepine', description: 'Opioids and benzodiazepines synergistically suppress breathing — high overdose risk.', advice: 'Do not combine without direct medical supervision.', source: 'FDA black box warning' },
  { substanceA: 'Tramadol', substanceB: 'Sertraline', riskLevel: 'HIGH' as const, title: 'Tramadol + SSRI', description: 'Both increase serotonin activity — seizure and serotonin syndrome risk.', advice: 'Avoid combining without medical oversight.', source: 'Clinical pharmacology reference' },
  { substanceA: 'Dextromethorphan', substanceB: 'Sertraline', riskLevel: 'HIGH' as const, title: 'DXM + SSRI', description: 'DXM is serotonergic at high doses — SSRI co-use increases serotonin syndrome risk.', advice: 'Do not recreational-use DXM while on SSRIs.', source: 'Clinical pharmacology reference' },
  { substanceA: 'Kratom', substanceB: 'Oxycodone', riskLevel: 'HIGH' as const, title: 'Kratom + Opioid', description: 'Both act on opioid pathways — respiratory depression and dependence risk increase.', advice: 'Do not combine opioid-like substances.', source: 'Clinical toxicology reference' },
  { substanceA: "St. John's Wort", substanceB: 'Sertraline', riskLevel: 'MODERATE' as const, title: "St. John's Wort + SSRI", description: 'Herb may add serotonergic activity and alter drug metabolism.', advice: 'Avoid combining with prescription antidepressants.', source: 'Drug interaction database' },
  { substanceA: 'Phenibut', substanceB: 'Alcohol', riskLevel: 'HIGH' as const, title: 'Phenibut + Alcohol', description: 'Both are GABAergic — combined use increases sedation, blackout, and dependence risk.', advice: 'Do not combine.', source: 'Clinical pharmacology reference' },
  { substanceA: 'Zolpidem', substanceB: 'Alcohol', riskLevel: 'HIGH' as const, title: 'Zolpidem + Alcohol', description: 'Sedative-hypnotics with alcohol cause severe CNS depression and amnesia.', advice: 'Never combine sleep aids with alcohol.', source: 'FDA' },
  { substanceAClass: 'BENZODIAZEPINE', substanceB: 'Alcohol', riskLevel: 'HIGH' as const, title: 'Benzodiazepine + Alcohol', description: 'Combined CNS depression increases overdose, injury, and memory blackout risk.', advice: 'Do not drink alcohol while taking benzodiazepines.', source: 'FDA' },
  { substanceAClass: 'OPIOID', substanceB: 'Alcohol', riskLevel: 'HIGH' as const, title: 'Opioid + Alcohol', description: 'Respiratory depression risk is significantly elevated when opioids are mixed with alcohol.', advice: 'Never combine.', source: 'CDC' },
  { substanceA: '5-HTP', substanceB: 'Sertraline', riskLevel: 'HIGH' as const, title: '5-HTP + SSRI', description: 'Serotonin precursor combined with SSRIs increases serotonin syndrome risk.', advice: 'Do not combine 5-HTP with antidepressants.', source: 'Clinical pharmacology reference' },
  { substanceA: 'Ayahuasca', substanceB: 'Sertraline', riskLevel: 'HIGH' as const, title: 'Ayahuasca + SSRI', description: 'Ayahuasca contains MAO inhibitors. Combining with SSRIs can cause serotonin syndrome.', advice: 'Avoid ayahuasca if taking antidepressants. Allow weeks washout.', source: 'Psychopharmacology reference' },
  { substanceA: 'Fentanyl', substanceB: 'Alcohol', riskLevel: 'HIGH' as const, title: 'Fentanyl + Alcohol', description: 'Extremely potent opioid combined with alcohol causes rapid respiratory depression.', advice: 'Never combine. Have naloxone available if opioid use occurs.', source: 'CDC overdose prevention' },
  { substanceA: 'Heroin', substanceB: 'Alprazolam', riskLevel: 'HIGH' as const, title: 'Heroin + Benzodiazepine', description: 'Opioids and benzodiazepines synergistically suppress breathing — leading overdose combination.', advice: 'Do not combine. Seek emergency help for overdose signs.', source: 'CDC' },
  { substanceA: 'Ibogaine', substanceB: 'Oxycodone', riskLevel: 'HIGH' as const, title: 'Ibogaine + Opioid', description: 'Ibogaine can prolong QT interval and interact dangerously with opioids still in the system.', advice: 'Requires medical supervision and full opioid washout before ibogaine.', source: 'Clinical toxicology reference' },
  { substanceA: 'PCP', substanceB: 'Alcohol', riskLevel: 'HIGH' as const, title: 'PCP + Alcohol', description: 'Dissociative and alcohol combine unpredictably — violence, psychosis, and injury risk increase.', advice: 'Do not combine.', source: 'Clinical toxicology reference' },
  { substanceA: 'Pseudoephedrine', substanceB: 'Amphetamine', riskLevel: 'HIGH' as const, title: 'Pseudoephedrine + Stimulant', description: 'Stacking sympathomimetic agents raises blood pressure and heart rate dangerously.', advice: 'Avoid combining decongestants with stimulants.', source: 'Clinical pharmacology reference' },
  { substanceA: 'MDMA', substanceB: 'Mephedrone', riskLevel: 'HIGH' as const, title: 'MDMA + Cathinone', description: 'Stacking empathogens and cathinones increases serotonin toxicity and cardiovascular strain.', advice: 'Do not combine.', source: 'Clinical toxicology reference' },
  { substanceA: 'Sildenafil', substanceB: 'Alcohol', riskLevel: 'MODERATE' as const, title: 'Sildenafil + Alcohol', description: 'Both lower blood pressure — combined use may cause dizziness, fainting, or cardiovascular events.', advice: 'Limit alcohol when using PDE5 inhibitors.', source: 'FDA' },
  { substanceA: 'Lithium', substanceB: 'Ibuprofen', riskLevel: 'MODERATE' as const, title: 'Lithium + NSAID', description: 'NSAIDs can reduce lithium clearance and raise serum levels — toxicity risk.', advice: 'Avoid NSAIDs or monitor lithium levels closely with medical guidance.', source: 'Clinical pharmacology reference' },
  { substanceA: 'Poppers', substanceB: 'Sildenafil', riskLevel: 'HIGH' as const, title: 'Poppers + PDE5 Inhibitor', description: 'Both cause vasodilation — combined use can cause severe hypotension and loss of consciousness.', advice: 'Never combine poppers with Viagra or similar medications.', source: 'Clinical toxicology reference' },
  { substanceA: '1P-LSD', substanceB: 'Cannabis', riskLevel: 'MODERATE' as const, title: 'LSD Analog + Cannabis', description: 'Cannabis can intensify psychedelic effects unpredictably.', advice: 'Avoid mixing if prone to anxiety.', source: 'Psychedelic interaction literature' },
  { substanceA: 'Doxylamine', substanceB: 'Alcohol', riskLevel: 'HIGH' as const, title: 'Sedating Antihistamine + Alcohol', description: 'Combined CNS depression increases sedation, falls, and respiratory risk.', advice: 'Do not drink alcohol with sedating antihistamines.', source: 'FDA' },
  { substanceA: 'Bupropion', substanceB: 'MDMA', riskLevel: 'HIGH' as const, title: 'Bupropion + MDMA', description: 'Bupropion lowers seizure threshold and MDMA is serotonergic — seizure and toxicity risk.', advice: 'Do not combine.', source: 'Clinical pharmacology reference' },
];

/** Validate seed catalog matches profile coverage expectations. */
export function assertCatalogIntegrity(): void {
  for (const s of SEED_SUBSTANCES) {
    resolveProfile(s.name, s.categorySlug);
  }
}

assertCatalogIntegrity();
