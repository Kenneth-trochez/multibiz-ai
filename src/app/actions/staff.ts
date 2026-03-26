"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type AccessRole = "manager" | "staff";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeAccessRole(role: string): AccessRole {
  return role === "manager" ? "manager" : "staff";
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

export async function createStaffUserAction(formData: FormData): Promise<void> {
  const businessId = String(formData.get("businessId") || "").trim();
  const displayName = String(formData.get("display_name") || "").trim();
  const roleId = String(formData.get("role_id") || "").trim();
  const specialty = String(formData.get("specialty") || "").trim();
  const email = normalizeEmail(String(formData.get("email") || ""));
  const password = String(formData.get("password") || "").trim();
  const accessRole = normalizeAccessRole(String(formData.get("access_role") || "staff"));
  const activeValue = String(formData.get("active") || "");
  const active = activeValue === "on" || activeValue === "true";

  if (!businessId || !displayName) {
    redirect("/dashboard/staff?error=Nombre+y+negocio+son+obligatorios");
  }

  if (!email) {
    redirect("/dashboard/staff?error=El+correo+es+obligatorio+para+crear+una+cuenta");
  }

  if (!password || password.length < 6) {
    redirect("/dashboard/staff?error=La+contraseña+debe+tener+al+menos+6+caracteres");
  }

  const { supabase, membership } = await getCurrentMembership(businessId);

  if (membership.role !== "owner") {
    redirect("/dashboard/staff?error=Solo+el+owner+puede+crear+cuentas+de+empleados");
  }

  if (roleId) {
    const { data: roleRow, error: roleError } = await supabase
      .from("roles")
      .select("id, business_id")
      .eq("id", roleId)
      .eq("business_id", membership.business_id)
      .maybeSingle();

    if (roleError || !roleRow) {
      redirect("/dashboard/staff?error=El+rol+operativo+seleccionado+no+es+válido");
    }
  }

  const { data: existingStaffByEmail, error: existingStaffError } = await supabase
    .from("staff")
    .select("id, email, profile_user_id")
    .eq("business_id", membership.business_id)
    .eq("email", email)
    .maybeSingle();

  if (existingStaffError) {
    redirect("/dashboard/staff?error=No+se+pudo+validar+el+staff+existente");
  }

  if (existingStaffByEmail?.profile_user_id) {
    redirect("/dashboard/staff?error=Ese+staff+ya+tiene+una+cuenta+vinculada");
  }

  const adminSupabase = createAdminClient();

  const { data: createdUserData, error: createUserError } =
    await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: displayName,
      },
    });

  if (createUserError || !createdUserData.user) {
    redirect(
      `/dashboard/staff?error=${encodeURIComponent(
        createUserError?.message || "No se pudo crear el usuario en Auth"
      )}`
    );
  }

  const createdUser = createdUserData.user;

  try {
    if (existingStaffByEmail) {
      const { error: updateStaffError } = await supabase
        .from("staff")
        .update({
          display_name: displayName,
          role_id: roleId || null,
          specialty: specialty || null,
          email,
          active,
          profile_user_id: createdUser.id,
          invite_status: "accepted",
        })
        .eq("id", existingStaffByEmail.id)
        .eq("business_id", membership.business_id);

      if (updateStaffError) {
        throw new Error(updateStaffError.message);
      }
    } else {
      const { error: insertStaffError } = await supabase
        .from("staff")
        .insert({
          business_id: membership.business_id,
          display_name: displayName,
          role_id: roleId || null,
          specialty: specialty || null,
          email,
          active,
          profile_user_id: createdUser.id,
          invite_status: "accepted",
        });

      if (insertStaffError) {
        throw new Error(insertStaffError.message);
      }
    }

    const { error: insertMembershipError } = await supabase
      .from("business_members")
      .insert({
        business_id: membership.business_id,
        user_id: createdUser.id,
        role: accessRole,
      });

    if (insertMembershipError) {
      throw new Error(insertMembershipError.message);
    }
  } catch (error: any) {
    await adminSupabase.auth.admin.deleteUser(createdUser.id);
    redirect(
      `/dashboard/staff?error=${encodeURIComponent(
        error?.message || "No se pudo completar la creación de la cuenta"
      )}`
    );
  }

  revalidatePath("/dashboard/staff");
  redirect("/dashboard/staff?success=user_created");
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
      redirect(
        `/dashboard/staff?error=${encodeURIComponent(updateExistingStaffError.message)}`
      );
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
      redirect(
        `/dashboard/staff?error=${encodeURIComponent(
          insertStaffError?.message || "No se pudo crear el staff"
        )}`
      );
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
    redirect(
      `/dashboard/staff?error=${encodeURIComponent(
        invitationError?.message || "No se pudo crear la invitación"
      )}`
    );
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

  const { supabase, user, membership } = await getCurrentMembership();

  if (membership.role !== "owner") {
    redirect("/dashboard/staff?error=Solo+el+owner+puede+eliminar+cuentas+de+empleados");
  }

  const adminSupabase = createAdminClient();

  const { data: staffRow, error: staffError } = await supabase
    .from("staff")
    .select("id, business_id, display_name, profile_user_id")
    .eq("id", staffId)
    .eq("business_id", membership.business_id)
    .maybeSingle();

  if (staffError || !staffRow) {
    redirect("/dashboard/staff?error=No+se+pudo+encontrar+el+staff");
  }

  const profileUserId = staffRow.profile_user_id;

  if (profileUserId && profileUserId === user.id) {
    redirect("/dashboard/staff?error=No+puedes+eliminar+tu+propia+cuenta+desde+staff");
  }

  // Si tiene cuenta vinculada, revisamos su membership
  if (profileUserId) {
    const { data: targetMembership, error: targetMembershipError } = await supabase
      .from("business_members")
      .select("business_id, user_id, role")
      .eq("business_id", membership.business_id)
      .eq("user_id", profileUserId)
      .maybeSingle();

    if (targetMembershipError) {
      redirect(`/dashboard/staff?error=${encodeURIComponent(targetMembershipError.message)}`);
    }

    if (targetMembership?.role === "owner") {
      redirect("/dashboard/staff?error=No+puedes+eliminar+otro+owner");
    }
  }

  try {
    // 1) borrar membership del negocio actual
    if (profileUserId) {
      const { error: deleteMembershipError } = await supabase
        .from("business_members")
        .delete()
        .eq("business_id", membership.business_id)
        .eq("user_id", profileUserId);

      if (deleteMembershipError) {
        throw new Error(deleteMembershipError.message);
      }
    }

    // 2) borrar el staff
    const { error: deleteStaffError } = await supabase
      .from("staff")
      .delete()
      .eq("id", staffId)
      .eq("business_id", membership.business_id);

    if (deleteStaffError) {
      throw new Error(deleteStaffError.message);
    }

    // 3) borrar invitaciones asociadas a ese staff o email dentro del negocio
    const { error: deleteInvitationsError } = await supabase
      .from("staff_invitations")
      .delete()
      .eq("business_id", membership.business_id)
      .eq("staff_id", staffId);

    if (deleteInvitationsError) {
      throw new Error(deleteInvitationsError.message);
    }

    // 4) si tenía cuenta vinculada, revisar si aún pertenece a otros negocios
    if (profileUserId) {
      const { count: remainingMemberships, error: remainingMembershipsError } =
        await supabase
          .from("business_members")
          .select("*", { count: "exact", head: true })
          .eq("user_id", profileUserId);

      if (remainingMembershipsError) {
        throw new Error(remainingMembershipsError.message);
      }

      // Solo borramos auth.users si ya no pertenece a ningún negocio
      if ((remainingMemberships || 0) === 0) {
        const { error: deleteUserError } =
          await adminSupabase.auth.admin.deleteUser(profileUserId);

        if (deleteUserError) {
          throw new Error(deleteUserError.message);
        }
      }
    }
  } catch (error: any) {
    redirect(
      `/dashboard/staff?error=${encodeURIComponent(
        error?.message || "No se pudo eliminar el empleado"
      )}`
    );
  }

  revalidatePath("/dashboard/staff");
  redirect("/dashboard/staff?success=deleted");
}