import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: professional } = await supabase
    .from("professionals")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  redirect(professional ? "/dashboard" : "/portale/prenota");
}
