'use client';

import { useState } from 'react';
import { ArrowRight, ArrowLeft, AlertTriangle, Info, User, Mail, Phone } from 'lucide-react';
import { useGrantStore } from '@/store/grantStore';

const ACCENT  = '#16a34a';

const PROPERTY_TYPES = [
  { value: 'single_family', label: 'Single-Family Home', icon: '🏠', eligible: true },
  { value: 'townhome',      label: 'Townhome',           icon: '🏘️', eligible: false },
  { value: 'condo',         label: 'Condo / Apartment',  icon: '🏢', eligible: false },
  { value: 'mobile',        label: 'Mobile / Manufactured', icon: '🚐', eligible: false },
  { value: 'rental',        label: 'Rental Property',    icon: '🔑', eligible: false },
];

const PREMIUM_RANGES = [
  { value: 800,  label: 'Under $1,000/yr' },
  { value: 1250, label: '$1,000 – $1,500/yr' },
  { value: 1750, label: '$1,500 – $2,000/yr' },
  { value: 2500, label: '$2,000 – $3,000/yr' },
  { value: 3500, label: '$3,000 – $4,000/yr' },
  { value: 5000, label: '$4,000+/yr' },
];

type Screen = 'property' | 'insurance' | 'contact';

export default function QualifyingStep() {
  const { geocode, answers, contact, setAnswer, setContact, setStep, setGrantResult } = useGrantStore();
  const [screen, setScreen] = useState<Screen>('property');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const state = geocode?.state ?? '';
  const isEligibleType = PROPERTY_TYPES.find((p) => p.value === answers.propertyType)?.eligible ?? false;

  // ── Validate contact before running analysis ────────────────────────────────
  const validateContact = () => {
    const errs: Record<string, string> = {};
    if (!contact.firstName.trim()) errs.firstName = 'First name is required';
    if (!contact.lastName.trim())  errs.lastName  = 'Last name is required';
    if (!contact.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
      errs.email = 'Valid email is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRunAnalysis = () => {
    if (!validateContact()) return;
    // Persist the result and navigate to results screen
    // (actual engine call happens in ResultStep for animated UX)
    setGrantResult(null); // clear any stale result
    setStep('result');
  };

  // ── Screen A: Property ──────────────────────────────────────────────────────
  if (screen === 'property') {
    const canContinue = answers.propertyType !== '' && answers.isOwnerOccupied !== null;
    return (
      <div className="animate-slide-up">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🏠</div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">About Your Property</h2>
          <p className="text-slate-500 text-sm">
            This helps us confirm your eligibility and find the right grant programs for you.
          </p>
        </div>

        {/* Property Type */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-700 mb-3">
            What type of property is this?
          </label>
          <div className="space-y-2">
            {PROPERTY_TYPES.map((pt) => (
              <button
                key={pt.value}
                type="button"
                onClick={() => setAnswer('propertyType', pt.value)}
                className="w-full text-left px-4 py-3 rounded-xl border-2 flex items-center gap-3 transition-all"
                style={{
                  borderColor: answers.propertyType === pt.value ? ACCENT : '#e2e8f0',
                  background:  answers.propertyType === pt.value ? `${ACCENT}08` : 'white',
                }}
              >
                <span className="text-xl">{pt.icon}</span>
                <span className="text-sm font-medium text-slate-700 flex-1">{pt.label}</span>
                {!pt.eligible && <span className="text-xs text-red-400 font-semibold">Not eligible</span>}
                {pt.eligible  && <span className="text-xs text-green-600 font-semibold">✓ Eligible</span>}
              </button>
            ))}
          </div>

          {!isEligibleType && answers.propertyType && (
            <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-700">
                FORTIFIED grant programs are currently limited to single-family, owner-occupied primary residences.
                You may still qualify for insurance premium discounts.
              </p>
            </div>
          )}
        </div>

        {/* Owner-Occupied */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-700 mb-3">
            Is this your primary residence?
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: true,  label: 'Yes — I live here',         icon: '✅' },
              { value: false, label: 'No — rental/investment',    icon: '❌' },
            ].map((opt) => (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => setAnswer('isOwnerOccupied', opt.value)}
                className="px-4 py-3 rounded-xl border-2 flex items-center gap-2 transition-all text-sm font-medium"
                style={{
                  borderColor: answers.isOwnerOccupied === opt.value ? ACCENT : '#e2e8f0',
                  background:  answers.isOwnerOccupied === opt.value ? `${ACCENT}08` : 'white',
                  color: '#334155',
                }}
              >
                <span>{opt.icon}</span> {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* State-specific: FL — home age */}
        {state === 'FL' && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-2 mb-3">
              <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
              <p className="text-sm font-bold text-blue-800">Florida — additional questions</p>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-blue-700 mb-2 font-medium">Was the original building permit issued before January 1, 2008?</p>
                <div className="grid grid-cols-2 gap-2">
                  {[{ value: true, label: 'Yes (pre-2008)' }, { value: false, label: 'No (2008 or newer)' }].map((opt) => (
                    <button key={String(opt.value)} type="button"
                      onClick={() => setAnswer('homeBuiltBefore2008', opt.value)}
                      className="px-3 py-2 rounded-lg border-2 text-xs font-semibold transition-all"
                      style={{
                        borderColor: answers.homeBuiltBefore2008 === opt.value ? '#3b82f6' : '#bfdbfe',
                        background:  answers.homeBuiltBefore2008 === opt.value ? '#eff6ff' : 'white',
                        color: '#1e40af',
                      }}
                    >{opt.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-blue-700 mb-2 font-medium">Is the home insured for $700,000 or less?</p>
                <div className="grid grid-cols-2 gap-2">
                  {[{ value: true, label: 'Yes (≤$700k)' }, { value: false, label: 'No (>$700k)' }].map((opt) => (
                    <button key={String(opt.value)} type="button"
                      onClick={() => setAnswer('insuredValueUnder700k', opt.value)}
                      className="px-3 py-2 rounded-lg border-2 text-xs font-semibold transition-all"
                      style={{
                        borderColor: answers.insuredValueUnder700k === opt.value ? '#3b82f6' : '#bfdbfe',
                        background:  answers.insuredValueUnder700k === opt.value ? '#eff6ff' : 'white',
                        color: '#1e40af',
                      }}
                    >{opt.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-blue-700 mb-2 font-medium">Is this a low or moderate income household?</p>
                <div className="grid grid-cols-2 gap-2">
                  {[{ value: true, label: 'Yes' }, { value: false, label: 'No / Not sure' }].map((opt) => (
                    <button key={String(opt.value)} type="button"
                      onClick={() => setAnswer('isLowModerateIncome', opt.value)}
                      className="px-3 py-2 rounded-lg border-2 text-xs font-semibold transition-all"
                      style={{
                        borderColor: answers.isLowModerateIncome === opt.value ? '#3b82f6' : '#bfdbfe',
                        background:  answers.isLowModerateIncome === opt.value ? '#eff6ff' : 'white',
                        color: '#1e40af',
                      }}
                    >{opt.label}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* OK — homestead */}
        {state === 'OK' && (
          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Do you have an Oklahoma Homestead Exemption on file with your county assessor?
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[{ value: true, label: 'Yes' }, { value: false, label: 'No / Not sure' }].map((opt) => (
                <button key={String(opt.value)} type="button"
                  onClick={() => setAnswer('hasHomesteadExemption', opt.value)}
                  className="px-4 py-2.5 rounded-xl border-2 text-sm font-medium text-slate-700 transition-all"
                  style={{
                    borderColor: answers.hasHomesteadExemption === opt.value ? ACCENT : '#e2e8f0',
                    background:  answers.hasHomesteadExemption === opt.value ? `${ACCENT}08` : 'white',
                  }}
                >{opt.label}</button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setStep('address')}
            className="flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all text-sm"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <button
            type="button"
            onClick={() => setScreen('insurance')}
            disabled={!canContinue}
            className="flex-1 py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: ACCENT }}
          >
            Continue <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  // ── Screen B: Insurance ─────────────────────────────────────────────────────
  if (screen === 'insurance') {
    return (
      <div className="animate-slide-up">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">📋</div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Insurance Information</h2>
          <p className="text-slate-500 text-sm">
            This lets us calculate your potential insurance premium savings — usually the most valuable part.
          </p>
        </div>

        {/* Annual Premium */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-700 mb-1.5">
            Approximate annual homeowners insurance premium
          </label>
          <p className="text-xs text-slate-400 mb-2">Check your policy declaration page for this number.</p>
          <div className="grid grid-cols-2 gap-2">
            {PREMIUM_RANGES.map((pr) => (
              <button
                key={pr.value}
                type="button"
                onClick={() => setAnswer('annualPremium', pr.value)}
                className="px-3 py-2.5 rounded-xl border-2 text-sm font-medium text-slate-700 transition-all text-left"
                style={{
                  borderColor: answers.annualPremium === pr.value ? ACCENT : '#e2e8f0',
                  background:  answers.annualPremium === pr.value ? `${ACCENT}08` : 'white',
                }}
              >
                {pr.label}
              </button>
            ))}
          </div>
        </div>

        {/* NC-specific: NCIUA Policy */}
        {state === 'NC' && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-2 mb-3">
              <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-blue-800 mb-1">Important for NC residents</p>
                <p className="text-xs text-blue-700 mb-3">
                  NC Strengthen Your Roof grants require an active NC Beach Plan (NCIUA) policy.
                  Does your policy include NC Beach Plan coverage?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[{ value: true, label: 'Yes — NC Beach Plan' }, { value: false, label: 'No / Not sure' }].map((opt) => (
                    <button key={String(opt.value)} type="button"
                      onClick={() => setAnswer('hasNCIUAPolicy', opt.value)}
                      className="px-3 py-2 rounded-lg border-2 text-xs font-semibold transition-all"
                      style={{
                        borderColor: answers.hasNCIUAPolicy === opt.value ? '#3b82f6' : '#bfdbfe',
                        background:  answers.hasNCIUAPolicy === opt.value ? '#eff6ff' : 'white',
                        color: '#1e40af',
                      }}
                    >{opt.label}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FL-specific: Homestead */}
        {state === 'FL' && (
          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Do you have a Florida Homestead Exemption on file?
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[{ value: true, label: 'Yes' }, { value: false, label: 'No / Not sure' }].map((opt) => (
                <button key={String(opt.value)} type="button"
                  onClick={() => setAnswer('hasHomesteadExemption', opt.value)}
                  className="px-4 py-2.5 rounded-xl border-2 text-sm font-medium text-slate-700 transition-all"
                  style={{
                    borderColor: answers.hasHomesteadExemption === opt.value ? ACCENT : '#e2e8f0',
                    background:  answers.hasHomesteadExemption === opt.value ? `${ACCENT}08` : 'white',
                  }}
                >{opt.label}</button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setScreen('property')}
            className="flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all text-sm"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <button
            type="button"
            onClick={() => setScreen('contact')}
            className="flex-1 py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 text-sm"
            style={{ background: ACCENT }}
          >
            Continue <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  // ── Screen C: Contact ───────────────────────────────────────────────────────
  return (
    <div className="animate-slide-up">
      <div className="text-center mb-8">
        <div className="text-4xl mb-3">📬</div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Your Contact Details</h2>
        <p className="text-slate-500 text-sm">
          We'll email your full grant estimate report and notify a certified FORTIFIED inspector who can assist with your application.
        </p>
      </div>

      <div className="space-y-4 mb-6">
        {/* First name */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">First Name *</label>
          <div className="relative">
            <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={contact.firstName}
              onChange={(e) => { setContact('firstName', e.target.value); setErrors((p) => ({ ...p, firstName: '' })); }}
              placeholder="Jane"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none transition-all"
              style={{ borderColor: errors.firstName ? '#ef4444' : undefined }}
            />
          </div>
          {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
        </div>

        {/* Last name */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">Last Name *</label>
          <div className="relative">
            <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={contact.lastName}
              onChange={(e) => { setContact('lastName', e.target.value); setErrors((p) => ({ ...p, lastName: '' })); }}
              placeholder="Smith"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none transition-all"
              style={{ borderColor: errors.lastName ? '#ef4444' : undefined }}
            />
          </div>
          {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">Email Address *</label>
          <div className="relative">
            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              value={contact.email}
              onChange={(e) => { setContact('email', e.target.value); setErrors((p) => ({ ...p, email: '' })); }}
              placeholder="jane@example.com"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none transition-all"
              style={{ borderColor: errors.email ? '#ef4444' : undefined }}
            />
          </div>
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
        </div>

        {/* Phone (optional) */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">
            Phone Number <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <div className="relative">
            <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="tel"
              value={contact.phone}
              onChange={(e) => setContact('phone', e.target.value)}
              placeholder="(555) 000-0000"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none transition-all"
            />
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400 text-center mb-5">
        🔒 Your information is never sold or shared. Used only to deliver your grant report and connect you with a FORTIFIED inspector.
      </p>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setScreen('insurance')}
          className="flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all text-sm"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <button
          type="button"
          onClick={handleRunAnalysis}
          className="flex-1 py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 text-sm"
          style={{ background: `linear-gradient(135deg, #166534, ${ACCENT})` }}
        >
          Run Grant Analysis <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
