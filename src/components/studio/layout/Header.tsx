import { LogoutButton } from "@/components/shared/LogoutButton";

export function Header({
  userEmail,
  onMenuClick,
}: {
  userEmail?: string | null;
  onMenuClick?: () => void;
}) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--color-line)] bg-[var(--color-surface)] px-4 sm:px-6">
      <button
        onClick={onMenuClick}
        aria-label="Apri il menu"
        aria-controls="menu-studio"
        className="rounded-lg p-2 text-[var(--color-ink)] hover:bg-[var(--color-canvas)] lg:hidden"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      <div className="hidden lg:block" />
      <div className="flex items-center gap-4">
        {userEmail ? (
          <span className="hidden text-sm text-[var(--color-muted)] sm:inline">{userEmail}</span>
        ) : null}
        <LogoutButton />
      </div>
    </header>
  );
}
