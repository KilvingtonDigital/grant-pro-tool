/**
 * South Carolina — SC Safe Home Program
 * Administered by: SC Department of Insurance
 * Max Grant: Varies (matching and non-matching)
 * Eligible: Coastal counties only
 */

export const SC_PROGRAM = {
  state: 'SC',
  programName: 'SC Safe Home',
  adminBody: 'SC Department of Insurance',
  maxGrant: 7500, // Non-matching up to $7,500; matching 1:1 up to $6,000
  programUrl: 'https://doi.sc.gov/safehome',
  grantType: 'matching' as const,
  applicationMethod: 'periodic_rounds' as const,
  preApprovalRequired: true,
  eligibleCounties: [
    'Beaufort', 'Berkeley', 'Charleston', 'Colleton',
    'Dorchester', 'Florence', 'Georgetown', 'Horry', 'Jasper', 'Marion', 'Williamsburg',
  ],
  propertyRequirements: {
    type: 'single_family' as const,
    ownerOccupied: true,
    primaryResidence: true,
    excludes: ['condo', 'mobile', 'rental'],
  },
  notes: [
    'Grant amounts vary — $7,500 non-matching for income <= 80% HUD median, or $6,000 matching (1:1).',
    'Limited to 11 coastal counties.',
    'Status: CLOSED. July 2026 round is closed; monitor SC DOI for future twice-yearly rounds.',
  ],
};

const SC_COASTAL_COUNTY_ZIPS: Record<string, string[]> = {
  Beaufort: ['29901','29902','29903','29904','29905','29906','29907','29909','29910','29912','29915','29920','29925','29926','29927','29928','29929','29935','29936','29940','29941','29943','29944','29945'],
  Berkeley: ['29401','29403','29404','29405','29406','29407','29409','29410','29412','29414','29418','29420','29422','29423','29424','29425','29426','29429','29432','29434','29436','29437','29438','29439','29445','29449','29450','29451','29452','29453','29455','29456','29461','29464','29465','29466','29469','29470','29471','29472','29474','29480','29482','29483','29484','29485','29486','29487','29488'],
  Charleston: ['29401','29403','29404','29405','29406','29407','29409','29410','29412','29414','29418','29420','29422','29423','29424','29425','29426','29429','29455','29464','29466'],
  Colleton: ['29432','29437','29438','29461','29469','29474','29488'],
  Dorchester: ['29420','29436','29437','29438','29445','29483','29484','29485','29486','29487','29488'],
  Florence: ['29501','29502','29503','29504','29505','29506','29530','29541','29555','29560','29583','29591'],
  Georgetown: ['29440','29442'],
  Horry: ['29510','29511','29512','29516','29518','29526','29527','29528','29544','29545','29546','29547','29550','29551','29554','29555','29556','29557','29560','29561','29563','29564','29565','29566','29568','29569','29570','29571','29572','29574','29575','29576','29577','29578','29579','29580','29581','29582','29583','29584','29585','29587','29588','29589','29590','29591','29592','29593','29594','29595','29596'],
  Jasper: ['29910','29929','29935','29936','29943','29944'],
  Marion: ['29571', '29574', '29581', '29592'],
  Williamsburg: ['29510', '29518', '29554', '29556', '29564', '29590'],
};

const ZIP_TO_COUNTY: Record<string, string> = {};
for (const [county, zips] of Object.entries(SC_COASTAL_COUNTY_ZIPS)) {
  for (const zip of zips) {
    ZIP_TO_COUNTY[zip] = county;
  }
}

export interface SCEligibilityInput {
  zipCode: string;
  county?: string;
  propertyType: string;
  isOwnerOccupied: boolean;
}

export interface SCEligibilityResult {
  eligible: boolean;
  county: string | null;
  programName: string;
  maxGrant: number;
  disqualifyReason?: string;
  notes: string[];
}

export function checkSCEligibility(input: SCEligibilityInput): SCEligibilityResult {
  const county = input.county ?? ZIP_TO_COUNTY[input.zipCode] ?? null;

  if (!county || !SC_PROGRAM.eligibleCounties.includes(county)) {
    return {
      eligible: false,
      county,
      programName: SC_PROGRAM.programName,
      maxGrant: 0,
      disqualifyReason: 'SC Safe Home is limited to homeowners in designated coastal counties.',
      notes: SC_PROGRAM.notes,
    };
  }

  if (input.propertyType !== 'single_family' || !input.isOwnerOccupied) {
    return {
      eligible: false,
      county,
      programName: SC_PROGRAM.programName,
      maxGrant: 0,
      disqualifyReason: 'Must be a single-family, owner-occupied primary residence.',
      notes: SC_PROGRAM.notes,
    };
  }

  return {
    eligible: true,
    county,
    programName: SC_PROGRAM.programName,
    maxGrant: SC_PROGRAM.maxGrant,
    notes: SC_PROGRAM.notes,
  };
}


/**
 * Oklahoma — Strengthen Oklahoma Homes (SOH)
 * Statewide — homestead exemption required
 * Max Grant: $10,000
 */
export const OK_PROGRAM = {
  state: 'OK',
  programName: 'Strengthen Oklahoma Homes (SOH)',
  adminBody: 'Oklahoma Insurance Department',
  maxGrant: 10000,
  programUrl: 'https://www.oid.ok.gov/okready/',
  grantType: 'direct' as const,
  applicationMethod: 'periodic_launches' as const,
  statewide: true,
  propertyRequirements: {
    type: 'single_family' as const,
    ownerOccupied: true,
    requiresHomesteadExemption: true,
    excludes: ['condo', 'mobile', 'rental'],
  },
  insuranceDiscountNote: 'Many major OK carriers offer 40%+ discounts on wind/hail premiums for FORTIFIED certified homes.',
  notes: [
    'Statewide program — no county restrictions.',
    'Must have homestead exemption on file with county assessor.',
    'Status: Dynamic. 3rd statewide round opened Jul 13. Check www.oid.ok.gov/okready/ for remaining slots.',
    'New and existing single-family homes are eligible.',
    'Insurance premium discounts of 40%+ available from major carriers.',
  ],
};

export interface OKEligibilityInput {
  propertyType: string;
  isOwnerOccupied: boolean;
  hasHomesteadExemption?: boolean;
}

export function checkOKEligibility(input: OKEligibilityInput): { eligible: boolean; programName: string; maxGrant: number; disqualifyReason?: string; notes: string[] } {
  if (input.propertyType !== 'single_family' || !input.isOwnerOccupied) {
    return { eligible: false, programName: OK_PROGRAM.programName, maxGrant: 0, disqualifyReason: 'Must be a single-family, owner-occupied residence with county homestead exemption.', notes: OK_PROGRAM.notes };
  }
  if (input.hasHomesteadExemption === false) {
    return { eligible: false, programName: OK_PROGRAM.programName, maxGrant: 0, disqualifyReason: 'Homestead exemption must be on file with your county assessor.', notes: OK_PROGRAM.notes };
  }
  return { eligible: true, programName: OK_PROGRAM.programName, maxGrant: OK_PROGRAM.maxGrant, notes: OK_PROGRAM.notes };
}
