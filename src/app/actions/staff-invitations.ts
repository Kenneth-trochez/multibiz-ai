"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type InviteStaffInput = {
  staffId?: string | null;
  displayName: string;
  email: string;
  specialty?: string | null;
  roleId: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function inviteStaff(input: InviteStaffInput) {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const displayName = input.displayName.trim();
  const email = normalizeEmail(input.email);
  const specialty = input.specialty?.trim() || null;
  const roleId = input.roleId;
  const staffId = input.staffId ?? null;

  if (!displayName) {
    throw new Error("El nombre del staff es requerido.");
  }

  if (!email) {
    throw new Error("El correo es requerido para enviar invitación.");
  }

  if (!roleId) {
    throw new Error("El rol es requerido.");
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("No se pudo validar la sesión.");
  }

  // 1) Obtener membership actual del usuario autenticado
  const { data: membership, error: membershipError } = await supabase
    .from("business_members")
    .select("business_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError) {
    throw new Error("No se pudo obtener la membresía del negocio.");
  }

  if (!membership) {
    throw new Error("Tu usuario no pertenece a ningún negocio.");
  }

  // Opcional: si quieres que solo owner invite
  if (membership.role !== "owner") {
    throw new Error("Solo el owner puede invitar staff.");
  }

  const businessId = membership.business_id;

  // 2) Validar que el role_id pertenezca al mismo negocio
  const { data: roleRow, error: roleError } = await supabase
    .from("roles")
    .select("id, business_id, name")
    .eq("id", roleId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (roleError) {
    throw new Error("No se pudo validar el rol.");
  }

  if (!roleRow) {
    throw new Error("El rol seleccionado no pertenece a este negocio.");
  }

  // 3) Revisar si ya existe un staff con ese email en este negocio
  const { data: existingStaffByEmail, error: existingStaffError } = await supabase
    .from("staff")
    .select("id, business_id, email, profile_user_id, invite_status")
    .eq("business_id", businessId)
    .eq("email", email)
    .maybeSingle();

  if (existingStaffError) {
    throw new Error("No se pudo validar si el staff ya existe.");
  }

  let finalStaffId = staffId;

  // 4) Si vino staffId, actualizamos ese registro
  if (staffId) {
    const { data: currentStaff, error: currentStaffError } = await supabase
      .from("staff")
      .select("id, business_id, email, profile_user_id")
      .eq("id", staffId)
      .eq("business_id", businessId)
      .maybeSingle();

    if (currentStaffError) {
      throw new Error("No se pudo validar el staff seleccionado.");
    }

    if (!currentStaff) {
      throw new Error("El staff no existe en este negocio.");
    }

    // evitar que otro staff del mismo negocio ya use ese email
    if (existingStaffByEmail && existingStaffByEmail.id !== staffId) {
      throw new Error("Ya existe otro staff con ese correo en este negocio.");
    }

    const { error: updateStaffError } = await supabase
      .from("staff")
      .update({
        display_name: displayName,
        email,
        specialty,
        role_id: roleId,
        invite_status: "pending",
      })
      .eq("id", staffId)
      .eq("business_id", businessId);

    if (updateStaffError) {
      throw new Error("No se pudo actualizar el staff antes de invitar.");
    }

    finalStaffId = staffId;
  } else {
    // 5) Si no vino staffId, y ya existe uno por email, lo reutilizamos
    if (existingStaffByEmail) {
      const { error: reuseStaffError } = await supabase
        .from("staff")
        .update({
          display_name: displayName,
          specialty,
          role_id: roleId,
          invite_status: "pending",
        })
        .eq("id", existingStaffByEmail.id)
        .eq("business_id", businessId);

      if (reuseStaffError) {
        throw new Error("No se pudo actualizar el staff existente.");
      }

      finalStaffId = existingStaffByEmail.id;
    } else {
      const { data: insertedStaff, error: insertStaffError } = await supabase
        .from("staff")
        .insert({
          business_id: businessId,
          display_name: displayName,
          email,
          specialty,
          active: true,
          role_id: roleId,
          invite_status: "pending",
        })
        .select("id")
        .single();

      if (insertStaffError || !insertedStaff) {
        throw new Error("No se pudo crear el staff.");
      }

      finalStaffId = insertedStaff.id;
    }
  }

  if (!finalStaffId) {
    throw new Error("No se pudo resolver el staff a invitar.");
  }

  // 6) Revocar invitaciones pendientes anteriores para ese email en ese negocio
  const { error: revokeOldInvitesError } = await supabase
    .from("staff_invitations")
    .update({
      status: "revoked",
    })
    .eq("business_id", businessId)
    .eq("email", email)
    .eq("status", "pending");

  if (revokeOldInvitesError) {
    throw new Error("No se pudieron revocar invitaciones anteriores.");
  }

  // 7) Crear invitación interna
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: invitation, error: invitationError } = await supabase
    .from("staff_invitations")
    .insert({
      business_id: businessId,
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
    throw new Error("No se pudo crear la invitación interna.");
  }

  // 8) Enviar invitación por Supabase Auth
  const inviteRedirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/auth/accept-invite?invitation=${invitation.token}`;

  const { error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: inviteRedirectTo,
    data: {
      business_id: businessId,
      staff_id: finalStaffId,
      role_id: roleId,
      invitation_id: invitation.id,
    },
  });

  if (inviteError) {
    throw new Error(`No se pudo enviar el correo de invitación: ${inviteError.message}`);
  }

  revalidatePath("/dashboard/staff");

  return {
    ok: true,
    message: "Invitación enviada correctamente.",
  };
}