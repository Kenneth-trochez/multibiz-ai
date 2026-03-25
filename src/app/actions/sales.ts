"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type SaleItemInput = {
  product_id: string;
  quantity: number;
};

export async function createSaleAction(formData: FormData): Promise<void> {
  const businessId = String(formData.get("businessId") || "").trim();
  const customerId = String(formData.get("customer_id") || "").trim();
  const staffId = String(formData.get("staff_id") || "").trim();
  const discountRaw = String(formData.get("discount") || "0").trim();
  const notes = String(formData.get("notes") || "").trim();
  const itemsJson = String(formData.get("items_json") || "[]").trim();

  if (!businessId) {
    redirect("/dashboard/sales?error=Negocio+invalido");
  }

  const discount = Number(discountRaw || 0);

  if (Number.isNaN(discount) || discount < 0) {
    redirect("/dashboard/sales?error=Descuento+invalido");
  }

  let parsedItems: SaleItemInput[] = [];

  try {
    parsedItems = JSON.parse(itemsJson);
  } catch {
    redirect("/dashboard/sales?error=No+se+pudieron+leer+los+productos+de+la+venta");
  }

  const cleanedItems = parsedItems
    .map((item) => ({
      product_id: String(item.product_id || "").trim(),
      quantity: Number(item.quantity || 0),
    }))
    .filter((item) => item.product_id && item.quantity > 0);

  if (cleanedItems.length === 0) {
    redirect("/dashboard/sales?error=Debes+agregar+al+menos+un+producto");
  }

  const mergedItemsMap = new Map<string, number>();

  for (const item of cleanedItems) {
    mergedItemsMap.set(
      item.product_id,
      (mergedItemsMap.get(item.product_id) || 0) + item.quantity
    );
  }

  const mergedItems = Array.from(mergedItemsMap.entries()).map(
    ([product_id, quantity]) => ({
      product_id,
      quantity,
    })
  );

  const productIds = mergedItems.map((item) => item.product_id);

  const supabase = await createClient();

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, price, stock, active")
    .eq("business_id", businessId)
    .in("id", productIds);

  if (productsError) {
    redirect(`/dashboard/sales?error=${encodeURIComponent(productsError.message)}`);
  }

  if (!products || products.length !== productIds.length) {
    redirect("/dashboard/sales?error=Uno+o+mas+productos+no+pertenecen+al+negocio");
  }

  const productsMap = new Map(products.map((product) => [product.id, product]));

  let subtotal = 0;

  const saleItemsToInsert = mergedItems.map((item) => {
    const product = productsMap.get(item.product_id);

    if (!product) {
      redirect("/dashboard/sales?error=Producto+invalido+en+la+venta");
    }

    if (!product.active) {
      redirect(
        `/dashboard/sales?error=${encodeURIComponent(
          `El producto ${product.name} no está activo`
        )}`
      );
    }

    if (Number(product.stock || 0) < item.quantity) {
      redirect(
        `/dashboard/sales?error=${encodeURIComponent(
          `Stock insuficiente para ${product.name}`
        )}`
      );
    }

    const unitPrice = Number(product.price || 0);
    const lineTotal = unitPrice * item.quantity;
    subtotal += lineTotal;

    return {
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: unitPrice,
      line_total: lineTotal,
    };
  });

  if (discount > subtotal) {
    redirect("/dashboard/sales?error=El+descuento+no+puede+ser+mayor+al+subtotal");
  }

  const total = subtotal - discount;

  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .insert({
      business_id: businessId,
      customer_id: customerId || null,
      staff_id: staffId || null,
      subtotal,
      discount,
      total,
      notes: notes || null,
    })
    .select("id")
    .single();

  if (saleError || !sale) {
    redirect(
      `/dashboard/sales?error=${encodeURIComponent(
        saleError?.message || "No se pudo crear la venta"
      )}`
    );
  }

  const itemsPayload = saleItemsToInsert.map((item) => ({
    sale_id: sale.id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    line_total: item.line_total,
  }));

  const { error: itemsError } = await supabase.from("sale_items").insert(itemsPayload);

  if (itemsError) {
    await supabase.from("sales").delete().eq("id", sale.id);
    redirect(`/dashboard/sales?error=${encodeURIComponent(itemsError.message)}`);
  }

  const stockRollback: { productId: string; quantity: number }[] = [];

  for (const item of saleItemsToInsert) {
    const product = productsMap.get(item.product_id);
    const currentStock = Number(product?.stock || 0);
    const newStock = currentStock - item.quantity;

    const { error: stockError } = await supabase
      .from("products")
      .update({
        stock: newStock,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.product_id)
      .eq("business_id", businessId);

    if (stockError) {
      for (const rollback of stockRollback) {
        const previousProduct = productsMap.get(rollback.productId);
        const previousStock = Number(previousProduct?.stock || 0);

        await supabase
          .from("products")
          .update({
            stock: previousStock,
            updated_at: new Date().toISOString(),
          })
          .eq("id", rollback.productId)
          .eq("business_id", businessId);
      }

      await supabase.from("sale_items").delete().eq("sale_id", sale.id);
      await supabase.from("sales").delete().eq("id", sale.id);

      redirect(
        `/dashboard/sales?error=${encodeURIComponent(
          `No se pudo actualizar el stock: ${stockError.message}`
        )}`
      );
    }

    stockRollback.push({
      productId: item.product_id,
      quantity: item.quantity,
    });
  }

  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard/sales");
  revalidatePath("/dashboard/balance");
  revalidatePath("/dashboard");

  redirect("/dashboard/sales?success=created");
}