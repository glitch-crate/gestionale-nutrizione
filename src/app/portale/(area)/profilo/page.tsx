import { redirect } from "next/navigation";
import { getMyClientProfile } from "@/lib/queries/portale/profilo";
import { ProfileForm } from "@/components/portale/profilo/ProfileForm";

export default async function ProfiloPage() {
  const profile = await getMyClientProfile();

  if (!profile) {
    redirect("/portale/login");
  }

  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-display text-2xl text-[var(--color-ink)]">
        Il mio profilo
      </h1>
      <p className="mb-4 text-[15px] text-[var(--color-muted)]">
        Correggi i tuoi dati se non sono più aggiornati.
      </p>
      <ProfileForm
        firstName={profile.firstName}
        lastName={profile.lastName}
        phone={profile.phone}
        email={profile.email}
      />
    </div>
  );
}
