"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type DiscountType = "fixed" | "percent";

function revalidateServicePages() {
  revalidatePath("/dashboard/services");
  revalidatePath("/dashboard/appointments");
  revalidatePath("/dashboard/balance");
}

function redirectWithError(message: string): never {
  redirect(`/dashboard/services?error=${encodeURIComponent(message)}`);
}

function mapServiceError(message: string) {
  const lower = message.toLowerCase();

  if (
    lower.includes("violates foreign key constraint") &&
    lower.includes("appointments_service_id_fkey")
  ) {
    return "Este servicio no puede eliminarse porque ya está asociado a citas registradas. Puedes desactivarlo para dejar de usarlo sin perder el historial.";
  }

  return "No se pudo procesar el servicio. Revisa los datos e intenta de nuevo.";
}

function normalizeDiscountType(value: string): DiscountType {
  return value === "fixed" ? "fixed" : "percent";
}

function parseServicePayload(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const priceRaw = String(formData.get("price") || "").trim();
  const durationRaw = String(formData.get("duration") || "").trim();
  const activeValue = String(formData.get("active") || "");
  const active = activeValue === "on" || activeValue === "true";

  const discountEnabledValue = String(formData.get("discount_enabled") || "");
  const discountEnabled =
    discountEnabledValue === "on" || discountEnabledValue === "true";

  const discountName = String(formData.get("discount_name") || "").trim();
  const discountType = normalizeDiscountType(
    String(formData.get("discount_type") || "percent")
  );
  const discountValueRaw = String(formData.get("discount_value") || "").trim();

  const price = Number(priceRaw || 0);
  const duration = Number(durationRaw || 0);
  const discountValue = Number(discountValueRaw || 0);

  if (!name) {
    redirectWithError("El nombre del servicio es obligatorio.");
  }

  if (Number.isNaN(price) || price < 0) {
    redirectWithError("El precio no es válido.");
  }

  if (Number.isNaN(duration) || duration <= 0) {
    redirectWithError("La duración no es válida.");
  }

  if (discountEnabled) {
    if (!discountName) {
      redirectWithError("Indica el nombre del descuento.");
    }

    if (Number.isNaN(discountValue) || discountValue <= 0) {
      redirectWithError("El valor del descuento no es válido.");
    }

    if (discountType === "percent" && discountValue > 100) {
      redirectWithError("El descuento por porcentaje no puede ser mayor a 100%.");
    }

    if (discountType === "fixed" && discountValue > price) {
      redirectWithError("El descuento fijo no puede ser mayor que el precio normal.");
    }
  }

  return {
    name,
    description: description || null,
    price,
    duration_minutes: duration,
    active,
    discount_enabled: discountEnabled,
    discount_name: discountEnabled ? discountName : null,
    discount_type: discountEnabled ? discountType : null,
    discount_value: discountEnabled ? discountValue : 0,
  };
}

export async function createServiceAction(formData: FormData): Promise<void> {
  const businessId = String(formData.get("businessId") || "").trim();

  if (!businessId) {
    redirectWithError("Negocio inválido.");
  }

  const payload = parseServicePayload(formData);
  const supabase = await createClient();

  const { error } = await supabase.from("services").insert({
    business_id: businessId,
    ...payload,
  });

  if (error) {
    redirectWithError(mapServiceError(error.message));
  }

  revalidateServicePages();
  redirect("/dashboard/services?success=created");
}

export async function updateServiceAction(formData: FormData): Promise<void> {
  const serviceId = String(formData.get("serviceId") || "").trim();

  if (!serviceId) {
    redirectWithError("Faltan datos del servicio.");
  }

  const payload = parseServicePayload(formData);
  const supabase = await createClient();

  const { error } = await supabase
    .from("services")
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", serviceId);

  if (error) {
    redirectWithError(mapServiceError(error.message));
  }

  revalidateServicePages();
  redirect("/dashboard/services?success=updated");
}

export async function deactivateServiceAction(formData: FormData): Promise<void> {
  const serviceId = String(formData.get("serviceId") || "").trim();

  if (!serviceId) {
    redirectWithError("Servicio inválido.");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("services")
    .update({
      active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", serviceId);

  if (error) {
    redirectWithError("No se pudo desactivar el servicio.");
  }

  revalidateServicePages();
  redirect("/dashboard/services?success=deactivated");
}

export async function reactivateServiceAction(formData: FormData): Promise<void> {
  const serviceId = String(formData.get("serviceId") || "").trim();

  if (!serviceId) {
    redirectWithError("Servicio inválido.");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("services")
    .update({
      active: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", serviceId);

  if (error) {
    redirectWithError("No se pudo reactivar el servicio.");
  }

  revalidateServicePages();
  redirect("/dashboard/services?success=reactivated");
}

export async function deleteServiceAction(formData: FormData): Promise<void> {
  const serviceId = String(formData.get("serviceId") || "").trim();

  if (!serviceId) {
    redirectWithError("Servicio inválido.");
  }

  const supabase = await createClient();

  const { count: appointmentsCount, error: relationError } = await supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("service_id", serviceId);

  if (relationError) {
    redirectWithError("No se pudo verificar si el servicio tiene historial relacionado.");
  }

  const total = appointmentsCount || 0;

  if (total > 0) {
    redirectWithError(
      `Este servicio no puede eliminarse porque está asociado a ${total} cita${
        total === 1 ? "" : "s"
      } registrada${total === 1 ? "" : "s"}. Puedes desactivarlo para dejar de usarlo sin perder el historial.`
    );
  }

  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", serviceId);

  if (error) {
    redirectWithError(mapServiceError(error.message));
  }

  revalidateServicePages();
  redirect("/dashboard/services?success=deleted");
}
