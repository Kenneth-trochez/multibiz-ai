"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createServiceAction(formData: FormData): Promise<void> {
  const businessId = String(formData.get("businessId") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const durationMinutes = Number(formData.get("duration_minutes") || 0);
  const price = Number(formData.get("price") || 0);
  const activeValue = String(formData.get("is_active") || "");
  const active = activeValue === "on" || activeValue === "true";

  if (!businessId || !name) {
    redirect("/dashboard/services?error=Nombre+y+negocio+son+obligatorios");
  }

  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    redirect("/dashboard/services?error=La+duracion+debe+ser+mayor+que+0");
  }

  if (!Number.isFinite(price) || price < 0) {
    redirect("/dashboard/services?error=El+precio+no+puede+ser+negativo");
  }

  const supabase = await createClient();

  const { error } = await supabase.from("services").insert({
    business_id: businessId,
    name,
    description: description || null,
    duration_minutes: durationMinutes,
    price,
    active,
  });

  if (error) {
    redirect(`/dashboard/services?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/services");
  redirect("/dashboard/services?success=created");
}

export async function updateServiceAction(formData: FormData): Promise<void> {
  const serviceId = String(formData.get("serviceId") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const durationMinutes = Number(formData.get("duration_minutes") || 0);
  const price = Number(formData.get("price") || 0);
  const activeValue = String(formData.get("is_active") || "");
  const active = activeValue === "on" || activeValue === "true";

  if (!serviceId || !name) {
    redirect("/dashboard/services?error=Datos+incompletos");
  }

  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    redirect("/dashboard/services?error=La+duracion+debe+ser+mayor+que+0");
  }

  if (!Number.isFinite(price) || price < 0) {
    redirect("/dashboard/services?error=El+precio+no+puede+ser+negativo");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("services")
    .update({
      name,
      description: description || null,
      duration_minutes: durationMinutes,
      price,
      active,
    })
    .eq("id", serviceId);

  if (error) {
    redirect(`/dashboard/services?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/services");
  redirect("/dashboard/services?success=updated");
}

export async function deleteServiceAction(formData: FormData): Promise<void> {
  const serviceId = String(formData.get("serviceId") || "").trim();

  if (!serviceId) {
    redirect("/dashboard/services?error=Servicio+invalido");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", serviceId);

  if (error) {
    redirect(`/dashboard/services?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/services");
  redirect("/dashboard/services?success=deleted");
}