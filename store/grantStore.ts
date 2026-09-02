import { create } from 'zustand';
import type { FortifiedGrantResult } from '@/lib/fortifiedGrants';

export type AppStep = 'address' | 'qualify' | 'result';

export interface GrantAnswers {
  propertyType: string;
  isOwnerOccupied: boolean | null;
  annualPremium: number | null;
  hasNCIUAPolicy: boolean | null;
  hasHomesteadExemption: boolean | null;
  homeBuiltBefore2008: boolean | null;
  insuredValueUnder700k: boolean | null;
  isLowModerateIncome: boolean | null;
}

export interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress: string;
  state: string;
  zipCode: string;
  county: string;
  city: string;
}

interface GrantStore {
  // Navigation
  step: AppStep;
  setStep: (step: AppStep) => void;

  // Address
  inputAddress: string;
  setInputAddress: (v: string) => void;
  geocode: GeocodeResult | null;
  setGeocode: (g: GeocodeResult | null) => void;
  satelliteUrl: string | null;
  setSatelliteUrl: (url: string | null) => void;
  addressConfirmed: boolean;
  setAddressConfirmed: (v: boolean) => void;

  // Qualifying answers
  answers: GrantAnswers;
  setAnswer: <K extends keyof GrantAnswers>(key: K, value: GrantAnswers[K]) => void;

  // Contact (collected at end of qualifying step)
  contact: ContactInfo;
  setContact: <K extends keyof ContactInfo>(key: K, value: string) => void;

  // Results
  grantResult: FortifiedGrantResult | null;
  setGrantResult: (r: FortifiedGrantResult | null) => void;

  // Submission
  submitted: boolean;
  setSubmitted: (v: boolean) => void;

  // Reset
  reset: () => void;
}

const DEFAULT_ANSWERS: GrantAnswers = {
  propertyType: '',
  isOwnerOccupied: null,
  annualPremium: null,
  hasNCIUAPolicy: null,
  hasHomesteadExemption: null,
  homeBuiltBefore2008: null,
  insuredValueUnder700k: null,
  isLowModerateIncome: null,
};

const DEFAULT_CONTACT: ContactInfo = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
};

export const useGrantStore = create<GrantStore>((set) => ({
  step: 'address',
  setStep: (step) => set({ step }),

  inputAddress: '',
  setInputAddress: (inputAddress) => set({ inputAddress }),

  geocode: null,
  setGeocode: (geocode) => set({ geocode }),

  satelliteUrl: null,
  setSatelliteUrl: (satelliteUrl) => set({ satelliteUrl }),

  addressConfirmed: false,
  setAddressConfirmed: (addressConfirmed) => set({ addressConfirmed }),

  answers: { ...DEFAULT_ANSWERS },
  setAnswer: (key, value) =>
    set((state) => ({ answers: { ...state.answers, [key]: value } })),

  contact: { ...DEFAULT_CONTACT },
  setContact: (key, value) =>
    set((state) => ({ contact: { ...state.contact, [key]: value } })),

  grantResult: null,
  setGrantResult: (grantResult) => set({ grantResult }),

  submitted: false,
  setSubmitted: (submitted) => set({ submitted }),

  reset: () =>
    set({
      step: 'address',
      inputAddress: '',
      geocode: null,
      satelliteUrl: null,
      addressConfirmed: false,
      answers: { ...DEFAULT_ANSWERS },
      contact: { ...DEFAULT_CONTACT },
      grantResult: null,
      submitted: false,
    }),
}));
