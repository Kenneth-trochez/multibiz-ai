"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createCustomerAction(formData: FormData): Promise<void> {
  const businessId = String(formData.get("businessId") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!businessId || !name) {
    redirect("/dashboard/customers?error=Nombre+y+negocio+son+obligatorios");
  }

  const supabase = await createClient();

  const { error } = await supabase.from("customers").insert({
    business_id: businessId,
    name,
    phone: phone || null,
    email: email || null,
    address: address || null,
    notes: notes || null,
  });

  if (error) {
    redirect(
      `/dashboard/customers?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/dashboard/customers");
  redirect("/dashboard/customers?success=created");
}

export async function updateCustomerAction(formData: FormData): Promise<void> {
  const customerId = String(formData.get("customerId") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!customerId || !name) {
    redirect("/dashboard/customers?error=Datos+incompletos");
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
    })
    .eq("id", customerId);

  if (error) {
    redirect(
      `/dashboard/customers?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/dashboard/customers");
  redirect("/dashboard/customers?success=updated");
}

export async function deleteCustomerAction(formData: FormData): Promise<void> {
  const customerId = String(formData.get("customerId") || "").trim();

  if (!customerId) {
    redirect("/dashboard/customers?error=Cliente+invalido");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", customerId);

  if (error) {
    redirect(
      `/dashboard/customers?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/dashboard/customers");
  redirect("/dashboard/customers?success=deleted");
}