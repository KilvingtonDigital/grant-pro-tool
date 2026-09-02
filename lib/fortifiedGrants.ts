/**
 * FORTIFIED Grant Eligibility Engine
 * Routes to state-specific checkers and returns a unified result.
 */

import { checkALEligibility } from './grantTerritories/al';
import { checkNCEligibility } from './grantTerritories/nc';
import { checkFLEligibility } from './grantTerritories/fl';
import { checkLAEligibility } from './grantTerritories/la';
import { checkSCEligibility, checkOKEligibility } from './grantTerritories/sc_ok';
import { checkMSEligibility } from './grantTerritories/ms';

export interface FortifiedInput {
  state: string;        // 2-letter state code
  zipCode: string;
  county?: string;
  parish?: string;      // Louisiana-specific
  propertyType: string; // single_family | condo | mobile | rental
  isOwnerOccupied: boolean;
  annualPremium?: number;
  hasNCIUAPolicy?: boolean;
  hasHomesteadExemption?: boolean;
  homeBuiltBefore2008?: boolean;
  insuredValueUnder700k?: boolean;
  isLowModerateIncome?: boolean;
}

export interface GrantProgram {
  programName: string;
  maxGrant: number;
  programUrl?: string;
  territory?: string;
  county?: string;
  parish?: string;
  applicationMethod?: string;
  notes?: string[];
}

export interface FortifiedGrantResult {
  state: string;
  eligible: boolean;
  programs: GrantProgram[];
  maxTotalGrant: number;
  insuranceDiscounts: {
    roof:   { min: number; max: number };
    silver: { min: number; max: number };
    gold:   { min: number; max: number };
  };
  estimatedAnnualSavings: {
    roof:   number;
    silver: number;
    gold:   number;
  };
  est5yrSavings: number;
  disqualifyReason?: string;
  generalNotes: string[];
  territory?: string;
}

/** Default insurance discounts for states without mandated specific percentages */
const DEFAULT_DISCOUNTS = {
  roof:   { min: 10, max: 25 },
  silver: { min: 20, max: 35 },
  gold:   { min: 30, max: 45 },
};

const GENERAL_NOTES = [
  '⚠️ Disclaimer: Grant amounts and insurance discounts are estimates based on publicly available program data and are not guaranteed.',
  'Actual grant availability depends on funding levels and open application windows.',
  'Insurance discounts vary by carrier — confirm with your agent.',
  'Grant pre-approval must be obtained before any work begins.',
  'A FORTIFIED Evaluator is required for all certification levels.',
];

function calcSavings(premium: number, discounts: { min: number; max: number }): number {
  if (!premium) return 0;
  const windPortion = premium * 0.40;
  const avgDiscount = (discounts.min + discounts.max) / 2 / 100;
  return Math.round(windPortion * avgDiscount);
}

export function checkGrantEligibility(input: FortifiedInput): FortifiedGrantResult {
  const state = input.state.toUpperCase();

  let eligible = false;
  const programs: GrantProgram[] = [];
  let maxTotalGrant = 0;
  let disqualifyReason: string | undefined;
  const generalNotes = [...GENERAL_NOTES];
  let territory: string | undefined;
  let discounts = DEFAULT_DISCOUNTS;

  switch (state) {
    case 'AL': {
      const result = checkALEligibility({
        zipCode: input.zipCode,
        county: input.county,
        propertyType: input.propertyType,
        isOwnerOccupied: input.isOwnerOccupied,
      });
      eligible = result.eligible;
      disqualifyReason = result.disqualifyReason;
      discounts = result.insuranceDiscounts;
      territory = result.territory;
      if (result.eligible) {
        programs.push({
          programName: result.programName,
          maxGrant: result.maxGrant,
          programUrl: 'https://strengthenalabamahomes.com',
          territory: result.territory,
          county: result.county ?? undefined,
          applicationMethod: 'First-come, first-served — windows open quarterly',
          notes: [
            'Work must NOT begin before grant approval.',
            'Certified FORTIFIED installer required (as of Nov 1, 2025).',
            'Grant does not cover evaluator cost.',
          ],
        });
        maxTotalGrant = result.maxGrant;
      }
      break;
    }

    case 'NC': {
      const result = checkNCEligibility({
        zipCode: input.zipCode,
        county: input.county,
        propertyType: input.propertyType,
        isOwnerOccupied: input.isOwnerOccupied,
        hasNCIUAPolicy: input.hasNCIUAPolicy,
      });
      eligible = result.eligible;
      disqualifyReason = result.disqualifyReason;
      territory = result.territory ?? undefined;
      if (result.eligible) {
        for (const p of result.programs) {
          programs.push({
            programName: p.programName,
            maxGrant: p.maxGrant,
            programUrl: p.programUrl,
            territory: result.territory ?? undefined,
            county: result.county ?? undefined,
            applicationMethod: 'First-come, first-served — limited annual funding',
            notes: result.notes,
          });
        }
        maxTotalGrant = result.maxGrant;
        generalNotes.push('💡 Income-qualified households (≤200% FPL) may be eligible for an additional $5,000 from the Clean Energy Fund of Carolinas.');
      }
      break;
    }

    case 'FL': {
      const result = checkFLEligibility({
        propertyType: input.propertyType,
        isOwnerOccupied: input.isOwnerOccupied,
        hasHomesteadExemption: input.hasHomesteadExemption,
        homeBuiltBefore2008: input.homeBuiltBefore2008,
        insuredValueUnder700k: input.insuredValueUnder700k,
        isLowModerateIncome: input.isLowModerateIncome,
      });
      eligible = result.eligible || result.conditional;
      disqualifyReason = result.disqualifyReason;
      if (result.eligible || result.conditional) {
        programs.push({
          programName: result.programName,
          maxGrant: result.maxGrant,
          programUrl: 'https://www.mysafeflhome.com',
          applicationMethod: 'First-come, first-served — 2:1 matching grant',
          notes: result.notes,
        });
        maxTotalGrant = result.maxGrant;
      }
      break;
    }

    case 'LA': {
      const result = checkLAEligibility({
        zipCode: input.zipCode,
        parish: input.parish ?? input.county,
        propertyType: input.propertyType,
        isOwnerOccupied: input.isOwnerOccupied,
      });
      eligible = result.eligible;
      disqualifyReason = result.disqualifyReason;
      if (result.eligible) {
        programs.push({
          programName: result.programName,
          maxGrant: result.maxGrant,
          programUrl: 'https://fortifyhomes.la.gov',
          parish: result.parish ?? undefined,
          applicationMethod: 'Random lottery — enter during open registration windows',
          notes: result.notes,
        });
        maxTotalGrant = result.maxGrant;
        generalNotes.push('💡 Louisiana also offers income tax credits for qualifying FORTIFIED retrofits.');
      }
      break;
    }

    case 'SC': {
      const result = checkSCEligibility({
        zipCode: input.zipCode,
        county: input.county,
        propertyType: input.propertyType,
        isOwnerOccupied: input.isOwnerOccupied,
      });
      eligible = result.eligible;
      disqualifyReason = result.disqualifyReason;
      if (result.eligible) {
        programs.push({
          programName: result.programName,
          maxGrant: result.maxGrant,
          programUrl: 'https://doi.sc.gov/safehome',
          county: result.county ?? undefined,
          applicationMethod: 'First-come, first-served — contact SC DOI for current windows',
          notes: result.notes,
        });
        maxTotalGrant = result.maxGrant;
      }
      break;
    }

    case 'OK': {
      const result = checkOKEligibility({
        propertyType: input.propertyType,
        isOwnerOccupied: input.isOwnerOccupied,
        hasHomesteadExemption: input.hasHomesteadExemption,
      });
      eligible = result.eligible;
      disqualifyReason = result.disqualifyReason;
      if (result.eligible) {
        programs.push({
          programName: result.programName,
          maxGrant: result.maxGrant,
          programUrl: 'https://oid.ok.gov/okready',
          applicationMethod: 'Periodic quarterly launches — fills quickly',
          notes: result.notes,
        });
        maxTotalGrant = result.maxGrant;
        discounts = { roof: { min: 25, max: 40 }, silver: { min: 35, max: 45 }, gold: { min: 40, max: 50 } };
      }
      break;
    }

    case 'MS': {
      const result = checkMSEligibility({
        zipCode: input.zipCode,
        county: input.county,
        propertyType: input.propertyType,
        isOwnerOccupied: input.isOwnerOccupied,
      });
      eligible = result.eligible;
      disqualifyReason = result.disqualifyReason;
      if (result.eligible) {
        programs.push({
          programName: result.programName,
          maxGrant: result.maxGrant,
          programUrl: 'https://www.mid.ms.gov/mississippi-insurance-department/preparedness/mitigation/smh/',
          county: result.county ?? undefined,
          applicationMethod: 'Periodic rounds — currently interest/registration only',
          notes: result.notes,
        });
        maxTotalGrant = result.maxGrant;
      }
      break;
    }

    case 'TX':
      eligible = false;
      disqualifyReason = 'Texas has no open state-administered FORTIFIED grant. The regional FHLB Dallas grant is exhausted, and previous legislative bills (HB 1576, HB 4354) have failed or not been enacted.';
      break;

    case 'ME':
      eligible = false;
      disqualifyReason = 'Fortify Maine Homes program is currently delayed until 2027. Once open, it will offer up to $15,000 for qualifying low-income residents and $10,000 for standard residents.';
      break;

    case 'KY':
      eligible = false;
      disqualifyReason = 'Strengthen Kentucky Homes currently has a status conflict — the homeowner login portal exists but the official launch date is pending. Verify directly at skh.ky.gov.';
      break;

    case 'AR':
      eligible = false;
      disqualifyReason = 'Strengthen Arkansas Homes is currently in the rules drafting stage. Funding, counties, and application portal details are TBD.';
      break;

    case 'CO':
      eligible = false;
      disqualifyReason = 'Strengthen Colorado Homes Enterprise was recently enacted but is currently pre-launch (awaiting board, rules, and revenue).';
      break;

    case 'MN':
      eligible = false;
      disqualifyReason = 'Strengthen Minnesota Homes pilot program is planned for early 2027 in select counties (Crow Wing, Hennepin, Morrison, Todd).';
      break;

    default:
      eligible = false;
      disqualifyReason = `No active FORTIFIED grant programs are currently mapped for ${state}. Insurance discounts may still be available from your carrier — contact your agent about FORTIFIED designation discounts.`;
      break;
  }

  const premium = input.annualPremium ?? 0;
  const estimatedAnnualSavings = {
    roof:   calcSavings(premium, discounts.roof),
    silver: calcSavings(premium, discounts.silver),
    gold:   calcSavings(premium, discounts.gold),
  };
  const est5yrSavings = estimatedAnnualSavings.roof * 5;

  return {
    state,
    eligible,
    programs,
    maxTotalGrant,
    insuranceDiscounts: discounts,
    estimatedAnnualSavings,
    est5yrSavings,
    disqualifyReason,
    generalNotes,
    territory,
  };
}

/** Extract state from US address string — simple heuristic */
export function detectStateFromAddress(address: string): string | null {
  const statePattern = /\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/i;
  const match = address.match(statePattern);
  return match ? match[1].toUpperCase() : null;
}

/** Extract zip code from US address string */
export function detectZipFromAddress(address: string): string | null {
  const zipPattern = /\b(\d{5})(?:-\d{4})?\b/;
  const match = address.match(zipPattern);
  return match ? match[1] : null;
}
