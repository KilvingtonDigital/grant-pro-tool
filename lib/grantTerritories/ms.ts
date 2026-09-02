/**
 * Mississippi — Strengthen Mississippi Homes (SMH)
 * Administered by: Mississippi Windstorm Underwriting Association (MWUA)
 * Max Grant: $10,000
 * Status: Interest/Registration Open (as of Jul 2026)
 */

export const MS_PROGRAM = {
  state: 'MS',
  programName: 'Strengthen Mississippi Homes (SMH)',
  adminBody: 'Mississippi Windstorm Underwriting Association (MWUA)',
  maxGrant: 10000,
  programUrl: 'https://www.mid.ms.gov/mississippi-insurance-department/preparedness/mitigation/smh/',
  grantType: 'direct' as const,
  applicationMethod: 'periodic_rounds' as const,
  preApprovalRequired: true,
  certifiedInstallerRequired: true,
  evaluatorRequired: true,
  eligibleCounties: [
    'Hancock',
    'Harrison',
    'Jackson',
  ],
  propertyRequirements: {
    type: 'single_family' as const,
    ownerOccupied: true,
    primaryResidence: true,
    requiresMWUAPolicy: true,
    excludes: ['condo', 'mobile', 'rental', 'townhome'],
  },
  notes: [
    'Must have maintained a MWUA policy for at least 3 consecutive years.',
    'Program is limited to Hancock, Harrison, and Jackson counties.',
    'Interest/Registration is currently open for the initial cohort.',
    'Work must NOT begin before grant approval.',
  ],
};

const COUNTY_ZIPS: Record<string, string[]> = {
  Hancock: ['39520', '39521', '39522', '39525', '39528', '39529', '39556', '39558', '39571', '39576'],
  Harrison: ['39501', '39502', '39503', '39505', '39506', '39507', '39530', '39531', '39532', '39533', '39534', '39535', '39540', '39560', '39561', '39564', '39566', '39571', '39573', '39574'],
  Jackson: ['39552', '39553', '39562', '39563', '39564', '39565', '39567', '39568', '39569', '39581', '39595'],
};

const ZIP_TO_COUNTY: Record<string, string> = {};
for (const [county, zips] of Object.entries(COUNTY_ZIPS)) {
  for (const zip of zips) {
    ZIP_TO_COUNTY[zip] = county;
  }
}

export interface MSEligibilityInput {
  zipCode: string;
  county?: string;
  propertyType: string;
  isOwnerOccupied: boolean;
}

export interface MSEligibilityResult {
  eligible: boolean;
  county: string | null;
  programName: string;
  maxGrant: number;
  disqualifyReason?: string;
  notes: string[];
}

export function checkMSEligibility(input: MSEligibilityInput): MSEligibilityResult {
  const county = input.county
    ? MS_PROGRAM.eligibleCounties.find((c) => c.toLowerCase() === input.county!.toLowerCase()) ?? ZIP_TO_COUNTY[input.zipCode] ?? null
    : ZIP_TO_COUNTY[input.zipCode] ?? null;

  if (!county) {
    return {
      eligible: false,
      county: null,
      programName: MS_PROGRAM.programName,
      maxGrant: 0,
      disqualifyReason: 'Property not in a currently eligible SMH county. Active counties: Hancock, Harrison, Jackson.',
      notes: MS_PROGRAM.notes,
    };
  }

  if (input.propertyType !== 'single_family') {
    return {
      eligible: false,
      county,
      programName: MS_PROGRAM.programName,
      maxGrant: 0,
      disqualifyReason: 'SMH grants are only available for single-family, owner-occupied primary residences. Townhomes, condos, and mobile homes do not qualify.',
      notes: MS_PROGRAM.notes,
    };
  }

  if (!input.isOwnerOccupied) {
    return {
      eligible: false,
      county,
      programName: MS_PROGRAM.programName,
      maxGrant: 0,
      disqualifyReason: 'Property must be owner-occupied to qualify for SMH grants.',
      notes: MS_PROGRAM.notes,
    };
  }

  return {
    eligible: true,
    county,
    programName: MS_PROGRAM.programName,
    maxGrant: MS_PROGRAM.maxGrant,
    notes: MS_PROGRAM.notes,
  };
}
