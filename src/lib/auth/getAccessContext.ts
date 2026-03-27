import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getAccessContext() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const [{ data: membership }, { data: platformAdmin }] = await Promise.all([
    supabase
      .from("business_members")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle(),

    supabase
      .from("platform_admins")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  return {
    user,
    hasBusinessAccess: !!membership,
    isPlatformAdmin: !!platformAdmin,
  };
}