/**
 * Alabama — Strengthen Alabama Homes (SAH) Grant Program
 * Administered by: Alabama Department of Insurance
 * Max Grant: $10,000
 * Insurance Discounts: 25-35% (Roof), 35-45% (Silver), 45-55% (Gold) on wind premium
 */

export const AL_PROGRAM = {
  state: 'AL',
  programName: 'Strengthen Alabama Homes (SAH)',
  adminBody: 'Alabama Department of Insurance',
  maxGrant: 10000,
  programUrl: 'https://strengthenalabamahomes.com',
  grantType: 'direct' as const,
  applicationMethod: 'periodic_rounds' as const,
  preApprovalRequired: true,
  certifiedInstallerRequired: true,   // As of Nov 1, 2025
  evaluatorRequired: true,
  insuranceDiscounts: {
    roof:   { min: 25, max: 35 },
    silver: { min: 35, max: 45 },
    gold:   { min: 45, max: 55 },
  },
  eligibleCounties: [
    'Baldwin',
    'Mobile',
    'Jefferson',
    'Tuscaloosa',
    'Escambia',
  ],
  propertyRequirements: {
    type: 'single_family' as const,
    ownerOccupied: true,
    primaryResidence: true,
    excludes: ['condo', 'mobile', 'rental', 'townhome'],
    mustBeInGoodRepair: true,
    mustHaveWindInsurance: true,
    mustNotBeListedForSale: true,
  },
  notes: [
    'STATUS: Dynamic/Quarterly. Q3 2026 opened July 7 (Mobile) & July 9 (Baldwin). Next openings: Oct 6 (Mobile) & Oct 8 (Baldwin).',
    'NOTE: Only Mobile and Baldwin counties are currently active/recurring in 2026. Other historically eligible counties (Jefferson, Tuscaloosa, Escambia) may not have open funding.',
    'Work must NOT begin before grant approval.',
    'Certified FORTIFIED installer required as of Nov 1, 2025.',
    'Grant does NOT cover evaluator cost — homeowner pays that separately.',
  ],
};

/** All AL zip codes by county (major zip codes for eligibility detection) */
const COUNTY_ZIPS: Record<string, string[]> = {
  Baldwin: [
    '36502','36503','36504','36505','36507','36509','36511','36512','36513',
    '36518','36523','36524','36525','36526','36527','36528','36530','36532',
    '36535','36536','36538','36539','36540','36541','36542','36543','36544',
    '36545','36547','36548','36549','36551','36553','36555','36556','36558',
    '36559','36560','36561','36562','36563','36564','36567','36568','36569',
    '36571','36572','36574','36575','36576','36578','36579','36580','36581',
    '36582','36583','36584','36585','36587',
  ],
  Mobile: [
    '36601','36602','36603','36604','36605','36606','36607','36608','36609',
    '36610','36611','36612','36613','36615','36616','36617','36618','36619',
    '36628','36633','36640','36641','36644','36652','36660','36663','36670',
    '36671','36675','36685','36688','36689','36693','36695',
  ],
  Jefferson: [
    '35004','35005','35006','35007','35020','35022','35023','35031','35033',
    '35034','35035','35036','35038','35040','35042','35043','35051','35052',
    '35054','35060','35061','35062','35064','35068','35071','35073','35079',
    '35080','35082','35085','35094','35097','35111','35114','35115','35116',
    '35117','35118','35119','35120','35121','35124','35126','35127','35128',
    '35130','35131','35133','35135','35144','35146','35147','35148','35149',
    '35150','35160','35161','35171','35172','35173','35175','35176','35178',
    '35179','35180','35181','35182','35183','35184','35185','35186','35187',
    '35188','35201','35202','35203','35204','35205','35206','35207','35208',
    '35209','35210','35211','35212','35213','35214','35215','35216','35217',
    '35218','35219','35220','35221','35222','35223','35224','35226','35228',
    '35229','35230','35231','35232','35233','35234','35235','35236','35237',
    '35238','35240','35242','35243','35244','35246','35249','35253','35254',
    '35255','35259','35260','35261','35263','35266','35270','35282','35283',
    '35285','35286','35287','35288','35289','35290','35291','35292','35293',
    '35294','35295','35296','35297','35298',
  ],
  Tuscaloosa: [
    '35401','35402','35403','35404','35405','35406','35407','35440','35441',
    '35442','35443','35444','35446','35447','35448','35449','35452','35453',
    '35456','35457','35458','35459','35460','35461','35462','35463','35464',
    '35466','35469','35470','35473','35474','35475','35476','35477','35478',
    '35480','35481','35482','35485','35486','35487','35490','35491',
  ],
  Escambia: [
    '36426','36427','36432','36436','36451','36460','36461','36462','36467',
    '36471','36473','36474','36475','36476','36477','36480','36481','36482',
    '36483',
  ],
};

/** Reverse map: zip → county */
const ZIP_TO_COUNTY: Record<string, string> = {};
for (const [county, zips] of Object.entries(COUNTY_ZIPS)) {
  for (const zip of zips) {
    ZIP_TO_COUNTY[zip] = county;
  }
}

export interface ALEligibilityInput {
  zipCode: string;
  county?: string;
  propertyType: string;
  isOwnerOccupied: boolean;
}

export interface ALEligibilityResult {
  eligible: boolean;
  county: string | null;
  programName: string;
  maxGrant: number;
  insuranceDiscounts: typeof AL_PROGRAM.insuranceDiscounts;
  disqualifyReason?: string;
  territory?: string;
}

export function checkALEligibility(input: ALEligibilityInput): ALEligibilityResult {
  // Resolve county from zip or provided county
  const county = input.county
    ? AL_PROGRAM.eligibleCounties.find((c) => c.toLowerCase() === input.county!.toLowerCase()) ?? ZIP_TO_COUNTY[input.zipCode] ?? null
    : ZIP_TO_COUNTY[input.zipCode] ?? null;

  if (!county) {
    return {
      eligible: false,
      county: null,
      programName: AL_PROGRAM.programName,
      maxGrant: 0,
      insuranceDiscounts: AL_PROGRAM.insuranceDiscounts,
      disqualifyReason: 'Property not in a currently eligible SAH county. Active counties: Baldwin, Mobile, Jefferson, Tuscaloosa, Escambia.',
    };
  }

  if (!AL_PROGRAM.eligibleCounties.includes(county)) {
    return {
      eligible: false,
      county,
      programName: AL_PROGRAM.programName,
      maxGrant: 0,
      insuranceDiscounts: AL_PROGRAM.insuranceDiscounts,
      disqualifyReason: `${county} County is not currently in the SAH eligible county list.`,
    };
  }

  if (input.propertyType !== 'single_family') {
    return {
      eligible: false,
      county,
      programName: AL_PROGRAM.programName,
      maxGrant: 0,
      insuranceDiscounts: AL_PROGRAM.insuranceDiscounts,
      disqualifyReason: 'SAH grants are only available for single-family, owner-occupied primary residences. Condos, mobile homes, and rentals do not qualify.',
    };
  }

  if (!input.isOwnerOccupied) {
    return {
      eligible: false,
      county,
      programName: AL_PROGRAM.programName,
      maxGrant: 0,
      insuranceDiscounts: AL_PROGRAM.insuranceDiscounts,
      disqualifyReason: 'Property must be owner-occupied to qualify for SAH grants.',
    };
  }

  return {
    eligible: true,
    county,
    programName: AL_PROGRAM.programName,
    maxGrant: AL_PROGRAM.maxGrant,
    insuranceDiscounts: AL_PROGRAM.insuranceDiscounts,
    territory: `${county} County`,
  };
}
