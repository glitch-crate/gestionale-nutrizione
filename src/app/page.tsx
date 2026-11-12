import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Smistamento iniziale: il professionista va al gestionale, il cliente al
// portale. Le due aree hanno sessioni separate, quindi controlliamo entrambe.
export default async function RootPage() {
  const studio = await createClient("studio");
  const { data: studioClaims } = await studio.auth.getClaims();
  if (studioClaims?.claims?.sub) {
    const { data: professional } = await studio
      .from("professionals")
      .select("id")
      .eq("auth_user_id", studioClaims.claims.sub)
      .maybeSingle();
    if (professional) redirect("/dashboard");
  }

  const portale = await createClient("portale");
  const { data: portaleClaims } = await portale.auth.getClaims();
  if (portaleClaims?.claims?.sub) redirect("/portale/prenota");

  redirect("/login");
}
