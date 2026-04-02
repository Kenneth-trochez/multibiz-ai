"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const EMAIL_REGEX =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeHondurasPhone(raw: string): string | null {
  const value = raw.trim();

  if (!value) return null;

  let digits = value.replace(/\D/g, "");

  if (digits.startsWith("504")) {
    digits = digits.slice(3);
  }

  if (digits.length !== 8) {
    throw new Error("El teléfono debe tener 8 dígitos de Honduras");
  }

  return `+504 ${digits.slice(0, 4)}-${digits.slice(4)}`;
}

function normalizeEmail(raw: string): string | null {
  const value = raw.trim().toLowerCase();

  if (!value) return null;

  if (!EMAIL_REGEX.test(value)) {
    throw new Error("El correo ingresado no es válido");
  }

  return value;
}

export async function createCustomerAction(formData: FormData): Promise<void> {
  const businessId = String(formData.get("businessId") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const rawPhone = String(formData.get("phone") || "").trim();
  const rawEmail = String(formData.get("email") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!businessId || !name) {
    redirect("/dashboard/customers?error=Nombre+y+negocio+son+obligatorios");
  }

  let phone: string | null = null;
  let email: string | null = null;

  try {
    phone = normalizeHondurasPhone(rawPhone);
    email = normalizeEmail(rawEmail);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Datos inválidos";
    redirect(`/dashboard/customers?error=${encodeURIComponent(message)}`);
  }

  const supabase = await createClient();

  const { error } = await supabase.from("customers").insert({
    business_id: businessId,
    name,
    phone,
    email,
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
  const rawPhone = String(formData.get("phone") || "").trim();
  const rawEmail = String(formData.get("email") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!customerId || !name) {
    redirect("/dashboard/customers?error=Datos+incompletos");
  }

  let phone: string | null = null;
  let email: string | null = null;

  try {
    phone = normalizeHondurasPhone(rawPhone);
    email = normalizeEmail(rawEmail);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Datos inválidos";
    redirect(`/dashboard/customers?error=${encodeURIComponent(message)}`);
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("customers")
    .update({
      name,
      phone,
      email,
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