"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function revalidateCustomerPages() {
  revalidatePath("/dashboard/customers");
  revalidatePath("/dashboard/appointments");
  revalidatePath("/dashboard/sales");
}

function redirectWithError(message: string): never {
  redirect(`/dashboard/customers?error=${encodeURIComponent(message)}`);
}

function mapCustomerError(message: string) {
  const lower = message.toLowerCase();

  if (lower.includes("violates foreign key constraint") && lower.includes("appointments_customer_id_fkey")) {
    return "Este cliente no puede eliminarse porque tiene citas registradas. Puedes desactivarlo para dejar de usarlo sin perder el historial.";
  }

  return "No se pudo procesar el cliente. Revisa los datos e intenta de nuevo.";
}

export async function createCustomerAction(formData: FormData): Promise<void> {
  const businessId = String(formData.get("businessId") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!businessId || !name) {
    redirectWithError("El nombre del cliente es obligatorio.");
  }

  const supabase = await createClient();

  const { error } = await supabase.from("customers").insert({
    business_id: businessId,
    name,
    phone: phone || null,
    email: email || null,
    address: address || null,
    notes: notes || null,
    active: true,
  });

  if (error) {
    redirectWithError(mapCustomerError(error.message));
  }

  revalidateCustomerPages();
  redirect("/dashboard/customers?success=created");
}

export async function updateCustomerAction(formData: FormData): Promise<void> {
  const customerId = String(formData.get("customerId") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  const activeValue = String(formData.get("active") || "");
  const active = activeValue === "on" || activeValue === "true";

  if (!customerId || !name) {
    redirectWithError("Faltan datos del cliente.");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("customers")
    .update({
      name,
      phone: phone || null,
      email: email || null,
      address: address || null,
      notes: notes || null,
      active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", customerId);

  if (error) {
    redirectWithError(mapCustomerError(error.message));
  }

  revalidateCustomerPages();
  redirect("/dashboard/customers?success=updated");
}

export async function deactivateCustomerAction(formData: FormData): Promise<void> {
  const customerId = String(formData.get("customerId") || "").trim();

  if (!customerId) {
    redirectWithError("Cliente inválido.");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("customers")
    .update({
      active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", customerId);

  if (error) {
    redirectWithError("No se pudo desactivar el cliente.");
  }

  revalidateCustomerPages();
  redirect("/dashboard/customers?success=deactivated");
}

export async function reactivateCustomerAction(formData: FormData): Promise<void> {
  const customerId = String(formData.get("customerId") || "").trim();

  if (!customerId) {
    redirectWithError("Cliente inválido.");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("customers")
    .update({
      active: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", customerId);

  if (error) {
    redirectWithError("No se pudo reactivar el cliente.");
  }

  revalidateCustomerPages();
  redirect("/dashboard/customers?success=reactivated");
}

export async function deleteCustomerAction(formData: FormData): Promise<void> {
  const customerId = String(formData.get("customerId") || "").trim();

  if (!customerId) {
    redirectWithError("Cliente inválido.");
  }

  const supabase = await createClient();

  const [{ count: appointmentsCount, error: appointmentsError }, { count: salesCount, error: salesError }] =
    await Promise.all([
      supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("customer_id", customerId),

      supabase
        .from("sales")
        .select("*", { count: "exact", head: true })
        .eq("customer_id", customerId),
    ]);

  if (appointmentsError || salesError) {
    redirectWithError("No se pudo verificar si el cliente tiene historial relacionado.");
  }

  const appointmentsTotal = appointmentsCount || 0;
  const salesTotal = salesCount || 0;

  if (appointmentsTotal > 0 || salesTotal > 0) {
    const parts: string[] = [];

    if (appointmentsTotal > 0) {
      parts.push(`${appointmentsTotal} cita${appointmentsTotal === 1 ? "" : "s"}`);
    }

    if (salesTotal > 0) {
      parts.push(`${salesTotal} venta${salesTotal === 1 ? "" : "s"}`);
    }

    redirectWithError(
      `Este cliente no puede eliminarse porque tiene historial relacionado (${parts.join(
        " y "
      )}). Puedes desactivarlo para dejar de usarlo sin perder ese historial.`
    );
  }

  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", customerId);

  if (error) {
    redirectWithError(mapCustomerError(error.message));
  }

  revalidateCustomerPages();
  redirect("/dashboard/customers?success=deleted");
}