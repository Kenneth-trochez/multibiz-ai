import { createClient } from "@/lib/supabase/server";
import { normalizeAppRole, type AppRole } from "@/lib/auth/permissions";

type BusinessRow = {
  id: string;
  name: string;
  slug: string;
  business_type: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  default_icon: string;
  phone: string | null;
  address: string | null;
  theme: string;
};

export async function getCurrentBusiness() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: membership, error: membershipError } = await supabase
    .from("business_members")
    .select("business_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (membershipError || !membership) {
    return null;
  }

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select(
      "id, name, slug, business_type, logo_url, primary_color, secondary_color, default_icon, phone, address, theme"
    )
    .eq("id", membership.business_id)
    .maybeSingle<BusinessRow>();

  if (businessError || !business) {
    return null;
  }

  return {
    user,
    role: normalizeAppRole(membership.role) as AppRole,
    business,
  };
}