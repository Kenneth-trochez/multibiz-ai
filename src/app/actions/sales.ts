"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type SaleItemInput = {
  product_id: string;
  quantity: number;
};

type ProductRow = {
  id: string;
  name: string;
  price: number | null;
  stock: number | null;
  active: boolean | null;
};

type ExistingSaleItemRow = {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number | null;
  unit_price: number | null;
  line_total: number | null;
};

function parseSaleItems(itemsJson: string): SaleItemInput[] {
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

  return Array.from(mergedItemsMap.entries()).map(([product_id, quantity]) => ({
    product_id,
    quantity,
  }));
}

function getQtyMap(items: { product_id: string; quantity: number }[]) {
  const map = new Map<string, number>();

  for (const item of items) {
    map.set(item.product_id, (map.get(item.product_id) || 0) + item.quantity);
  }

  return map;
}

async function loadProductsByIds(params: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  businessId: string;
  productIds: string[];
}) {
  const { supabase, businessId, productIds } = params;

  if (productIds.length === 0) {
    return new Map<string, ProductRow>();
  }

  const { data, error } = await supabase
    .from("products")
    .select("id, name, price, stock, active")
    .eq("business_id", businessId)
    .in("id", productIds);

  if (error) {
    redirect(`/dashboard/sales?error=${encodeURIComponent(error.message)}`);
  }

  const map = new Map<string, ProductRow>();
  for (const product of data || []) {
    map.set(product.id, product);
  }

  return map;
}

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

  const newItems = parseSaleItems(itemsJson);
  const newQtyMap = getQtyMap(newItems);
  const productIds = Array.from(newQtyMap.keys());

  const supabase = await createClient();
  const productsMap = await loadProductsByIds({
    supabase,
    businessId,
    productIds,
  });

  if (productsMap.size !== productIds.length) {
    redirect("/dashboard/sales?error=Uno+o+mas+productos+no+pertenecen+al+negocio");
  }

  let subtotal = 0;

  const saleItemsToInsert = newItems.map((item) => {
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

    const currentStock = Number(product.stock || 0);
    if (currentStock < item.quantity) {
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

  const previousStocks = new Map<string, number>();
  for (const productId of productIds) {
    previousStocks.set(productId, Number(productsMap.get(productId)?.stock || 0));
  }

  for (const productId of productIds) {
    const previousStock = previousStocks.get(productId) || 0;
    const quantity = newQtyMap.get(productId) || 0;
    const targetStock = previousStock - quantity;

    const { error: stockError } = await supabase
      .from("products")
      .update({
        stock: targetStock,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId)
      .eq("business_id", businessId);

    if (stockError) {
      for (const [rollbackProductId, rollbackStock] of previousStocks.entries()) {
        await supabase
          .from("products")
          .update({
            stock: rollbackStock,
            updated_at: new Date().toISOString(),
          })
          .eq("id", rollbackProductId)
          .eq("business_id", businessId);
      }

      redirect(
        `/dashboard/sales?error=${encodeURIComponent(
          `No se pudo actualizar el stock: ${stockError.message}`
        )}`
      );
    }
  }

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
    for (const [rollbackProductId, rollbackStock] of previousStocks.entries()) {
      await supabase
        .from("products")
        .update({
          stock: rollbackStock,
          updated_at: new Date().toISOString(),
        })
        .eq("id", rollbackProductId)
        .eq("business_id", businessId);
    }

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

    for (const [rollbackProductId, rollbackStock] of previousStocks.entries()) {
      await supabase
        .from("products")
        .update({
          stock: rollbackStock,
          updated_at: new Date().toISOString(),
        })
        .eq("id", rollbackProductId)
        .eq("business_id", businessId);
    }

    redirect(`/dashboard/sales?error=${encodeURIComponent(itemsError.message)}`);
  }

  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard/sales");
  revalidatePath("/dashboard/balance");
  revalidatePath("/dashboard");

  redirect("/dashboard/sales?success=created");
}

export async function updateSaleAction(formData: FormData): Promise<void> {
  const saleId = String(formData.get("saleId") || "").trim();
  const businessId = String(formData.get("businessId") || "").trim();
  const customerId = String(formData.get("customer_id") || "").trim();
  const staffId = String(formData.get("staff_id") || "").trim();
  const discountRaw = String(formData.get("discount") || "0").trim();
  const notes = String(formData.get("notes") || "").trim();
  const itemsJson = String(formData.get("items_json") || "[]").trim();

  if (!saleId || !businessId) {
    redirect("/dashboard/sales?error=Venta+invalida");
  }

  const discount = Number(discountRaw || 0);

  if (Number.isNaN(discount) || discount < 0) {
    redirect("/dashboard/sales?error=Descuento+invalido");
  }

  const newItems = parseSaleItems(itemsJson);
  const newQtyMap = getQtyMap(newItems);

  const supabase = await createClient();

  const { data: currentSale, error: currentSaleError } = await supabase
    .from("sales")
    .select("id")
    .eq("id", saleId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (currentSaleError || !currentSale) {
    redirect("/dashboard/sales?error=No+se+encontro+la+venta");
  }

  const { data: oldItemsRaw, error: oldItemsError } = await supabase
    .from("sale_items")
    .select("id, sale_id, product_id, quantity, unit_price, line_total")
    .eq("sale_id", saleId);

  if (oldItemsError) {
    redirect(`/dashboard/sales?error=${encodeURIComponent(oldItemsError.message)}`);
  }

  const oldItems: ExistingSaleItemRow[] = (oldItemsRaw || []).map((item) => ({
    id: item.id,
    sale_id: item.sale_id,
    product_id: item.product_id,
    quantity: Number(item.quantity || 0),
    unit_price: Number(item.unit_price || 0),
    line_total: Number(item.line_total || 0),
  }));

  const oldQtyMap = getQtyMap(
    oldItems.map((item) => ({
      product_id: item.product_id,
      quantity: Number(item.quantity || 0),
    }))
  );

  const affectedProductIds = Array.from(
    new Set([...Array.from(oldQtyMap.keys()), ...Array.from(newQtyMap.keys())])
  );

  const productsMap = await loadProductsByIds({
    supabase,
    businessId,
    productIds: affectedProductIds,
  });

  if (productsMap.size !== affectedProductIds.length) {
    redirect("/dashboard/sales?error=Uno+o+mas+productos+no+pertenecen+al+negocio");
  }

  let subtotal = 0;

  const saleItemsToInsert = newItems.map((item) => {
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

    const currentStock = Number(product.stock || 0);
    const previousQty = oldQtyMap.get(item.product_id) || 0;
    const availableStock = currentStock + previousQty;

    if (availableStock < item.quantity) {
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

  const previousStocks = new Map<string, number>();
  const targetStocks = new Map<string, number>();

  for (const productId of affectedProductIds) {
    const currentStock = Number(productsMap.get(productId)?.stock || 0);
    const previousQty = oldQtyMap.get(productId) || 0;
    const newQty = newQtyMap.get(productId) || 0;

    previousStocks.set(productId, currentStock);
    targetStocks.set(productId, currentStock + previousQty - newQty);
  }

  for (const [productId, targetStock] of targetStocks.entries()) {
    const { error: stockError } = await supabase
      .from("products")
      .update({
        stock: targetStock,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId)
      .eq("business_id", businessId);

    if (stockError) {
      for (const [rollbackProductId, rollbackStock] of previousStocks.entries()) {
        await supabase
          .from("products")
          .update({
            stock: rollbackStock,
            updated_at: new Date().toISOString(),
          })
          .eq("id", rollbackProductId)
          .eq("business_id", businessId);
      }

      redirect(
        `/dashboard/sales?error=${encodeURIComponent(
          `No se pudo actualizar el stock: ${stockError.message}`
        )}`
      );
    }
  }

  const { error: saleUpdateError } = await supabase
    .from("sales")
    .update({
      customer_id: customerId || null,
      staff_id: staffId || null,
      subtotal,
      discount,
      total,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", saleId)
    .eq("business_id", businessId);

  if (saleUpdateError) {
    for (const [rollbackProductId, rollbackStock] of previousStocks.entries()) {
      await supabase
        .from("products")
        .update({
          stock: rollbackStock,
          updated_at: new Date().toISOString(),
        })
        .eq("id", rollbackProductId)
        .eq("business_id", businessId);
    }

    redirect(`/dashboard/sales?error=${encodeURIComponent(saleUpdateError.message)}`);
  }

  const { error: deleteItemsError } = await supabase
    .from("sale_items")
    .delete()
    .eq("sale_id", saleId);

  if (deleteItemsError) {
    for (const [rollbackProductId, rollbackStock] of previousStocks.entries()) {
      await supabase
        .from("products")
        .update({
          stock: rollbackStock,
          updated_at: new Date().toISOString(),
        })
        .eq("id", rollbackProductId)
        .eq("business_id", businessId);
    }

    redirect(`/dashboard/sales?error=${encodeURIComponent(deleteItemsError.message)}`);
  }

  const itemsPayload = saleItemsToInsert.map((item) => ({
    sale_id: saleId,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    line_total: item.line_total,
  }));

  const { error: insertItemsError } = await supabase.from("sale_items").insert(itemsPayload);

  if (insertItemsError) {
    if (oldItems.length > 0) {
      await supabase.from("sale_items").insert(
        oldItems.map((item) => ({
          sale_id: item.sale_id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          line_total: item.line_total,
        }))
      );
    }

    for (const [rollbackProductId, rollbackStock] of previousStocks.entries()) {
      await supabase
        .from("products")
        .update({
          stock: rollbackStock,
          updated_at: new Date().toISOString(),
        })
        .eq("id", rollbackProductId)
        .eq("business_id", businessId);
    }

    redirect(`/dashboard/sales?error=${encodeURIComponent(insertItemsError.message)}`);
  }

  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard/sales");
  revalidatePath("/dashboard/balance");
  revalidatePath("/dashboard");

  redirect("/dashboard/sales?success=updated");
}

export async function deleteSaleAction(formData: FormData): Promise<void> {
  const saleId = String(formData.get("saleId") || "").trim();
  const businessId = String(formData.get("businessId") || "").trim();

  if (!saleId || !businessId) {
    redirect("/dashboard/sales?error=Venta+invalida");
  }

  const supabase = await createClient();

  const { data: currentSale, error: currentSaleError } = await supabase
    .from("sales")
    .select("id")
    .eq("id", saleId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (currentSaleError || !currentSale) {
    redirect("/dashboard/sales?error=No+se+encontro+la+venta");
  }

  const { data: existingItemsRaw, error: existingItemsError } = await supabase
    .from("sale_items")
    .select("product_id, quantity")
    .eq("sale_id", saleId);

  if (existingItemsError) {
    redirect(`/dashboard/sales?error=${encodeURIComponent(existingItemsError.message)}`);
  }

  const existingItems = (existingItemsRaw || []).map((item) => ({
    product_id: item.product_id,
    quantity: Number(item.quantity || 0),
  }));

  const qtyMap = getQtyMap(existingItems);
  const productIds = Array.from(qtyMap.keys());

  const productsMap = await loadProductsByIds({
    supabase,
    businessId,
    productIds,
  });

  const previousStocks = new Map<string, number>();

  for (const productId of productIds) {
    const currentStock = Number(productsMap.get(productId)?.stock || 0);
    previousStocks.set(productId, currentStock);

    const restoredStock = currentStock + (qtyMap.get(productId) || 0);

    const { error: stockError } = await supabase
      .from("products")
      .update({
        stock: restoredStock,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId)
      .eq("business_id", businessId);

    if (stockError) {
      for (const [rollbackProductId, rollbackStock] of previousStocks.entries()) {
        await supabase
          .from("products")
          .update({
            stock: rollbackStock,
            updated_at: new Date().toISOString(),
          })
          .eq("id", rollbackProductId)
          .eq("business_id", businessId);
      }

      redirect(
        `/dashboard/sales?error=${encodeURIComponent(
          `No se pudo restaurar el stock: ${stockError.message}`
        )}`
      );
    }
  }

  const { error: deleteSaleError } = await supabase
    .from("sales")
    .delete()
    .eq("id", saleId)
    .eq("business_id", businessId);

  if (deleteSaleError) {
    for (const [rollbackProductId, rollbackStock] of previousStocks.entries()) {
      await supabase
        .from("products")
        .update({
          stock: rollbackStock,
          updated_at: new Date().toISOString(),
        })
        .eq("id", rollbackProductId)
        .eq("business_id", businessId);
    }

    redirect(`/dashboard/sales?error=${encodeURIComponent(deleteSaleError.message)}`);
  }

  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard/sales");
  revalidatePath("/dashboard/balance");
  revalidatePath("/dashboard");

  redirect("/dashboard/sales?success=deleted");
}