import { PrivacyContent } from "@/components/shared/privacy/PrivacyContent";

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col gap-5 px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="font-display text-2xl text-[var(--color-ink)]">
        Informativa privacy
      </h1>
      <PrivacyContent />
    </main>
  );
}
