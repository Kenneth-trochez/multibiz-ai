"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function getCurrentMembership(requiredBusinessId?: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  let query = supabase
    .from("business_members")
    .select("business_id, role, user_id")
    .eq("user_id", user.id);

  if (requiredBusinessId) {
    query = query.eq("business_id", requiredBusinessId);
  }

  const { data: membership, error: membershipError } = await query.maybeSingle();

  if (membershipError || !membership) {
    redirect("/dashboard/staff?error=No+tienes+acceso+al+negocio+actual");
  }

  return {
    supabase,
    user,
    membership,
  };
}

export async function createStaffAction(formData: FormData): Promise<void> {
  const businessId = String(formData.get("businessId") || "").trim();
  const displayName = String(formData.get("display_name") || "").trim();
  const roleId = String(formData.get("role_id") || "").trim();
  const specialty = String(formData.get("specialty") || "").trim();
  const email = normalizeEmail(String(formData.get("email") || ""));
  const activeValue = String(formData.get("active") || "");
  const active = activeValue === "on" || activeValue === "true";

  if (!businessId || !displayName) {
    redirect("/dashboard/staff?error=Nombre+y+negocio+son+obligatorios");
  }

  const { supabase, membership } = await getCurrentMembership(businessId);

  const { error } = await supabase.from("staff").insert({
    business_id: membership.business_id,
    display_name: displayName,
    role_id: roleId || null,
    specialty: specialty || null,
    email: email || null,
    active,
    invite_status: "none",
  });

  if (error) {
    redirect(`/dashboard/staff?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/staff");
  redirect("/dashboard/staff?success=created");
}

export async function createAndInviteStaffAction(formData: FormData): Promise<void> {
  const businessId = String(formData.get("businessId") || "").trim();
  const displayName = String(formData.get("display_name") || "").trim();
  const roleId = String(formData.get("role_id") || "").trim();
  const specialty = String(formData.get("specialty") || "").trim();
  const email = normalizeEmail(String(formData.get("email") || ""));
  const activeValue = String(formData.get("active") || "");
  const active = activeValue === "on" || activeValue === "true";

  if (!businessId || !displayName) {
    redirect("/dashboard/staff?error=Nombre+y+negocio+son+obligatorios");
  }

  if (!email) {
    redirect("/dashboard/staff?error=El+correo+es+obligatorio+para+invitar");
  }

  if (!roleId) {
    redirect("/dashboard/staff?error=Debes+asignar+un+rol+para+invitar");
  }

  const { supabase, user, membership } = await getCurrentMembership(businessId);

  if (membership.role !== "owner") {
    redirect("/dashboard/staff?error=Solo+el+owner+puede+invitar+staff");
  }

  const adminSupabase = createAdminClient();

  const { data: roleRow, error: roleError } = await supabase
    .from("roles")
    .select("id, business_id, name")
    .eq("id", roleId)
    .eq("business_id", membership.business_id)
    .maybeSingle();

  if (roleError || !roleRow) {
    redirect("/dashboard/staff?error=El+rol+seleccionado+no+es+válido");
  }

  const { data: existingStaffByEmail, error: existingStaffError } = await supabase
    .from("staff")
    .select("id, email, profile_user_id, invite_status")
    .eq("business_id", membership.business_id)
    .eq("email", email)
    .maybeSingle();

  if (existingStaffError) {
    redirect("/dashboard/staff?error=No+se+pudo+validar+el+staff+existente");
  }

  let finalStaffId = "";

  if (existingStaffByEmail) {
    const { error: updateExistingStaffError } = await supabase
      .from("staff")
      .update({
        display_name: displayName,
        specialty: specialty || null,
        role_id: roleId,
        email,
        active,
        invite_status: "pending",
      })
      .eq("id", existingStaffByEmail.id)
      .eq("business_id", membership.business_id);

    if (updateExistingStaffError) {
      redirect(`/dashboard/staff?error=${encodeURIComponent(updateExistingStaffError.message)}`);
    }

    finalStaffId = existingStaffByEmail.id;
  } else {
    const { data: insertedStaff, error: insertStaffError } = await supabase
      .from("staff")
      .insert({
        business_id: membership.business_id,
        display_name: displayName,
        role_id: roleId,
        specialty: specialty || null,
        email,
        active,
        invite_status: "pending",
      })
      .select("id")
      .single();

    if (insertStaffError || !insertedStaff) {
      redirect(`/dashboard/staff?error=${encodeURIComponent(insertStaffError?.message || "No se pudo crear el staff")}`);
    }

    finalStaffId = insertedStaff.id;
  }

  const { error: revokeOldInvitesError } = await supabase
    .from("staff_invitations")
    .update({
      status: "revoked",
    })
    .eq("business_id", membership.business_id)
    .eq("email", email)
    .eq("status", "pending");

  if (revokeOldInvitesError) {
    redirect(`/dashboard/staff?error=${encodeURIComponent(revokeOldInvitesError.message)}`);
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: invitation, error: invitationError } = await supabase
    .from("staff_invitations")
    .insert({
      business_id: membership.business_id,
      staff_id: finalStaffId,
      role_id: roleId,
      email,
      invited_by_user_id: user.id,
      status: "pending",
      expires_at: expiresAt,
    })
    .select("id, token")
    .single();

  if (invitationError || !invitation) {
    redirect(`/dashboard/staff?error=${encodeURIComponent(invitationError?.message || "No se pudo crear la invitación")}`);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    redirect("/dashboard/staff?error=Falta+configurar+NEXT_PUBLIC_APP_URL");
  }

  const redirectTo = `${appUrl}/auth/accept-invite?invitation=${invitation.token}`;

  const { error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: {
      business_id: membership.business_id,
      staff_id: finalStaffId,
      role_id: roleId,
      invitation_id: invitation.id,
    },
  });

  if (inviteError) {
    redirect(`/dashboard/staff?error=${encodeURIComponent(inviteError.message)}`);
  }

  revalidatePath("/dashboard/staff");
  redirect("/dashboard/staff?success=invited");
}

export async function updateStaffAction(formData: FormData): Promise<void> {
  const staffId = String(formData.get("staffId") || "").trim();
  const displayName = String(formData.get("display_name") || "").trim();
  const roleId = String(formData.get("role_id") || "").trim();
  const specialty = String(formData.get("specialty") || "").trim();
  const email = normalizeEmail(String(formData.get("email") || ""));
  const activeValue = String(formData.get("active") || "");
  const active = activeValue === "on" || activeValue === "true";

  if (!staffId || !displayName) {
    redirect("/dashboard/staff?error=Datos+incompletos");
  }

  const { supabase, membership } = await getCurrentMembership();

  const { error } = await supabase
    .from("staff")
    .update({
      display_name: displayName,
      role_id: roleId || null,
      specialty: specialty || null,
      email: email || null,
      active,
    })
    .eq("id", staffId)
    .eq("business_id", membership.business_id);

  if (error) {
    redirect(`/dashboard/staff?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/staff");
  redirect("/dashboard/staff?success=updated");
}

export async function deleteStaffAction(formData: FormData): Promise<void> {
  const staffId = String(formData.get("staffId") || "").trim();

  if (!staffId) {
    redirect("/dashboard/staff?error=Miembro+invalido");
  }

  const { supabase, membership } = await getCurrentMembership();

  const { error } = await supabase
    .from("staff")
    .delete()
    .eq("id", staffId)
    .eq("business_id", membership.business_id);

  if (error) {
    redirect(`/dashboard/staff?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/staff");
  redirect("/dashboard/staff?success=deleted");
}

export async function acceptStaffInvitationAction(formData: FormData): Promise<void> {
  const invitationToken = String(formData.get("invitationToken") || "").trim();

  if (!invitationToken) {
    redirect("/login?error=Invitación+inválida");
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect(`/login?error=Debes+iniciar+sesión+para+aceptar+la+invitación&next=${encodeURIComponent(`/auth/accept-invite?invitation=${invitationToken}`)}`);
  }

  const { data: invitation, error: invitationError } = await supabase
    .from("staff_invitations")
    .select(`
      id,
      business_id,
      staff_id,
      role_id,
      email,
      status,
      expires_at,
      accepted_at
    `)
    .eq("token", invitationToken)
    .maybeSingle();

  if (invitationError || !invitation) {
    redirect("/dashboard/staff?error=La+invitación+no+existe+o+es+inválida");
  }

  if (invitation.status !== "pending") {
    redirect("/dashboard/staff?error=La+invitación+ya+no+está+disponible");
  }

  const expiresAtMs = new Date(invitation.expires_at).getTime();
  if (Number.isNaN(expiresAtMs) || expiresAtMs < Date.now()) {
    await supabase
      .from("staff_invitations")
      .update({ status: "expired" })
      .eq("id", invitation.id);

    await supabase
      .from("staff")
      .update({ invite_status: "expired" })
      .eq("id", invitation.staff_id);

    redirect("/dashboard/staff?error=La+invitación+ha+expirado");
  }

  const userEmail = (user.email || "").trim().toLowerCase();
  const invitationEmail = (invitation.email || "").trim().toLowerCase();

  if (!userEmail || userEmail !== invitationEmail) {
    redirect("/dashboard/staff?error=Esta+invitación+no+corresponde+al+usuario+actual");
  }

  // Evitar duplicado en membership
  const { data: existingMembership, error: existingMembershipError } = await supabase
    .from("business_members")
    .select("business_id, user_id, role")
    .eq("business_id", invitation.business_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingMembershipError) {
    redirect(`/dashboard/staff?error=${encodeURIComponent(existingMembershipError.message)}`);
  }

  if (!existingMembership) {
    const { error: insertMembershipError } = await supabase
      .from("business_members")
      .insert({
        business_id: invitation.business_id,
        user_id: user.id,
        role: "staff",
      });

    if (insertMembershipError) {
      redirect(`/dashboard/staff?error=${encodeURIComponent(insertMembershipError.message)}`);
    }
  }

  if (invitation.staff_id) {
    const { error: updateStaffError } = await supabase
      .from("staff")
      .update({
        profile_user_id: user.id,
        invite_status: "accepted",
        email: invitationEmail,
      })
      .eq("id", invitation.staff_id)
      .eq("business_id", invitation.business_id);

    if (updateStaffError) {
      redirect(`/dashboard/staff?error=${encodeURIComponent(updateStaffError.message)}`);
    }
  }

  const { error: updateInvitationError } = await supabase
    .from("staff_invitations")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
    })
    .eq("id", invitation.id);

  if (updateInvitationError) {
    redirect(`/dashboard/staff?error=${encodeURIComponent(updateInvitationError.message)}`);
  }

  revalidatePath("/dashboard/staff");
  redirect("/dashboard?success=invite_accepted");
}