"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function revalidateProductPages() {
  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard/balance");
}

function redirectWithError(message: string): never {
  redirect(`/dashboard/products?error=${encodeURIComponent(message)}`);
}

function mapCategoryError(message: string) {
  const lower = message.toLowerCase();

  if (
    lower.includes("product_categories_business_name_unique") ||
    (lower.includes("duplicate key") && lower.includes("name"))
  ) {
    return "Ya existe una categoría con ese nombre en este negocio.";
  }

  return "No se pudo procesar la categoría. Revisa los datos e intenta de nuevo.";
}

export async function createProductCategoryAction(
  formData: FormData
): Promise<void> {
  const businessId = String(formData.get("businessId") || "").trim();
  const name = String(formData.get("name") || "").trim();

  if (!businessId || !name) {
    redirectWithError("El nombre de la categoría es obligatorio.");
  }

  const supabase = await createClient();

  const { error } = await supabase.from("product_categories").insert({
    business_id: businessId,
    name,
  });

  if (error) {
    redirectWithError(mapCategoryError(error.message));
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
    redirectWithError("Faltan datos de la categoría.");
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
    redirectWithError(mapCategoryError(error.message));
  }

  revalidateProductPages();
  redirect("/dashboard/products?success=category_updated");
}

export async function deleteProductCategoryAction(
  formData: FormData
): Promise<void> {
  const categoryId = String(formData.get("categoryId") || "").trim();

  if (!categoryId) {
    redirectWithError("Categoría inválida.");
  }

  const supabase = await createClient();

  const { count: productsCount, error: relationError } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("category_id", categoryId);

  if (relationError) {
    redirectWithError("No se pudo verificar si la categoría tiene productos relacionados.");
  }

  if ((productsCount || 0) > 0) {
    const count = productsCount || 0;
    redirectWithError(
      `No se puede eliminar esta categoría porque está asignada a ${count} producto${count === 1 ? "" : "s"}. Primero cambia o quita esa categoría de esos productos.`
    );
  }

  const { error } = await supabase
    .from("product_categories")
    .delete()
    .eq("id", categoryId);

  if (error) {
    redirectWithError(mapCategoryError(error.message));
  }

  revalidateProductPages();
  redirect("/dashboard/products?success=category_deleted");
}