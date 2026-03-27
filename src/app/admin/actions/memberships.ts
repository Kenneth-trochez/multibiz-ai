"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/auth/requirePlatformAdmin";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_ROLES = ["owner", "manager", "staff"] as const;
type AllowedRole = (typeof ALLOWED_ROLES)[number];

function isValidRole(value: string): value is AllowedRole {
  return ALLOWED_ROLES.includes(value as AllowedRole);
}

function revalidateAdminMembershipPages() {
  revalidatePath("/admin/users");
  revalidatePath("/admin/memberships");
  revalidatePath("/admin/businesses");
}

export async function createMembershipAction(formData: FormData): Promise<void> {
  await requirePlatformAdmin();

  const businessId = String(formData.get("businessId") || "").trim();
  const userId = String(formData.get("userId") || "").trim();
  const role = String(formData.get("role") || "").trim();

  if (!businessId || !userId || !role) {
    redirect("/admin/memberships?error=Datos+incompletos");
  }

  if (!isValidRole(role)) {
    redirect("/admin/memberships?error=Rol+invalido");
  }

  const supabase = createAdminClient();

  const { error } = await supabase.from("business_members").insert({
    business_id: businessId,
    user_id: userId,
    role,
  });

  if (error) {
    redirect(`/admin/memberships?error=${encodeURIComponent(error.message)}`);
  }

  revalidateAdminMembershipPages();
  redirect("/admin/memberships?success=membership_created");
}

export async function updateMembershipRoleAction(
  formData: FormData
): Promise<void> {
  await requirePlatformAdmin();

  const membershipId = String(formData.get("membershipId") || "").trim();
  const role = String(formData.get("role") || "").trim();

  if (!membershipId || !role) {
    redirect("/admin/memberships?error=Datos+incompletos");
  }

  if (!isValidRole(role)) {
    redirect("/admin/memberships?error=Rol+invalido");
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("business_members")
    .update({ role })
    .eq("id", membershipId);

  if (error) {
    redirect(`/admin/memberships?error=${encodeURIComponent(error.message)}`);
  }

  revalidateAdminMembershipPages();
  redirect("/admin/memberships?success=membership_updated");
}

export async function deleteMembershipAction(formData: FormData): Promise<void> {
  await requirePlatformAdmin();

  const membershipId = String(formData.get("membershipId") || "").trim();

  if (!membershipId) {
    redirect("/admin/memberships?error=Membership+invalido");
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("business_members")
    .delete()
    .eq("id", membershipId);

  if (error) {
    redirect(`/admin/memberships?error=${encodeURIComponent(error.message)}`);
  }

  revalidateAdminMembershipPages();
  redirect("/admin/memberships?success=membership_deleted");
}

export async function syncOwnerMembershipAction(
  formData: FormData
): Promise<void> {
  await requirePlatformAdmin();

  const businessId = String(formData.get("businessId") || "").trim();

  if (!businessId) {
    redirect("/admin/memberships?error=Negocio+invalido");
  }

  const supabase = createAdminClient();

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, owner_user_id")
    .eq("id", businessId)
    .maybeSingle();

  if (businessError || !business) {
    redirect("/admin/memberships?error=No+se+pudo+cargar+el+negocio");
  }

  const { data: existingMembership, error: membershipError } = await supabase
    .from("business_members")
    .select("id, role")
    .eq("business_id", business.id)
    .eq("user_id", business.owner_user_id)
    .maybeSingle();

  if (membershipError) {
    redirect(`/admin/memberships?error=${encodeURIComponent(membershipError.message)}`);
  }

  if (existingMembership) {
    const { error: updateError } = await supabase
      .from("business_members")
      .update({ role: "owner" })
      .eq("id", existingMembership.id);

    if (updateError) {
      redirect(`/admin/memberships?error=${encodeURIComponent(updateError.message)}`);
    }
  } else {
    const { error: insertError } = await supabase.from("business_members").insert({
      business_id: business.id,
      user_id: business.owner_user_id,
      role: "owner",
    });

    if (insertError) {
      redirect(`/admin/memberships?error=${encodeURIComponent(insertError.message)}`);
    }
  }

  revalidateAdminMembershipPages();
  redirect("/admin/memberships?success=owner_synced");
}