import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requirePlatformAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data: platformAdmin, error } = await supabase
    .from("platform_admins")
    .select("id, user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !platformAdmin) {
    redirect("/dashboard");
  }

  return {
    user,
    platformAdmin,
  };
}