"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createStaffAction(formData: FormData): Promise<void> {
  const businessId = String(formData.get("businessId") || "").trim();
  const displayName = String(formData.get("display_name") || "").trim();
  const roleId = String(formData.get("role_id") || "").trim();
  const specialty = String(formData.get("specialty") || "").trim();
  const activeValue = String(formData.get("active") || "");
  const active = activeValue === "on" || activeValue === "true";

  if (!businessId || !displayName) {
    redirect("/dashboard/staff?error=Nombre+y+negocio+son+obligatorios");
  }

  const supabase = await createClient();

  const { error } = await supabase.from("staff").insert({
    business_id: businessId,
    display_name: displayName,
    role_id: roleId || null,
    specialty: specialty || null,
    active,
  });

  if (error) {
    redirect(`/dashboard/staff?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/staff");
  redirect("/dashboard/staff?success=created");
}

export async function updateStaffAction(formData: FormData): Promise<void> {
  const staffId = String(formData.get("staffId") || "").trim();
  const displayName = String(formData.get("display_name") || "").trim();
  const roleId = String(formData.get("role_id") || "").trim();
  const specialty = String(formData.get("specialty") || "").trim();
  const activeValue = String(formData.get("active") || "");
  const active = activeValue === "on" || activeValue === "true";

  if (!staffId || !displayName) {
    redirect("/dashboard/staff?error=Datos+incompletos");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("staff")
    .update({
      display_name: displayName,
      role_id: roleId || null,
      specialty: specialty || null,
      active,
    })
    .eq("id", staffId);

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

  const supabase = await createClient();

  const { error } = await supabase.from("staff").delete().eq("id", staffId);

  if (error) {
    redirect(`/dashboard/staff?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/staff");
  redirect("/dashboard/staff?success=deleted");
}