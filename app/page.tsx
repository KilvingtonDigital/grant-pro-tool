'use client';

import { useGrantStore } from '@/store/grantStore';
import AddressStep from '@/components/AddressStep';
import QualifyingStep from '@/components/QualifyingStep';
import ResultStep from '@/components/ResultStep';

const PRIMARY = '#166534';
const ACCENT  = '#16a34a';

const STEPS = [
  { id: 'address', label: 'Address',   num: 1 },
  { id: 'qualify', label: 'Questions', num: 2 },
  { id: 'result',  label: 'Results',   num: 3 },
] as const;

export default function Home() {
  const { step } = useGrantStore();
  const stepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="min-h-screen flex flex-col" style={{ '--primary': PRIMARY, '--accent': ACCENT } as React.CSSProperties}>
      {/* Header */}
      <header className="sticky top-0 z-40 shadow-md" style={{ background: PRIMARY }}>
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo / brand */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm"
              style={{ background: ACCENT }}
            >
              🛡️
            </div>
            <span className="text-white font-black text-base tracking-tight">GrantPro</span>
            <span className="hidden sm:inline text-white/50 text-xs">·</span>
            <span className="hidden sm:inline text-white/60 text-xs font-medium">FORTIFIED Grant Checker</span>
          </div>

          {/* Step badge */}
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/15 text-white">
            Step {stepIndex + 1} of {STEPS.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="max-w-2xl mx-auto px-4 pb-3">
          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className="h-1.5 rounded-full w-full transition-all duration-500"
                    style={{
                      background:
                        stepIndex > i
                          ? ACCENT
                          : stepIndex === i
                          ? `${ACCENT}88`
                          : 'rgba(255,255,255,0.2)',
                    }}
                  />
                  <span className="text-[10px] text-white/60 mt-1 font-medium hidden sm:block">
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && <div className="w-1" />}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 bg-slate-50">
        <div className="max-w-2xl mx-auto px-4 py-6 md:py-10">
          <div className="animate-fade-in" key={step}>
            {step === 'address' && <AddressStep />}
            {step === 'qualify' && <QualifyingStep />}
            {step === 'result'  && <ResultStep />}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center border-t border-slate-100 bg-white">
        <p className="text-xs text-slate-400">
          🛡️ <strong className="text-slate-500">GrantPro</strong> — FORTIFIED Grant Advisor ·
          Estimates are preliminary and subject to program availability ·{' '}
          <a
            href="https://ibhs.org/fortified"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-slate-600 transition-colors"
          >
            Learn about FORTIFIED
          </a>
        </p>
      </footer>
    </div>
  );
}
