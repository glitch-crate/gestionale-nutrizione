export function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-4">
      <p className="text-sm text-[var(--color-muted)]">{label}</p>
      <p className="mt-1.5 font-figures text-3xl text-[var(--color-ink)]">
        {value}
      </p>
    </div>
  );
}
