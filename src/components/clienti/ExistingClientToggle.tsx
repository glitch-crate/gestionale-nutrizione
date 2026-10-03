"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setExistingClientFlagAction } from "@/lib/actions/clients";

export function ExistingClientToggle({
  clientId,
  initialValue,
}: {
  clientId: string;
  initialValue: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    const next = !value;
    setLoading(true);
    const result = await setExistingClientFlagAction(clientId, next);
    setLoading(false);

    if (result.success) {
      setValue(next);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
      <div className="min-w-0">
        <p className="text-[15px] font-medium text-[var(--color-ink)]">
          Cliente già seguito in studio
        </p>
        <p className="text-sm text-[var(--color-muted)]">
          Se attivo, il portale gli propone direttamente lo slot da "Controllo" (20&apos;),
          anche se non ha ancora nessun appuntamento registrato nel sistema.
        </p>
      </div>
      <button
        onClick={handleToggle}
        disabled={loading}
        aria-pressed={value}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${
          value ? "bg-[var(--color-accent)]" : "bg-[var(--color-line)]"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
            value ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
