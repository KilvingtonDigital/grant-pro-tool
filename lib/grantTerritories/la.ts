/**
 * Louisiana — Louisiana Fortify Homes Program (LFHP)
 * Administered by: Louisiana Department of Insurance
 * Max Grant: $10,000
 * Selection: Random lottery during open registration windows
 */

export const LA_PROGRAM = {
  state: 'LA',
  programName: 'Louisiana Fortify Homes Program (LFHP)',
  adminBody: 'Louisiana Department of Insurance',
  maxGrant: 10000,
  programUrl: 'https://fortifyhomes.la.gov',
  grantType: 'lottery' as const,
  applicationMethod: 'random_lottery' as const,
  preApprovalRequired: true,
  certifiedInstallerRequired: false,
  evaluatorRequired: true,
  taxCreditsAvailable: true,
  propertyRequirements: {
    type: 'single_family' as const,
    ownerOccupied: true,
    primaryResidence: true,
    requiresHomesteadExemption: true,
    requiresWindInsurance: true,
    floodInsuranceIfInSFHA: true,
    mustBeGoodCondition: true,
    excludes: ['condo', 'mobile', 'rental'],
  },
  /** Parishes eligible in the 2026 round — changes each round */
  eligibleParishes2026: [
    'Acadia', 'Jefferson Davis', 'Lafayette', 'St. Landry', 'Iberia',
    'St. Martin', 'Vermilion', 'Ascension', 'Calcasieu', 'Livingston',
    'St. Tammany', 'Tangipahoa',
  ],
  notes: [
    'STATUS: Round 9 CLOSED on June 19. Lottery-based — not first-come-first-served. Must enter during open registration windows.',
    'Eligible parishes change each funding round — Round 9 included 25 parishes. Verify at fortifyhomes.la.gov for future rounds.',
    '💡 Louisiana $10,000 FORTIFIED Roof Tax Credit: 100% of qualified cost up to $10M annual cap (due June 30). Cannot stack with LFHP grant.',
    '💡 FORTIFIED RE-UP Loan: Up to $25,000 via Finance NOLA.',
    'Must have active homeowners policy with wind/hail coverage.',
    'If home is in a FEMA Special Flood Hazard Area, active flood insurance is required.',
  ],
};

/** Louisiana parish → zip codes mapping (avoids duplicate key TypeScript errors) */
const PARISH_ZIPS: Record<string, string[]> = {
  Acadia: ['70526','70529','70531','70543','70555','70578','70584','70591'],
  'Jefferson Davis': ['70546','70548','70554'],
  Lafayette: ['70501','70502','70503','70504','70505','70506','70507','70508','70509'],
  'St. Landry': ['70512','70519','70521','70524','70535','70549','70570','70571','70575','70576','70577','70580','70581','70582','70583','70585','70586','70589'],
  Iberia: ['70513','70514','70522','70523','70544','70562'],
  'St. Martin': ['70517','70518','70528'],
  Vermilion: ['70510','70511','70515','70530','70537','70538','70542','70550','70552','70556','70558','70559'],
  Ascension: ['70714','70725','70730','70734','70737','70769','70773','70778'],
  Calcasieu: ['70601','70602','70603','70604','70605','70606','70607','70609','70611','70612','70615','70616','70629'],
  Livingston: ['70706','70707','70726','70727','70754','70785'],
  'St. Tammany': ['70420','70433','70434','70435','70437','70445','70447','70448','70449','70452','70453','70454','70455','70456','70457','70458','70459','70460','70461','70464','70465','70469','70470','70471'],
  Tangipahoa: ['70401','70402','70403','70404','70427','70431','70436','70441','70443','70444','70450','70451'],
};

/** Build reverse lookup at module load (no duplicate key issue) */
const ZIP_TO_PARISH: Record<string, string> = {};
for (const [parish, zips] of Object.entries(PARISH_ZIPS)) {
  for (const zip of zips) {
    if (!ZIP_TO_PARISH[zip]) ZIP_TO_PARISH[zip] = parish; // first match wins
  }
}


export interface LAEligibilityInput {
  zipCode: string;
  parish?: string;
  propertyType: string;
  isOwnerOccupied: boolean;
}

export interface LAEligibilityResult {
  eligible: boolean;
  parish: string | null;
  programName: string;
  maxGrant: number;
  disqualifyReason?: string;
  notes: string[];
}

export function checkLAEligibility(input: LAEligibilityInput): LAEligibilityResult {
  const parish = input.parish ?? ZIP_TO_PARISH[input.zipCode] ?? null;

  if (!parish) {
    return {
      eligible: false,
      parish: null,
      programName: LA_PROGRAM.programName,
      maxGrant: 0,
      disqualifyReason: 'Unable to determine parish from zip code. Visit fortifyhomes.la.gov to verify your address eligibility.',
      notes: LA_PROGRAM.notes,
    };
  }

  if (input.propertyType !== 'single_family') {
    return {
      eligible: false,
      parish,
      programName: LA_PROGRAM.programName,
      maxGrant: 0,
      disqualifyReason: 'LFHP grants are only available for single-family primary residences with a Louisiana homestead exemption.',
      notes: LA_PROGRAM.notes,
    };
  }

  if (!input.isOwnerOccupied) {
    return {
      eligible: false,
      parish,
      programName: LA_PROGRAM.programName,
      maxGrant: 0,
      disqualifyReason: 'Must be owner-occupied primary residence with homestead exemption.',
      notes: LA_PROGRAM.notes,
    };
  }

  const parishEligible = LA_PROGRAM.eligibleParishes2026.some(
    (p) => p.toLowerCase() === parish.toLowerCase()
  );

  if (!parishEligible) {
    return {
      eligible: false,
      parish,
      programName: LA_PROGRAM.programName,
      maxGrant: 0,
      disqualifyReason: `${parish} Parish is not in the current 2026 eligible parish list. Eligible parishes rotate between rounds — check fortifyhomes.la.gov for updates.`,
      notes: LA_PROGRAM.notes,
    };
  }

  return {
    eligible: true,
    parish,
    programName: LA_PROGRAM.programName,
    maxGrant: LA_PROGRAM.maxGrant,
    notes: LA_PROGRAM.notes,
  };
}
