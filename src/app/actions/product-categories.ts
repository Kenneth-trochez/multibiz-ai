"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function revalidateProductPages() {
  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard/balance");
}

export async function createProductCategoryAction(
  formData: FormData
): Promise<void> {
  const businessId = String(formData.get("businessId") || "").trim();
  const name = String(formData.get("name") || "").trim();

  if (!businessId || !name) {
    redirect("/dashboard/products?error=Negocio+y+nombre+de+categoria+son+obligatorios");
  }

  const supabase = await createClient();

  const { error } = await supabase.from("product_categories").insert({
    business_id: businessId,
    name,
  });

  if (error) {
    redirect(`/dashboard/products?error=${encodeURIComponent(error.message)}`);
  }

  revalidateProductPages();
  redirect("/dashboard/products?success=category_created");
}

export async function updateProductCategoryAction(
  formData: FormData
): Promise<void> {
  const categoryId = String(formData.get("categoryId") || "").trim();
  const name = String(formData.get("name") || "").trim();

  if (!categoryId || !name) {
    redirect("/dashboard/products?error=Datos+de+categoria+incompletos");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("product_categories")
    .update({
      name,
      updated_at: new Date().toISOString(),
    })
    .eq("id", categoryId);

  if (error) {
    redirect(`/dashboard/products?error=${encodeURIComponent(error.message)}`);
  }

  revalidateProductPages();
  redirect("/dashboard/products?success=category_updated");
}

export async function deleteProductCategoryAction(
  formData: FormData
): Promise<void> {
  const categoryId = String(formData.get("categoryId") || "").trim();

  if (!categoryId) {
    redirect("/dashboard/products?error=Categoria+invalida");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("product_categories")
    .delete()
    .eq("id", categoryId);

  if (error) {
    redirect(`/dashboard/products?error=${encodeURIComponent(error.message)}`);
  }

  revalidateProductPages();
  redirect("/dashboard/products?success=category_deleted");
}