"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
    redirect("/dashboard/products?error=Nombre+y+negocio+son+obligatorios");
  }

  if (Number.isNaN(price) || price < 0) {
    redirect("/dashboard/products?error=Precio+invalido");
  }

  if (Number.isNaN(stock) || stock < 0) {
    redirect("/dashboard/products?error=Stock+invalido");
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
    redirect(`/dashboard/products?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard/balance");
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
    redirect("/dashboard/products?error=Datos+incompletos");
  }

  if (Number.isNaN(price) || price < 0) {
    redirect("/dashboard/products?error=Precio+invalido");
  }

  if (Number.isNaN(stock) || stock < 0) {
    redirect("/dashboard/products?error=Stock+invalido");
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
    redirect(`/dashboard/products?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard/balance");
  redirect("/dashboard/products?success=updated");
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  const productId = String(formData.get("productId") || "").trim();

  if (!productId) {
    redirect("/dashboard/products?error=Producto+invalido");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (error) {
    redirect(`/dashboard/products?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard/balance");
  redirect("/dashboard/products?success=deleted");
}