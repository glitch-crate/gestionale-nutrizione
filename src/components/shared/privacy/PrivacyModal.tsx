"use client";

import { PrivacyContent } from "@/components/shared/privacy/PrivacyContent";

// `onAccept`: il pulsante in fondo ("Ho letto…") vale come accettazione.
export function PrivacyModal({ onClose, onAccept }: { onClose: () => void; onAccept?: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Informativa privacy"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full flex-col rounded-t-xl bg-[var(--color-surface)] sm:max-h-[80vh] sm:max-w-lg sm:rounded-xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-line)] px-5 py-4">
          <h2 className="font-display text-lg text-[var(--color-ink)]">
            Informativa privacy
          </h2>
          <button
            onClick={onClose}
            aria-label="Chiudi"
            className="rounded-lg p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-canvas)] hover:text-[var(--color-ink)]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <PrivacyContent />
        </div>

        <div className="shrink-0 border-t border-[var(--color-line)] p-4">
          <button
            onClick={onAccept ?? onClose}
            className="w-full rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-[15px] font-medium text-white hover:bg-[var(--color-accent-hover)]"
          >
            {onAccept ? "Ho letto e accetto" : "Ho letto, continua la registrazione"}
          </button>
        </div>
      </div>
    </div>
  );
}
