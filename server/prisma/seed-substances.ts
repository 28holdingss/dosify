export type SeedSubstance = {
  name: string;
  description: string;
  categorySlug: string;
  defaultUnit: string;
  minDose: number;
  maxDose: number;
  isPopular: boolean;
};

/** Harm-reduction oriented catalog — doses are typical logged ranges, not medical advice. */
export const SEED_SUBSTANCES: SeedSubstance[] = [
  // Prescription
  { name: 'Amoxicillin', description: 'Penicillin antibiotic', categorySlug: 'prescription', defaultUnit: 'mg', minDose: 250, maxDose: 1000, isPopular: true },
  { name: 'Sertraline', description: 'Zoloft — SSRI antidepressant', categorySlug: 'prescription', defaultUnit: 'mg', minDose: 25, maxDose: 200, isPopular: true },
  { name: 'Fluoxetine', description: 'Prozac — SSRI antidepressant', categorySlug: 'prescription', defaultUnit: 'mg', minDose: 10, maxDose: 80, isPopular: false },
  { name: 'Escitalopram', description: 'Lexapro — SSRI antidepressant', categorySlug: 'prescription', defaultUnit: 'mg', minDose: 5, maxDose: 20, isPopular: false },
  { name: 'Lorazepam', description: 'Ativan — benzodiazepine anxiolytic', categorySlug: 'prescription', defaultUnit: 'mg', minDose: 0.25, maxDose: 2, isPopular: true },
  { name: 'Alprazolam', description: 'Xanax — benzodiazepine anxiolytic', categorySlug: 'prescription', defaultUnit: 'mg', minDose: 0.25, maxDose: 2, isPopular: true },
  { name: 'Clonazepam', description: 'Klonopin — benzodiazepine', categorySlug: 'prescription', defaultUnit: 'mg', minDose: 0.25, maxDose: 2, isPopular: false },
  { name: 'Oxycodone', description: 'OxyContin / Percocet — opioid analgesic', categorySlug: 'prescription', defaultUnit: 'mg', minDose: 2.5, maxDose: 30, isPopular: true },
  { name: 'Hydrocodone', description: 'Vicodin / Norco — opioid analgesic', categorySlug: 'prescription', defaultUnit: 'mg', minDose: 2.5, maxDose: 20, isPopular: false },
  { name: 'Tramadol', description: 'Ultram — opioid-like analgesic', categorySlug: 'prescription', defaultUnit: 'mg', minDose: 25, maxDose: 100, isPopular: false },
  { name: 'Gabapentin', description: 'Neurontin — anticonvulsant / nerve pain', categorySlug: 'prescription', defaultUnit: 'mg', minDose: 100, maxDose: 600, isPopular: false },
  { name: 'Pregabalin', description: 'Lyrica — anticonvulsant / nerve pain', categorySlug: 'prescription', defaultUnit: 'mg', minDose: 25, maxDose: 300, isPopular: false },
  { name: 'Methadone', description: 'Opioid maintenance / pain medication', categorySlug: 'prescription', defaultUnit: 'mg', minDose: 5, maxDose: 40, isPopular: false },
  { name: 'Buprenorphine', description: 'Suboxone / Subutex — partial opioid agonist', categorySlug: 'prescription', defaultUnit: 'mg', minDose: 2, maxDose: 16, isPopular: false },
  { name: 'Zolpidem', description: 'Ambien — sedative-hypnotic sleep aid', categorySlug: 'prescription', defaultUnit: 'mg', minDose: 2.5, maxDose: 10, isPopular: true },
  { name: 'Metformin', description: 'Type 2 diabetes medication', categorySlug: 'prescription', defaultUnit: 'mg', minDose: 250, maxDose: 1000, isPopular: false },
  { name: 'Prednisone', description: 'Corticosteroid anti-inflammatory', categorySlug: 'prescription', defaultUnit: 'mg', minDose: 5, maxDose: 60, isPopular: false },
  { name: 'Methylphenidate', description: 'Ritalin / Concerta — ADHD stimulant', categorySlug: 'prescription', defaultUnit: 'mg', minDose: 5, maxDose: 60, isPopular: true },
  { name: 'Lisdexamfetamine', description: 'Vyvanse — long-acting amphetamine prodrug', categorySlug: 'prescription', defaultUnit: 'mg', minDose: 10, maxDose: 70, isPopular: true },
  { name: 'Citalopram', description: 'Celexa — SSRI antidepressant', categorySlug: 'prescription', defaultUnit: 'mg', minDose: 10, maxDose: 40, isPopular: false },
  { name: 'Venlafaxine', description: 'Effexor — SNRI antidepressant', categorySlug: 'prescription', defaultUnit: 'mg', minDose: 37.5, maxDose: 225, isPopular: false },
  { name: 'Bupropion', description: 'Wellbutrin — NDRI antidepressant / smoking cessation', categorySlug: 'prescription', defaultUnit: 'mg', minDose: 75, maxDose: 450, isPopular: true },
  { name: 'Mirtazapine', description: 'Remeron — sedating antidepressant', categorySlug: 'prescription', defaultUnit: 'mg', minDose: 7.5, maxDose: 45, isPopular: false },
  { name: 'Trazodone', description: 'Desyrel — antidepressant used for sleep', categorySlug: 'prescription', defaultUnit: 'mg', minDose: 25, maxDose: 150, isPopular: true },
  { name: 'Diazepam', description: 'Valium — long-acting benzodiazepine', categorySlug: 'prescription', defaultUnit: 'mg', minDose: 2, maxDose: 10, isPopular: false },
  { name: 'Codeine', description: 'Weak opioid cough suppressant / analgesic', categorySlug: 'prescription', defaultUnit: 'mg', minDose: 15, maxDose: 60, isPopular: false },
  { name: 'Morphine', description: 'Strong opioid analgesic', categorySlug: 'prescription', defaultUnit: 'mg', minDose: 5, maxDose: 30, isPopular: false },
  { name: 'Fentanyl', description: 'Potent synthetic opioid — patch or illicit', categorySlug: 'prescription', defaultUnit: 'mcg', minDose: 25, maxDose: 100, isPopular: false },
  { name: 'Quetiapine', description: 'Seroquel — antipsychotic / sleep aid', categorySlug: 'prescription', defaultUnit: 'mg', minDose: 25, maxDose: 300, isPopular: false },
  { name: 'Lithium', description: 'Mood stabilizer for bipolar disorder', categorySlug: 'prescription', defaultUnit: 'mg', minDose: 150, maxDose: 1200, isPopular: false },
  { name: 'Atorvastatin', description: 'Lipitor — cholesterol-lowering statin', categorySlug: 'prescription', defaultUnit: 'mg', minDose: 10, maxDose: 80, isPopular: false },
  { name: 'Levothyroxine', description: 'Synthroid — thyroid hormone replacement', categorySlug: 'prescription', defaultUnit: 'mcg', minDose: 25, maxDose: 200, isPopular: false },
  { name: 'Lisinopril', description: 'ACE inhibitor — blood pressure medication', categorySlug: 'prescription', defaultUnit: 'mg', minDose: 2.5, maxDose: 40, isPopular: false },
  { name: 'Cyclobenzaprine', description: 'Flexeril — muscle relaxant', categorySlug: 'prescription', defaultUnit: 'mg', minDose: 5, maxDose: 10, isPopular: false },
  { name: 'Sumatriptan', description: 'Imitrex — migraine abortive triptan', categorySlug: 'prescription', defaultUnit: 'mg', minDose: 25, maxDose: 100, isPopular: false },
  { name: 'Doxycycline', description: 'Tetracycline antibiotic', categorySlug: 'prescription', defaultUnit: 'mg', minDose: 50, maxDose: 200, isPopular: false },
  { name: 'Sildenafil', description: 'Viagra — PDE5 inhibitor for ED', categorySlug: 'prescription', defaultUnit: 'mg', minDose: 25, maxDose: 100, isPopular: false },
  { name: 'Birth Control Pill', description: 'Combined oral contraceptive — estrogen/progestin', categorySlug: 'prescription', defaultUnit: 'pill', minDose: 1, maxDose: 1, isPopular: true },

  // OTC
  { name: 'Paracetamol', description: 'Acetaminophen / Tylenol — pain & fever', categorySlug: 'otc', defaultUnit: 'mg', minDose: 250, maxDose: 1000, isPopular: true },
  { name: 'Ibuprofen', description: 'Advil / Motrin — NSAID anti-inflammatory', categorySlug: 'otc', defaultUnit: 'mg', minDose: 50, maxDose: 800, isPopular: true },
  { name: 'Aspirin', description: 'Acetylsalicylic acid — pain & blood thinner', categorySlug: 'otc', defaultUnit: 'mg', minDose: 75, maxDose: 500, isPopular: false },
  { name: 'Naproxen', description: 'Aleve — long-acting NSAID', categorySlug: 'otc', defaultUnit: 'mg', minDose: 110, maxDose: 440, isPopular: false },
  { name: 'Diphenhydramine', description: 'Benadryl — antihistamine / sleep aid', categorySlug: 'otc', defaultUnit: 'mg', minDose: 12.5, maxDose: 50, isPopular: true },
  { name: 'Loratadine', description: 'Claritin — non-drowsy antihistamine', categorySlug: 'otc', defaultUnit: 'mg', minDose: 5, maxDose: 10, isPopular: false },
  { name: 'Omeprazole', description: 'Prilosec — proton pump inhibitor', categorySlug: 'otc', defaultUnit: 'mg', minDose: 10, maxDose: 40, isPopular: false },
  { name: 'Dextromethorphan', description: 'DXM — cough suppressant (dissociative at high dose)', categorySlug: 'otc', defaultUnit: 'mg', minDose: 7.5, maxDose: 60, isPopular: true },
  { name: 'Loperamide', description: 'Imodium — anti-diarrheal (opioid at high dose)', categorySlug: 'otc', defaultUnit: 'mg', minDose: 2, maxDose: 8, isPopular: false },
  { name: 'Pseudoephedrine', description: 'Sudafed — nasal decongestant stimulant', categorySlug: 'otc', defaultUnit: 'mg', minDose: 15, maxDose: 60, isPopular: true },
  { name: 'Cetirizine', description: 'Zyrtec — non-drowsy antihistamine', categorySlug: 'otc', defaultUnit: 'mg', minDose: 5, maxDose: 10, isPopular: false },
  { name: 'Doxylamine', description: 'Unisom — sedating antihistamine sleep aid', categorySlug: 'otc', defaultUnit: 'mg', minDose: 12.5, maxDose: 50, isPopular: false },
  { name: 'Guaifenesin', description: 'Mucinex — expectorant for chest congestion', categorySlug: 'otc', defaultUnit: 'mg', minDose: 200, maxDose: 1200, isPopular: false },
  { name: 'Phenylephrine', description: 'Sudafed PE — weaker decongestant', categorySlug: 'otc', defaultUnit: 'mg', minDose: 5, maxDose: 10, isPopular: false },

  // Vitamins & supplements
  { name: 'Vitamin D3', description: 'Cholecalciferol — bone & immune support', categorySlug: 'vitamins', defaultUnit: 'IU', minDose: 400, maxDose: 5000, isPopular: true },
  { name: 'Vitamin C', description: 'Ascorbic acid — immune support', categorySlug: 'vitamins', defaultUnit: 'mg', minDose: 250, maxDose: 2000, isPopular: true },
  { name: 'Vitamin B12', description: 'Cobalamin — energy & nerve support', categorySlug: 'vitamins', defaultUnit: 'mcg', minDose: 250, maxDose: 2500, isPopular: false },
  { name: 'Magnesium', description: 'Mineral — muscle & sleep support', categorySlug: 'vitamins', defaultUnit: 'mg', minDose: 100, maxDose: 600, isPopular: true },
  { name: 'Iron', description: 'Ferrous supplement — anemia support', categorySlug: 'vitamins', defaultUnit: 'mg', minDose: 18, maxDose: 65, isPopular: false },
  { name: 'Zinc', description: 'Mineral — immune & skin support', categorySlug: 'vitamins', defaultUnit: 'mg', minDose: 5, maxDose: 40, isPopular: false },
  { name: 'Omega 3', description: 'Fish oil — EPA/DHA fatty acids', categorySlug: 'vitamins', defaultUnit: 'mg', minDose: 250, maxDose: 2000, isPopular: false },
  { name: 'Creatine', description: 'Performance & muscle supplement', categorySlug: 'vitamins', defaultUnit: 'g', minDose: 2, maxDose: 10, isPopular: true },
  { name: 'Melatonin', description: 'Sleep hormone supplement', categorySlug: 'vitamins', defaultUnit: 'mg', minDose: 0.5, maxDose: 10, isPopular: true },
  { name: 'Electrolytes', description: 'Hydration salts — sodium, potassium, magnesium', categorySlug: 'vitamins', defaultUnit: 'serving', minDose: 0.5, maxDose: 3, isPopular: false },
  { name: 'L-Theanine', description: 'Green tea amino acid — calm focus', categorySlug: 'vitamins', defaultUnit: 'mg', minDose: 100, maxDose: 400, isPopular: true },
  { name: 'Vitamin B Complex', description: 'B1–B12 blend — energy & nerve support', categorySlug: 'vitamins', defaultUnit: 'mg', minDose: 1, maxDose: 2, isPopular: false },
  { name: 'Probiotics', description: 'Live cultures — gut microbiome support', categorySlug: 'vitamins', defaultUnit: 'CFU', minDose: 1, maxDose: 50, isPopular: false },
  { name: 'CoQ10', description: 'Coenzyme Q10 — cellular energy & heart support', categorySlug: 'vitamins', defaultUnit: 'mg', minDose: 50, maxDose: 300, isPopular: false },
  { name: '5-HTP', description: 'Serotonin precursor supplement', categorySlug: 'vitamins', defaultUnit: 'mg', minDose: 50, maxDose: 300, isPopular: false },
  { name: 'Turmeric', description: 'Curcumin — anti-inflammatory herb', categorySlug: 'vitamins', defaultUnit: 'mg', minDose: 250, maxDose: 1500, isPopular: false },
  { name: 'Biotin', description: 'Vitamin B7 — hair, skin & nail support', categorySlug: 'vitamins', defaultUnit: 'mcg', minDose: 1000, maxDose: 10000, isPopular: false },
  { name: 'Calcium', description: 'Mineral — bone health supplement', categorySlug: 'vitamins', defaultUnit: 'mg', minDose: 200, maxDose: 1200, isPopular: false },

  // Alcohol
  { name: 'Alcohol', description: 'Ethanol — beer, wine, spirits', categorySlug: 'alcohol', defaultUnit: 'units', minDose: 0.5, maxDose: 10, isPopular: true },
  { name: 'Beer', description: 'Standard beer — ~5% ABV', categorySlug: 'alcohol', defaultUnit: 'drinks', minDose: 0.5, maxDose: 8, isPopular: true },
  { name: 'Wine', description: 'Red / white wine — ~12% ABV', categorySlug: 'alcohol', defaultUnit: 'glasses', minDose: 0.5, maxDose: 6, isPopular: false },
  { name: 'Spirits', description: 'Vodka, whiskey, rum — ~40% ABV', categorySlug: 'alcohol', defaultUnit: 'shots', minDose: 0.5, maxDose: 6, isPopular: false },

  // Cannabis
  { name: 'Cannabis', description: 'Marijuana / weed — THC & CBD flower', categorySlug: 'cannabis', defaultUnit: 'mg', minDose: 1, maxDose: 100, isPopular: true },
  { name: 'THC Edible', description: 'Gummies / brownies — delayed onset THC', categorySlug: 'cannabis', defaultUnit: 'mg', minDose: 2.5, maxDose: 50, isPopular: true },
  { name: 'CBD Oil', description: 'Cannabidiol — non-intoxicating extract', categorySlug: 'cannabis', defaultUnit: 'mg', minDose: 5, maxDose: 100, isPopular: true },
  { name: 'Delta-8 THC', description: 'Hemp-derived psychoactive cannabinoid', categorySlug: 'cannabis', defaultUnit: 'mg', minDose: 5, maxDose: 50, isPopular: false },
  { name: 'HHC', description: 'Hexahydrocannabinol — hemp-derived cannabinoid', categorySlug: 'cannabis', defaultUnit: 'mg', minDose: 5, maxDose: 50, isPopular: false },
  { name: 'THCA Flower', description: 'Raw cannabis — THCA converts to THC when heated', categorySlug: 'cannabis', defaultUnit: 'mg', minDose: 5, maxDose: 100, isPopular: false },
  { name: 'Cannabis Concentrate', description: 'Dabs / wax / shatter — high-potency extract', categorySlug: 'cannabis', defaultUnit: 'mg', minDose: 5, maxDose: 100, isPopular: true },
  { name: 'Cannabis Vape', description: 'THC vape cartridge / disposable pen', categorySlug: 'cannabis', defaultUnit: 'puffs', minDose: 1, maxDose: 20, isPopular: true },

  // Nicotine
  { name: 'Nicotine', description: 'Cigarettes / vape / tobacco', categorySlug: 'nicotine', defaultUnit: 'mg', minDose: 1, maxDose: 24, isPopular: true },
  { name: 'Nicotine Pouch', description: 'Zyn / snus — oral nicotine pouch', categorySlug: 'nicotine', defaultUnit: 'mg', minDose: 2, maxDose: 8, isPopular: true },
  { name: 'Nicotine Patch', description: 'Transdermal nicotine — smoking cessation', categorySlug: 'nicotine', defaultUnit: 'mg', minDose: 7, maxDose: 21, isPopular: false },
  { name: 'Nicotine Gum', description: 'Chewing gum nicotine replacement', categorySlug: 'nicotine', defaultUnit: 'mg', minDose: 2, maxDose: 4, isPopular: false },

  // Caffeine
  { name: 'Coffee', description: 'Brewed coffee — ~95mg caffeine per cup', categorySlug: 'caffeine', defaultUnit: 'cup', minDose: 0.5, maxDose: 5, isPopular: true },
  { name: 'Tea', description: 'Black / green tea — caffeine & L-theanine', categorySlug: 'caffeine', defaultUnit: 'cup', minDose: 0.5, maxDose: 6, isPopular: false },
  { name: 'Energy Drink', description: 'Red Bull / Monster — high caffeine', categorySlug: 'caffeine', defaultUnit: 'can', minDose: 0.5, maxDose: 3, isPopular: true },
  { name: 'Caffeine Pill', description: 'Caffeine tablets — 100–200mg', categorySlug: 'caffeine', defaultUnit: 'mg', minDose: 50, maxDose: 400, isPopular: false },
  { name: 'Pre-Workout', description: 'Caffeine + beta-alanine supplement blend', categorySlug: 'caffeine', defaultUnit: 'scoop', minDose: 0.5, maxDose: 2, isPopular: false },
  { name: 'Matcha', description: 'Powdered green tea — caffeine + L-theanine', categorySlug: 'caffeine', defaultUnit: 'g', minDose: 1, maxDose: 4, isPopular: true },
  { name: 'Yerba Mate', description: 'South American tea — caffeine + theobromine', categorySlug: 'caffeine', defaultUnit: 'g', minDose: 2, maxDose: 12, isPopular: false },

  // Stimulants (illicit & recreational)
  { name: 'MDMA', description: 'Ecstasy / Molly / E — empathogenic stimulant', categorySlug: 'stimulants', defaultUnit: 'mg', minDose: 50, maxDose: 150, isPopular: true },
  { name: 'Cocaine', description: 'Blow / coke — short-acting stimulant', categorySlug: 'stimulants', defaultUnit: 'mg', minDose: 10, maxDose: 100, isPopular: true },
  { name: 'Crack Cocaine', description: 'Smoked cocaine base — rapid onset', categorySlug: 'stimulants', defaultUnit: 'mg', minDose: 5, maxDose: 50, isPopular: false },
  { name: 'Amphetamine', description: 'Adderall / speed — prescription stimulant', categorySlug: 'stimulants', defaultUnit: 'mg', minDose: 5, maxDose: 60, isPopular: true },
  { name: 'Methamphetamine', description: 'Meth / crystal / ice — potent stimulant', categorySlug: 'stimulants', defaultUnit: 'mg', minDose: 5, maxDose: 50, isPopular: false },
  { name: 'Modafinil', description: 'Provigil — wakefulness agent / nootropic', categorySlug: 'stimulants', defaultUnit: 'mg', minDose: 50, maxDose: 200, isPopular: true },
  { name: 'Khat', description: 'Cathinone plant — East African stimulant', categorySlug: 'stimulants', defaultUnit: 'g', minDose: 25, maxDose: 200, isPopular: false },
  { name: '3-MMC', description: 'Meow Meow — synthetic cathinone stimulant', categorySlug: 'stimulants', defaultUnit: 'mg', minDose: 50, maxDose: 200, isPopular: false },
  { name: 'Mephedrone', description: '4-MMC — empathogenic cathinone', categorySlug: 'stimulants', defaultUnit: 'mg', minDose: 50, maxDose: 200, isPopular: false },
  { name: 'MDPV', description: 'Bath salts — potent stimulant cathinone', categorySlug: 'stimulants', defaultUnit: 'mg', minDose: 5, maxDose: 50, isPopular: false },
  { name: '4-FA', description: '4-Fluoroamphetamine — empathogenic stimulant', categorySlug: 'stimulants', defaultUnit: 'mg', minDose: 50, maxDose: 150, isPopular: false },
  { name: 'Heroin', description: 'Diacetylmorphine — illicit opioid', categorySlug: 'prescription', defaultUnit: 'mg', minDose: 5, maxDose: 50, isPopular: false },

  // Psychedelics
  { name: 'LSD', description: 'Acid — lysergic acid diethylamide', categorySlug: 'psychedelics', defaultUnit: 'mcg', minDose: 25, maxDose: 200, isPopular: true },
  { name: 'Psilocybin', description: 'Shrooms / magic mushrooms', categorySlug: 'psychedelics', defaultUnit: 'g', minDose: 0.5, maxDose: 5, isPopular: true },
  { name: 'DMT', description: 'N,N-DMT — short intense psychedelic', categorySlug: 'psychedelics', defaultUnit: 'mg', minDose: 10, maxDose: 50, isPopular: false },
  { name: '5-MeO-DMT', description: 'Toad venom / synthetic — intense psychedelic', categorySlug: 'psychedelics', defaultUnit: 'mg', minDose: 2, maxDose: 15, isPopular: false },
  { name: '2C-B', description: 'Nexus — psychedelic phenethylamine', categorySlug: 'psychedelics', defaultUnit: 'mg', minDose: 5, maxDose: 25, isPopular: false },
  { name: 'Mescaline', description: 'Peyote / San Pedro cactus alkaloid', categorySlug: 'psychedelics', defaultUnit: 'mg', minDose: 100, maxDose: 500, isPopular: false },
  { name: 'Ayahuasca', description: 'DMT + MAOI brew — ceremonial psychedelic', categorySlug: 'psychedelics', defaultUnit: 'ml', minDose: 30, maxDose: 150, isPopular: false },
  { name: 'LSA', description: 'Morning glory / Hawaiian baby woodrose seeds', categorySlug: 'psychedelics', defaultUnit: 'seeds', minDose: 50, maxDose: 300, isPopular: false },
  { name: 'Salvia', description: 'Salvia divinorum — short dissociative psychedelic', categorySlug: 'psychedelics', defaultUnit: 'mg', minDose: 5, maxDose: 40, isPopular: false },
  { name: 'NBOMe', description: '25I-NBOMe / N-Bomb — potent phenethylamine', categorySlug: 'psychedelics', defaultUnit: 'mcg', minDose: 200, maxDose: 1000, isPopular: false },
  { name: '1P-LSD', description: 'LSD prodrug research chemical', categorySlug: 'psychedelics', defaultUnit: 'mcg', minDose: 25, maxDose: 200, isPopular: true },
  { name: '4-AcO-DMT', description: 'Psilacetin — psilocybin prodrug', categorySlug: 'psychedelics', defaultUnit: 'mg', minDose: 5, maxDose: 35, isPopular: false },
  { name: '2C-I', description: 'Psychedelic phenethylamine — visual & empathogenic', categorySlug: 'psychedelics', defaultUnit: 'mg', minDose: 5, maxDose: 20, isPopular: false },
  { name: '2C-E', description: 'Psychedelic phenethylamine — long duration', categorySlug: 'psychedelics', defaultUnit: 'mg', minDose: 5, maxDose: 20, isPopular: false },
  { name: 'DOM', description: 'STP — long-acting psychedelic amphetamine', categorySlug: 'psychedelics', defaultUnit: 'mg', minDose: 1, maxDose: 5, isPopular: false },
  { name: 'Ibogaine', description: 'Iboga root — long psychedelic / addiction interruptor', categorySlug: 'psychedelics', defaultUnit: 'mg', minDose: 100, maxDose: 500, isPopular: false },

  // Sedatives & depressants
  { name: 'Ketamine', description: 'K / Special K — dissociative anesthetic', categorySlug: 'sedatives', defaultUnit: 'mg', minDose: 20, maxDose: 150, isPopular: true },
  { name: 'GHB', description: 'G / liquid ecstasy — CNS depressant', categorySlug: 'sedatives', defaultUnit: 'g', minDose: 0.5, maxDose: 3, isPopular: false },
  { name: 'GBL', description: 'Prodrug of GHB — industrial solvent', categorySlug: 'sedatives', defaultUnit: 'ml', minDose: 0.5, maxDose: 2, isPopular: false },
  { name: 'Phenibut', description: 'GABA-B agonist — anxiolytic supplement', categorySlug: 'sedatives', defaultUnit: 'mg', minDose: 250, maxDose: 2000, isPopular: false },
  { name: 'Kava', description: 'Piper methysticum — herbal sedative drink', categorySlug: 'sedatives', defaultUnit: 'g', minDose: 5, maxDose: 30, isPopular: false },
  { name: 'PCP', description: 'Angel dust — dissociative anesthetic', categorySlug: 'sedatives', defaultUnit: 'mg', minDose: 2, maxDose: 15, isPopular: false },
  { name: '2-FDCK', description: 'Fluoroketamine — ketamine analog dissociative', categorySlug: 'sedatives', defaultUnit: 'mg', minDose: 20, maxDose: 150, isPopular: false },
  { name: 'Baclofen', description: 'GABA-B agonist muscle relaxant', categorySlug: 'sedatives', defaultUnit: 'mg', minDose: 5, maxDose: 20, isPopular: false },

  // Herbals
  { name: 'Kratom', description: 'Mitragyna speciosa — opioid-like herbal', categorySlug: 'herbals', defaultUnit: 'g', minDose: 1, maxDose: 8, isPopular: true },
  { name: 'Ashwagandha', description: 'Adaptogen — stress & sleep support', categorySlug: 'herbals', defaultUnit: 'mg', minDose: 300, maxDose: 1200, isPopular: true },
  { name: 'Valerian Root', description: 'Herbal sleep & anxiety aid', categorySlug: 'herbals', defaultUnit: 'mg', minDose: 300, maxDose: 900, isPopular: false },
  { name: "St. John's Wort", description: 'Hypericum — mood herb (CYP interactions)', categorySlug: 'herbals', defaultUnit: 'mg', minDose: 300, maxDose: 900, isPopular: false },
  { name: 'Kanna', description: 'Sceletium — mood elevating succulent', categorySlug: 'herbals', defaultUnit: 'mg', minDose: 25, maxDose: 100, isPopular: false },
  { name: 'Chamomile', description: 'Matricaria — calming herbal tea', categorySlug: 'herbals', defaultUnit: 'g', minDose: 1, maxDose: 4, isPopular: false },
  { name: 'Ginseng', description: 'Panax — adaptogenic energy herb', categorySlug: 'herbals', defaultUnit: 'mg', minDose: 200, maxDose: 1000, isPopular: false },
  { name: 'Rhodiola', description: 'Adaptogen — stress & fatigue support', categorySlug: 'herbals', defaultUnit: 'mg', minDose: 100, maxDose: 600, isPopular: false },
  { name: 'Lions Mane', description: 'Hericium — cognitive & nerve support mushroom', categorySlug: 'herbals', defaultUnit: 'mg', minDose: 500, maxDose: 3000, isPopular: true },
  { name: 'Amanita Muscaria', description: 'Fly agaric — muscimol deliriant mushroom', categorySlug: 'herbals', defaultUnit: 'g', minDose: 0.5, maxDose: 5, isPopular: false },
  { name: 'Blue Lotus', description: 'Nymphaea caerulea — mild sedating flower', categorySlug: 'herbals', defaultUnit: 'g', minDose: 0.5, maxDose: 3, isPopular: false },

  // Other
  { name: 'Nitrous Oxide', description: 'Whippets / N2O — inhalant dissociative', categorySlug: 'other', defaultUnit: 'chargers', minDose: 1, maxDose: 5, isPopular: false },
  { name: 'Poppers', description: 'Alkyl nitrites — vasodilator inhalant', categorySlug: 'other', defaultUnit: 'inhalation', minDose: 1, maxDose: 3, isPopular: false },
  { name: 'Custom Substance', description: 'Other / unlisted — log manually', categorySlug: 'other', defaultUnit: 'mg', minDose: 1, maxDose: 1000, isPopular: false },
];
