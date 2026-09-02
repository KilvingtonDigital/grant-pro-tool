/**
 * Florida — My Safe Florida Home (MSFH) Program
 * Administered by: Florida Department of Financial Services
 * Statewide — no county restrictions
 * Max Grant: $10,000 (2:1 matching; 100% for low-income)
 */

export const FL_PROGRAM = {
  state: 'FL',
  programName: 'My Safe Florida Home (MSFH)',
  adminBody: 'Florida Department of Financial Services',
  maxGrant: 10000,
  programUrl: 'https://www.mysafeflhome.com',
  grantType: 'matching' as const, // State pays $2 per $1 homeowner spends
  applicationMethod: 'closed_allocated' as const,
  preApprovalRequired: true,
  certifiedInstallerRequired: false,
  evaluatorRequired: true, // Wind mitigation inspection required first
  statewide: true,
  propertyRequirements: {
    type: 'single_family' as const,
    ownerOccupied: true,
    primaryResidence: true,
    requiresHomesteadExemption: true,
    originalPermitBefore: '2008-01-01',
    maxInsuredValue: 700000, // Low-income exempt from this cap
    excludes: ['condo', 'mobile', 'rental'],
    incomeRestricted: true, // 2025-2026 cycle is low/moderate income only
  },
  notes: [
    '⚠️ ADJACENT GRANT ONLY: MSFH is a wind mitigation grant. It does NOT require IBHS FORTIFIED certification, though it is compatible with FORTIFIED upgrades.',
    'STATUS: CLOSED. The 2025-2026 cycle is allocated/exhausted.',
    'Grant is 2:1 matching — state pays $2 for every $1 you spend, up to $10,000',
    'Low-income households may qualify for 100% coverage with no match required',
    'Home must have homestead exemption on file',
    'Original building permit must pre-date January 1, 2008',
    'Wind mitigation inspection must be completed before applying for grant',
  ],
};

export interface FLEligibilityInput {
  propertyType: string;
  isOwnerOccupied: boolean;
  hasHomesteadExemption?: boolean;
  homeBuiltBefore2008?: boolean;
  insuredValueUnder700k?: boolean;
  isLowModerateIncome?: boolean;
}

export interface FLEligibilityResult {
  eligible: boolean;
  conditional: boolean; // May be eligible pending income verification
  programName: string;
  maxGrant: number;
  disqualifyReason?: string;
  conditions?: string[];
  notes: string[];
}

export function checkFLEligibility(input: FLEligibilityInput): FLEligibilityResult {
  if (input.propertyType !== 'single_family') {
    return {
      eligible: false,
      conditional: false,
      programName: FL_PROGRAM.programName,
      maxGrant: 0,
      disqualifyReason: 'MSFH only covers single-family, site-built detached homes. Condos and mobile/manufactured homes are excluded.',
      notes: FL_PROGRAM.notes,
    };
  }

  if (!input.isOwnerOccupied) {
    return {
      eligible: false,
      conditional: false,
      programName: FL_PROGRAM.programName,
      maxGrant: 0,
      disqualifyReason: 'Must be owner-occupied primary residence with Florida homestead exemption.',
      notes: FL_PROGRAM.notes,
    };
  }

  const conditions: string[] = [];

  if (input.hasHomesteadExemption === false) {
    conditions.push('Homestead exemption required — must be on file with county');
  }
  if (input.homeBuiltBefore2008 === false) {
    return {
      eligible: false,
      conditional: false,
      programName: FL_PROGRAM.programName,
      maxGrant: 0,
      disqualifyReason: 'Original building permit must pre-date January 1, 2008. Newer homes do not qualify.',
      notes: FL_PROGRAM.notes,
    };
  }
  if (input.insuredValueUnder700k === false && !input.isLowModerateIncome) {
    return {
      eligible: false,
      conditional: false,
      programName: FL_PROGRAM.programName,
      maxGrant: 0,
      disqualifyReason: 'Home must be insured for $700,000 or less (low-income homeowners are exempt from this cap).',
      notes: FL_PROGRAM.notes,
    };
  }

  // Income restriction for 2025-2026 cycle
  if (input.isLowModerateIncome === false) {
    return {
      eligible: false,
      conditional: true,
      programName: FL_PROGRAM.programName,
      maxGrant: 0,
      disqualifyReason: 'The current 2025-2026 MSFH cycle is restricted to low and moderate income households. Check mysafeflhome.com for future cycles with broader eligibility.',
      notes: FL_PROGRAM.notes,
    };
  }

  return {
    eligible: conditions.length === 0,
    conditional: conditions.length > 0,
    programName: FL_PROGRAM.programName,
    maxGrant: FL_PROGRAM.maxGrant,
    conditions: conditions.length > 0 ? conditions : undefined,
    notes: FL_PROGRAM.notes,
  };
}
