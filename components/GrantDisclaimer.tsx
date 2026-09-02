import { AlertTriangle } from 'lucide-react';

export default function GrantDisclaimer() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 my-4">
      <div className="flex items-start gap-2">
        <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
        <div className="text-xs text-amber-800 leading-relaxed">
          <span className="font-bold">Legal Disclaimer:</span> This is a preliminary, non-guaranteed estimate
          based on publicly available program data. Grant eligibility, funding availability, and insurance
          discounts are determined by state programs and your insurance carrier — not by GrantPro or any
          roofing contractor. A state-certified FORTIFIED Evaluator must perform an initial evaluation
          before any work begins. Grant pre-approval is required before construction starts.
          Estimates are subject to change without notice.
        </div>
      </div>
    </div>
  );
}
