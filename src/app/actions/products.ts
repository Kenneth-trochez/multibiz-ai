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

function mapProductError(message: string) {
  const lower = message.toLowerCase();

  if (
    lower.includes("products_business_sku_unique") ||
    (lower.includes("duplicate key") && lower.includes("sku"))
  ) {
    return "Ya existe un producto con ese SKU en este negocio.";
  }

  if (lower.includes("products_category_id_fkey")) {
    return "La categoría seleccionada no es válida o ya no existe.";
  }

  if (lower.includes("violates foreign key constraint") && lower.includes("sale_items_product_id_fkey")) {
    return "Este producto no puede eliminarse porque forma parte del historial de ventas. Puedes desactivarlo para dejar de usarlo sin perder el historial.";
  }

  return "No se pudo procesar el producto. Revisa los datos e intenta de nuevo.";
}

export async function createProductAction(formData: FormData): Promise<void> {
  const businessId = String(formData.get("businessId") || "").trim();
  const categoryIdRaw = String(formData.get("categoryId") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const sku = String(formData.get("sku") || "").trim();
  const priceRaw = String(formData.get("price") || "").trim();
  const stockRaw = String(formData.get("stock") || "").trim();
  const activeValue = String(formData.get("active") || "");
  const active = activeValue === "on" || activeValue === "true";

  const price = Number(priceRaw || 0);
  const stock = Number(stockRaw || 0);
  const categoryId = categoryIdRaw || null;

  if (!businessId || !name) {
    redirectWithError("El nombre del producto es obligatorio.");
  }

  if (Number.isNaN(price) || price < 0) {
    redirectWithError("El precio no es válido.");
  }

  if (Number.isNaN(stock) || stock < 0) {
    redirectWithError("El stock no es válido.");
  }

  const supabase = await createClient();

  const { error } = await supabase.from("products").insert({
    business_id: businessId,
    category_id: categoryId,
    name,
    description: description || null,
    sku: sku || null,
    price,
    stock,
    active,
  });

  if (error) {
    redirectWithError(mapProductError(error.message));
  }

  revalidateProductPages();
  redirect("/dashboard/products?success=created");
}

export async function updateProductAction(formData: FormData): Promise<void> {
  const productId = String(formData.get("productId") || "").trim();
  const categoryIdRaw = String(formData.get("categoryId") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const sku = String(formData.get("sku") || "").trim();
  const priceRaw = String(formData.get("price") || "").trim();
  const stockRaw = String(formData.get("stock") || "").trim();
  const activeValue = String(formData.get("active") || "");
  const active = activeValue === "on" || activeValue === "true";

  const price = Number(priceRaw || 0);
  const stock = Number(stockRaw || 0);
  const categoryId = categoryIdRaw || null;

  if (!productId || !name) {
    redirectWithError("Faltan datos del producto.");
  }

  if (Number.isNaN(price) || price < 0) {
    redirectWithError("El precio no es válido.");
  }

  if (Number.isNaN(stock) || stock < 0) {
    redirectWithError("El stock no es válido.");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("products")
    .update({
      category_id: categoryId,
      name,
      description: description || null,
      sku: sku || null,
      price,
      stock,
      active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);

  if (error) {
    redirectWithError(mapProductError(error.message));
  }

  revalidateProductPages();
  redirect("/dashboard/products?success=updated");
}

export async function deactivateProductAction(formData: FormData): Promise<void> {
  const productId = String(formData.get("productId") || "").trim();

  if (!productId) {
    redirectWithError("Producto inválido.");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("products")
    .update({
      active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);

  if (error) {
    redirectWithError("No se pudo desactivar el producto.");
  }

  revalidateProductPages();
  redirect("/dashboard/products?success=deactivated");
}

export async function reactivateProductAction(formData: FormData): Promise<void> {
  const productId = String(formData.get("productId") || "").trim();

  if (!productId) {
    redirectWithError("Producto inválido.");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("products")
    .update({
      active: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);

  if (error) {
    redirectWithError("No se pudo reactivar el producto.");
  }

  revalidateProductPages();
  redirect("/dashboard/products?success=reactivated");
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  const productId = String(formData.get("productId") || "").trim();

  if (!productId) {
    redirectWithError("Producto inválido.");
  }

  const supabase = await createClient();

  const { count: saleItemsCount, error: relationError } = await supabase
    .from("sale_items")
    .select("*", { count: "exact", head: true })
    .eq("product_id", productId);

  if (relationError) {
    redirectWithError("No se pudo verificar si el producto tiene historial relacionado.");
  }

  if ((saleItemsCount || 0) > 0) {
    const count = saleItemsCount || 0;
    redirectWithError(
      `Este producto no puede eliminarse porque aparece en ${count} registro${count === 1 ? "" : "s"} de venta. Puedes desactivarlo para que ya no se use sin perder el historial.`
    );
  }

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (error) {
    redirectWithError(mapProductError(error.message));
  }

  revalidateProductPages();
  redirect("/dashboard/products?success=deleted");
}