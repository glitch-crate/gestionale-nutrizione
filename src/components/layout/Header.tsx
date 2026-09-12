import { LogoutButton } from "@/components/layout/LogoutButton";

export function Header({ userEmail }: { userEmail?: string | null }) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--color-line)] bg-[var(--color-surface)] px-6">
      <div />
      <div className="flex items-center gap-4">
        {userEmail ? (
          <span className="text-sm text-[var(--color-muted)]">{userEmail}</span>
        ) : null}
        <LogoutButton />
      </div>
    </header>
  );
}
