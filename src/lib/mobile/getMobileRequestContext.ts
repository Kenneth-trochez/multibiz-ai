import { createClient } from "@supabase/supabase-js";
import { normalizeAppRole, type AppRole, hasSectionAccess } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

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

export async function getMobileRequestContext(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";

  if (!token) {
    throw new Error("Unauthorized");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase env vars");
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !user) {
    throw new Error("Unauthorized");
  }

  const admin = createAdminClient();

  const { data: membership, error: membershipError } = await admin
    .from("business_members")
    .select("business_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (membershipError || !membership) {
    throw new Error("Business membership not found");
  }

  const role = normalizeAppRole(membership.role) as AppRole;

  if (!hasSectionAccess(role, "appointments")) {
    throw new Error("Forbidden");
  }

  const { data: business, error: businessError } = await admin
    .from("businesses")
    .select(
      "id, name, slug, business_type, logo_url, primary_color, secondary_color, default_icon, phone, address, theme"
    )
    .eq("id", membership.business_id)
    .maybeSingle<BusinessRow>();

  if (businessError || !business) {
    throw new Error("Business not found");
  }

  return {
    user,
    role,
    business,
    token,
  };
}