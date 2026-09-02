/**
 * North Carolina — Strengthen Your Roof (SYR) & Strengthen Your Coastal Roof (SYCR)
 * Administered by: NC Insurance Underwriting Association (NCIUA / NC Beach Plan)
 * SYR:  Up to $10,000 — territories 110, 120
 * SYCR: Up to $6,000  — territories 130, 140, 150, 160
 * Supplemental: +$5,000 if income ≤ 200% FPL (Clean Energy Fund of Carolinas)
 */

export const NC_PROGRAMS = {
  SYR: {
    programName: 'Strengthen Your Roof (SYR)',
    maxGrant: 10000,
    adminBody: 'NC Insurance Underwriting Association (NCIUA)',
    programUrl: 'https://strengthenyourroof.com',
    territories: ['110', '120'],
  },
  SYCR: {
    programName: 'Strengthen Your Coastal Roof (SYCR)',
    maxGrant: 6000,
    adminBody: 'NC Insurance Underwriting Association (NCIUA)',
    programUrl: 'https://strengthenyourcoastalroof.com',
    territories: ['130', '140', '150', '160'],
  },
  SUPPLEMENTAL: {
    programName: 'Clean Energy Fund of Carolinas Supplement',
    maxGrant: 5000,
    requirement: 'Income ≤ 200% Federal Poverty Level',
    programUrl: 'https://cefcarolinas.org',
  },
};

/**
 * Territory 110 — SYR — Outer Banks / Barrier Islands (Beach Area)
 * Counties: Currituck, Dare, Hyde
 */
const TERRITORY_110_COUNTIES = ['Currituck', 'Dare', 'Hyde'];

/**
 * Territory 120 — SYR — Beach Areas
 * Counties: Brunswick, Carteret, New Hanover, Onslow, Pender
 */
const TERRITORY_120_COUNTIES = ['Brunswick', 'Carteret', 'New Hanover', 'Onslow', 'Pender'];

/**
 * Territory 130 — SYCR — Coastal Areas
 * Counties: Currituck, Dare, Hyde, Pamlico
 */
const TERRITORY_130_COUNTIES = ['Currituck', 'Dare', 'Hyde', 'Pamlico'];

/**
 * Territory 140 — SYCR — Eastern Coastal Areas
 * Defined by explicit zip codes
 */
const TERRITORY_140_ZIPS = new Set([
  '28403','28404','28405','28406','28407','28408','28409','28410','28411','28412',
  '28422','28428','28443','28445','28459','28460','28461','28462','28467','28468',
  '28469','28470','28480','28511','28516','28520','28524','28528','28531','28532',
  '28533','28539','28553','28557','28570','28577','28579','28581','28584','28589',
]);

/**
 * Territory 150 — SYCR — Coastal Areas
 * Counties: Beaufort, Camden, Chowan, Craven, Jones, Pasquotank, Perquimans, Tyrrell, Washington
 */
const TERRITORY_150_COUNTIES = [
  'Beaufort', 'Camden', 'Chowan', 'Craven', 'Jones',
  'Pasquotank', 'Perquimans', 'Tyrrell', 'Washington',
];

/**
 * Territory 160 — SYCR — Western Coastal Areas
 * Defined by explicit zip codes
 */
const TERRITORY_160_ZIPS = new Set([
  '28401','28402','28420','28421','28425','28429','28435','28436','28447','28448',
  '28451','28452','28454','28456','28457','28466','28478','28479','28518','28521',
  '28540','28541','28542','28543','28544','28545','28546','28547','28555','28574',
  '28582',
]);

/** All NC coastal counties for quick membership check */
const ALL_COASTAL_COUNTIES = new Set([
  ...TERRITORY_110_COUNTIES,
  ...TERRITORY_120_COUNTIES,
  ...TERRITORY_130_COUNTIES,
  ...TERRITORY_150_COUNTIES,
  'Brunswick', 'Carteret', 'New Hanover', 'Onslow', 'Pender', // from T140
]);

export interface NCEligibilityInput {
  zipCode: string;
  county?: string;
  propertyType: string;
  isOwnerOccupied: boolean;
  hasNCIUAPolicy?: boolean; // has NC Beach Plan policy
}

export interface NCEligibilityResult {
  eligible: boolean;
  territory: string | null;
  programs: Array<{ programName: string; maxGrant: number; programUrl: string }>;
  maxGrant: number;
  county: string | null;
  disqualifyReason?: string;
  notes: string[];
}

function detectTerritory(zipCode: string, county?: string): string | null {
  // Zip-based checks first (more precise)
  if (TERRITORY_140_ZIPS.has(zipCode)) return '140';
  if (TERRITORY_160_ZIPS.has(zipCode)) return '160';

  // County-based checks
  if (!county) return null;
  const c = county.trim();
  if (TERRITORY_110_COUNTIES.includes(c)) return '110';
  if (TERRITORY_120_COUNTIES.includes(c)) return '120';
  if (TERRITORY_130_COUNTIES.includes(c)) return '130';
  if (TERRITORY_150_COUNTIES.includes(c)) return '150';

  return null;
}

export function checkNCEligibility(input: NCEligibilityInput): NCEligibilityResult {
  const territory = detectTerritory(input.zipCode, input.county);

  if (!territory) {
    return {
      eligible: false,
      territory: null,
      programs: [],
      maxGrant: 0,
      county: input.county ?? null,
      disqualifyReason: 'Property does not appear to be in an NCIUA coastal territory. NC grant programs (SYR/SYCR) are limited to the 18 designated coastal counties and beach areas.',
      notes: [],
    };
  }

  if (input.propertyType !== 'single_family') {
    return {
      eligible: false,
      territory,
      programs: [],
      maxGrant: 0,
      county: input.county ?? null,
      disqualifyReason: 'NC NCIUA grant programs are only available for single-family residences. Condos, mobile homes, and rentals do not qualify.',
      notes: [],
    };
  }

  if (!input.isOwnerOccupied) {
    return {
      eligible: false,
      territory,
      programs: [],
      maxGrant: 0,
      county: input.county ?? null,
      disqualifyReason: 'Property must be owner-occupied to qualify for NC NCIUA grants.',
      notes: [],
    };
  }

  const isSYR = ['110', '120'].includes(territory);
  const programs = isSYR
    ? [{ programName: NC_PROGRAMS.SYR.programName, maxGrant: NC_PROGRAMS.SYR.maxGrant, programUrl: NC_PROGRAMS.SYR.programUrl }]
    : [{ programName: NC_PROGRAMS.SYCR.programName, maxGrant: NC_PROGRAMS.SYCR.maxGrant, programUrl: NC_PROGRAMS.SYCR.programUrl }];

  const maxGrant = isSYR ? NC_PROGRAMS.SYR.maxGrant : NC_PROGRAMS.SYCR.maxGrant;

  const notes = [
    'Must have an active NC Beach Plan (NCIUA) homeowners or dwelling policy to qualify.',
    'Grants are first-come, first-served — funding is limited. Apply as soon as windows open.',
    'Must use a FORTIFIED-trained/certified contractor.',
    'Third-party FORTIFIED Evaluator required to verify work before grant is paid.',
  ];

  if (input.hasNCIUAPolicy === false) {
    notes.unshift('⚠️ An active NCIUA Beach Plan policy is required. Verify your policy type with your insurance agent.');
  }

  return {
    eligible: true,
    territory: `Territory ${territory}`,
    programs,
    maxGrant,
    county: input.county ?? null,
    notes,
  };
}
