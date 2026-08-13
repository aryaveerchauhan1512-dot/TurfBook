import React from 'react';
import { X, ShieldCheck, FileText } from 'lucide-react';

interface TOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
}

export const TermsOfServiceModal: React.FC<TOSModalProps> = ({
  isOpen,
  onClose,
  onAccept,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#2E7D32] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Terms of Service & Privacy Policy</h2>
              <p className="text-xs text-slate-500">Last updated: July 2026</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-600 leading-relaxed">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-3 text-xs text-emerald-800">
            <FileText className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              By registering on TurfBook as a User or Turf Owner, you agree to abide by our sports fair-play booking rules, slot cancellation policies, and data privacy standard.
            </span>
          </div>

          <h3 className="font-bold text-slate-800 text-base">1. Account Registration & Roles</h3>
          <p>
            TurfBook enforces strict separation between User Accounts and Turf Owner Accounts. Each user may hold only one active account role. Accounts attempting unauthorized access to owner or admin modules will be subject to account suspension.
          </p>

          <h3 className="font-bold text-slate-800 text-base">2. Booking Requests & Approval Workflow</h3>
          <p>
            Sending a booking request places a slot in <strong>Pending Approval</strong> state. The turf owner reserves the right to accept or decline the request within a reasonable timeframe. Upon owner approval, the slot transforms to <strong>Booked</strong> state, unlocking the owner contact details and payment QR code for payment settlement.
          </p>

          <h3 className="font-bold text-slate-800 text-base">3. Cancellation & Refund Policy</h3>
          <p>
            Users may cancel pending or approved booking requests up to 2 hours prior to the slot commencement time. Owners retain full authority to unbook or release slots in consultation with customers.
          </p>

          <h3 className="font-bold text-slate-800 text-base">4. Turf Owner Responsibilities & Media Verification</h3>
          <p>
            Turf owners must upload a minimum of 3 authentic images of their facility before listing publication. Owners are responsible for maintaining accurate pricing, slot availability, and responding to customer booking requests in good faith.
          </p>

          <h3 className="font-bold text-slate-800 text-base">5. Data Privacy & Encryption</h3>
          <p>
            Personal contact details including phone numbers and credentials are fully encrypted at rest using AES encryption. Phone numbers and payment QR codes are exclusively disclosed to verified customers upon booking approval.
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-xl transition-colors"
          >
            Close
          </button>
          {onAccept && (
            <button
              onClick={() => {
                onAccept();
                onClose();
              }}
              className="px-5 py-2 text-sm font-semibold text-white bg-[#2E7D32] hover:bg-[#1b4d1f] rounded-xl shadow-md transition-all"
            >
              I Accept & Agree
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
