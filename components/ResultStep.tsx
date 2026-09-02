'use client';

import { useEffect, useState } from 'react';
import {
  CheckCircle, XCircle, AlertCircle, TrendingDown,
  DollarSign, ArrowRight, Send, ExternalLink, RefreshCw,
} from 'lucide-react';
import { useGrantStore } from '@/store/grantStore';
import { checkGrantEligibility } from '@/lib/fortifiedGrants';
import GrantDisclaimer from './GrantDisclaimer';

const PRIMARY = '#166534';
const ACCENT  = '#16a34a';

const ANALYSIS_STEPS = [
  { label: 'Verifying property address...', delay: 600 },
  { label: 'Checking state grant programs...', delay: 1200 },
  { label: 'Analyzing county/territory eligibility...', delay: 1900 },
  { label: 'Calculating insurance discount ranges...', delay: 2500 },
  { label: 'Computing 5-year savings projection...', delay: 3100 },
];

export default function ResultStep() {
  const {
    geocode, answers, contact, grantResult, setGrantResult, submitted, setSubmitted, setStep,
  } = useGrantStore();

  const [phase, setPhase] = useState<'analyzing' | 'done'>('analyzing');
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');

  // Run engine + animation on mount
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    ANALYSIS_STEPS.forEach((step, i) => {
      timers.push(setTimeout(() => setCompletedSteps((prev) => [...prev, i]), step.delay));
    });

    timers.push(setTimeout(() => {
      const result = checkGrantEligibility({
        state:               geocode?.state ?? 'XX',
        zipCode:             geocode?.zipCode ?? '',
        county:              geocode?.county ?? undefined,
        propertyType:        answers.propertyType,
        isOwnerOccupied:     answers.isOwnerOccupied ?? false,
        annualPremium:       answers.annualPremium ?? 0,
        hasNCIUAPolicy:      answers.hasNCIUAPolicy ?? undefined,
        hasHomesteadExemption: answers.hasHomesteadExemption ?? undefined,
        homeBuiltBefore2008: answers.homeBuiltBefore2008 ?? undefined,
        insuredValueUnder700k: answers.insuredValueUnder700k ?? undefined,
        isLowModerateIncome: answers.isLowModerateIncome ?? undefined,
      });
      setGrantResult(result);
    }, 2900));

    timers.push(setTimeout(() => setPhase('done'), 3500));
    return () => timers.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-send lead to notify route once results are ready
  useEffect(() => {
    if (phase !== 'done' || !grantResult || submitted) return;

    const sendLead = async () => {
      setIsSending(true);
      try {
        await fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName:    contact.firstName,
            lastName:     contact.lastName,
            email:        contact.email,
            phone:        contact.phone || undefined,
            address:      geocode?.formattedAddress ?? '',
            lat:          geocode?.lat,
            lng:          geocode?.lng,
            state:        geocode?.state,
            county:       geocode?.county,
            zipCode:      geocode?.zipCode,
            propertyType: answers.propertyType,
            isOwnerOccupied: answers.isOwnerOccupied,
            annualPremium:   answers.annualPremium,
            hasNCIUAPolicy:  answers.hasNCIUAPolicy,
            hasHomesteadExemption: answers.hasHomesteadExemption,
            homeBuiltBefore2008:   answers.homeBuiltBefore2008,
            insuredValueUnder700k: answers.insuredValueUnder700k,
            isLowModerateIncome:   answers.isLowModerateIncome,
            eligible:       grantResult.eligible,
            maxTotalGrant:  grantResult.maxTotalGrant,
            programs:       grantResult.programs.map((p) => ({
              programName: p.programName,
              maxGrant:    p.maxGrant,
              programUrl:  p.programUrl,
            })),
            est5yrSavings:    grantResult.est5yrSavings,
            disqualifyReason: grantResult.disqualifyReason,
            submittedAt:      new Date().toISOString(),
          }),
        });
        setSubmitted(true);
      } catch {
        setSendError('Unable to send lead. Please try again.');
      } finally {
        setIsSending(false);
      }
    };

    sendLead();
  }, [phase, grantResult]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Analyzing phase ─────────────────────────────────────────────────────────
  if (phase === 'analyzing') {
    return (
      <div className="animate-slide-up">
        <div className="text-center mb-10">
          <div
            className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center relative"
            style={{ background: `linear-gradient(135deg, ${PRIMARY}20, ${ACCENT}30)` }}
          >
            <div
              className="w-20 h-20 rounded-full border-4 border-transparent animate-spin absolute"
              style={{ borderTopColor: ACCENT, borderRightColor: `${ACCENT}40` }}
            />
            <span className="text-3xl">🛡️</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Analyzing Your Eligibility</h2>
          <p className="text-slate-500 text-sm">Checking grant programs and calculating your savings...</p>
        </div>

        <div className="space-y-3">
          {ANALYSIS_STEPS.map((step, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-500"
              style={{
                background:   completedSteps.includes(i) ? `${ACCENT}08` : '#f8fafc',
                borderColor:  completedSteps.includes(i) ? `${ACCENT}40` : '#e2e8f0',
              }}
            >
              {completedSteps.includes(i) ? (
                <CheckCircle size={16} style={{ color: ACCENT }} />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-slate-300 animate-pulse" />
              )}
              <span className={`text-sm ${completedSteps.includes(i) ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!grantResult) return null;

  const hasGrant   = grantResult.eligible && grantResult.maxTotalGrant > 0;
  const premium    = answers.annualPremium ?? 0;
  const roofSavings   = grantResult.estimatedAnnualSavings.roof;
  const silverSavings = grantResult.estimatedAnnualSavings.silver;

  // ── Results phase ───────────────────────────────────────────────────────────
  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="text-center mb-6">
        {hasGrant ? (
          <>
            <div className="text-5xl mb-3">🎉</div>
            <h2 className="text-2xl font-black text-slate-900 mb-1">Great News!</h2>
            <p className="text-slate-500 text-sm">You likely qualify for FORTIFIED grants and insurance savings.</p>
          </>
        ) : (
          <>
            <div className="text-5xl mb-3">📋</div>
            <h2 className="text-2xl font-black text-slate-900 mb-1">Your Analysis Results</h2>
            <p className="text-slate-500 text-sm">Here's what we found based on your property details.</p>
          </>
        )}
      </div>

      {/* Grant Programs */}
      {hasGrant ? (
        <div className="space-y-3 mb-6">
          {grantResult.programs.map((prog, i) => (
            <div
              key={i}
              className="rounded-2xl p-5 border"
              style={{ background: `${ACCENT}08`, borderColor: `${ACCENT}40` }}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle size={16} style={{ color: ACCENT }} />
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: ACCENT }}>
                      Grant Identified
                    </p>
                  </div>
                  <h3 className="font-black text-slate-900 text-base">{prog.programName}</h3>
                  {(prog.territory ?? prog.county ?? prog.parish) && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      {prog.territory ?? prog.county ?? prog.parish}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-black" style={{ color: ACCENT }}>
                    Up to ${prog.maxGrant.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-400">estimated grant</p>
                </div>
              </div>
              {prog.applicationMethod && (
                <p className="text-xs text-slate-500 bg-white/70 rounded-lg px-3 py-2 border border-slate-100">
                  📅 {prog.applicationMethod}
                </p>
              )}
              {prog.programUrl && (
                <a
                  href={prog.programUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold mt-2"
                  style={{ color: ACCENT }}
                >
                  Official program website <ExternalLink size={11} />
                </a>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl p-5 border border-slate-200 bg-slate-50 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-slate-800 mb-1">Grant Eligibility: Needs Verification</h3>
              <p className="text-sm text-slate-600">{grantResult.disqualifyReason}</p>
            </div>
          </div>
        </div>
      )}

      {/* Insurance Savings */}
      {premium > 0 && (roofSavings > 0 || silverSavings > 0) && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm mb-6 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <TrendingDown size={16} style={{ color: ACCENT }} />
            <p className="text-sm font-bold text-slate-700">Projected Insurance Savings</p>
          </div>
          <div className="divide-y divide-slate-50">
            {[
              { level: 'FORTIFIED Roof™',   discount: grantResult.insuranceDiscounts.roof,   annual: roofSavings },
              { level: 'FORTIFIED Silver™',  discount: grantResult.insuranceDiscounts.silver, annual: silverSavings },
              { level: 'FORTIFIED Gold™',    discount: grantResult.insuranceDiscounts.gold,   annual: grantResult.estimatedAnnualSavings.gold },
            ].map((row) => (
              <div key={row.level} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{row.level}</p>
                  <p className="text-xs text-slate-400">{row.discount.min}–{row.discount.max}% off wind premium (est.)</p>
                </div>
                <div className="text-right">
                  <p className="font-black" style={{ color: ACCENT }}>~${row.annual.toLocaleString()}/yr</p>
                  <p className="text-xs text-slate-400">~${(row.annual * 5).toLocaleString()} over 5 yrs</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5-Year Total Value */}
      {hasGrant && grantResult.est5yrSavings > 0 && (
        <div
          className="rounded-2xl p-5 mb-6"
          style={{ background: `linear-gradient(135deg, ${PRIMARY}ee, ${ACCENT}dd)` }}
        >
          <div className="flex items-center gap-3 text-white">
            <DollarSign size={24} className="shrink-0" />
            <div>
              <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-0.5">
                Estimated Total Value (Grant + 5-yr Insurance Savings)
              </p>
              <p className="text-3xl font-black">
                ${(grantResult.maxTotalGrant + grantResult.est5yrSavings).toLocaleString()}
              </p>
              <p className="text-white/60 text-xs mt-0.5">
                ${grantResult.maxTotalGrant.toLocaleString()} grant + ~${grantResult.est5yrSavings.toLocaleString()} insurance savings
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Inspector CTA */}
      <div
        className="rounded-2xl p-5 mb-4 border-2"
        style={{
          background:   hasGrant ? `linear-gradient(135deg, ${PRIMARY}08, ${ACCENT}08)` : '#f8fafc',
          borderColor:  hasGrant ? ACCENT : '#e2e8f0',
        }}
      >
        <div className="flex items-start gap-3 mb-4">
          <span className="text-2xl mt-0.5">{hasGrant ? '🏛️' : '📐'}</span>
          <div>
            <p className="font-black text-slate-900 text-sm mb-0.5">
              {hasGrant ? 'Forward to a Certified FORTIFIED Inspector' : 'Connect With a FORTIFIED Professional'}
            </p>
            <p className="text-xs text-slate-500">
              {hasGrant
                ? `A certified FORTIFIED Inspector will contact you to begin the pre-approval process for your $${grantResult.maxTotalGrant.toLocaleString()} grant. Grant pre-approval must happen before any work begins.`
                : 'A FORTIFIED professional can review your specific situation and advise on insurance discounts and future grant opportunities.'}
            </p>
          </div>
        </div>

        {submitted ? (
          <div
            className="w-full py-3 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2"
            style={{ background: PRIMARY }}
          >
            <CheckCircle size={16} /> Inspector Notified — We'll be in touch soon!
          </div>
        ) : isSending ? (
          <div className="w-full py-3 rounded-xl bg-slate-100 text-slate-500 text-sm font-bold flex items-center justify-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-slate-300 animate-spin" style={{ borderTopColor: ACCENT }} />
            Sending your results...
          </div>
        ) : (
          <button
            onClick={() => {
              setIsSending(true);
              // Trigger resend if auto-send failed
              fetch('/api/notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  firstName: contact.firstName, lastName: contact.lastName,
                  email: contact.email, phone: contact.phone || undefined,
                  address: geocode?.formattedAddress ?? '', lat: geocode?.lat, lng: geocode?.lng,
                  state: geocode?.state, county: geocode?.county, zipCode: geocode?.zipCode,
                  propertyType: answers.propertyType, isOwnerOccupied: answers.isOwnerOccupied,
                  annualPremium: answers.annualPremium, eligible: grantResult.eligible,
                  maxTotalGrant: grantResult.maxTotalGrant,
                  programs: grantResult.programs.map((p) => ({ programName: p.programName, maxGrant: p.maxGrant, programUrl: p.programUrl })),
                  est5yrSavings: grantResult.est5yrSavings, disqualifyReason: grantResult.disqualifyReason,
                  submittedAt: new Date().toISOString(),
                }),
              }).then(() => { setSubmitted(true); setSendError(''); })
                .catch(() => setSendError('Send failed. Please try again.'))
                .finally(() => setIsSending(false));
            }}
            className="w-full py-3 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all"
            style={{ background: hasGrant ? `linear-gradient(135deg, ${PRIMARY}, ${ACCENT})` : PRIMARY }}
          >
            <Send size={15} /> {hasGrant ? 'Connect Me With a Grant Inspector →' : 'Request a FORTIFIED Consultation →'}
          </button>
        )}

        {sendError && <p className="text-xs text-red-500 text-center mt-2">{sendError}</p>}
      </div>

      {/* Additional notes */}
      {grantResult.generalNotes.length > 0 && (
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 mb-4">
          <p className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Program Notes</p>
          <ul className="space-y-1">
            {grantResult.generalNotes.map((note, i) => (
              <li key={i} className="text-xs text-slate-500">{note}</li>
            ))}
          </ul>
        </div>
      )}

      <GrantDisclaimer />

      {/* Start over */}
      <button
        onClick={() => {
          setStep('address');
        }}
        className="w-full mt-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
      >
        <RefreshCw size={14} /> Check another property
      </button>
    </div>
  );
}
