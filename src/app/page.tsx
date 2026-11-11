import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

// Smistamento iniziale: il professionista va al gestionale, il cliente al portale.
export default async function RootPage() {
  const { user, professional } = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  redirect(professional ? "/dashboard" : "/portale/prenota");
}
