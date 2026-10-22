import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, X } from 'lucide-react';

export const AdvanceWarningModal = ({
  isOpen,
  onClose,
  onConfirm,
  advanceAmount,
  totalAmount,
  seatsCount,
  tourTitle
}) => {
  const [agreed, setAgreed] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-amber-500 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-6 h-6 text-amber-100" />
            <h3 className="font-bold text-lg">Seat Confirmation & Advance Policy</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-amber-600 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900 text-sm">
            <p className="font-semibold text-base mb-1 text-amber-950">
              ⚠️ 20% Advance Payment Required
            </p>
            <p className="leading-relaxed">
              To confirm and lock in your <strong className="font-semibold">{seatsCount} seat(s)</strong> for{' '}
              <strong className="font-semibold">"{tourTitle}"</strong>, an immediate 20% pre-registration advance is required.
            </p>
            <div className="mt-2 p-2.5 bg-amber-100/70 rounded-lg text-xs font-semibold text-amber-950 border border-amber-300/60">
              ⚠️ STRICT NOTICE: This 20% advance payment is NON-REFUNDABLE in the event of cancellation, as seats and transport arrangements are reserved exclusively for you.
            </div>
          </div>

          {/* Pricing summary */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Total Tour Cost ({seatsCount} seat{seatsCount > 1 ? 's' : ''}):</span>
              <span className="font-medium text-slate-900">₹{totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-emerald-700 font-semibold pt-1 border-t border-slate-200">
              <span>20% Advance Due Now:</span>
              <span className="text-lg">₹{advanceAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-500 text-xs">
              <span>Remaining 80% Balance (Pay before departure):</span>
              <span>₹{(totalAmount - advanceAmount).toLocaleString()}</span>
            </div>
          </div>

          {/* Agreement Checkbox */}
          <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            <span className="text-xs text-slate-700 leading-normal">
              I acknowledge and agree that seat confirmation requires paying a <strong>20% advance (₹{advanceAmount.toLocaleString()})</strong> and that this advance fee is <strong>strictly non-refundable</strong>.
            </span>
          </label>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
          >
            Review Details
          </button>
          <button
            type="button"
            disabled={!agreed}
            onClick={() => {
              if (agreed) onConfirm();
            }}
            className={`px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
              agreed
                ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-600/20'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Agree & Proceed
          </button>
        </div>
      </div>
    </div>
  );
};
