"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  ShoppingCart,
  Receipt,
  DollarSign,
  Pencil,
  Percent,
} from "lucide-react";
import {
  createSaleAction,
  updateSaleAction,
  deleteSaleAction,
} from "../../actions/sales";

type SaleItemRow = {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  product: {
    id: string;
    name: string;
    sku: string | null;
    category_id: string | null;
    product_categories:
      | {
          id: string;
          name: string;
        }
      | {
          id: string;
          name: string;
        }[]
      | null;
  } | null;
};

type SaleRow = {
  id: string;
  sale_at: string;
  subtotal: number;
  discount: number;
  discount_type: "fixed" | "percent";
  discount_value: number;
  tax_percent: number;
  tax_amount: number;
  total: number;
  notes: string | null;
  customer: {
    id: string;
    name: string;
    phone: string | null;
  } | null;
  staff: {
    id: string;
    display_name: string;
    specialty: string | null;
  } | null;
  items_count: number;
  items: SaleItemRow[];
};

type ProductOption = {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  stock: number;
  active: boolean;
  category_id: string | null;
  category_name: string | null;
};

type ProductCategoryOption = {
  id: string;
  name: string;
};

type CustomerOption = {
  id: string;
  name: string;
  phone: string | null;
};

type StaffOption = {
  id: string;
  display_name: string;
  specialty: string | null;
};

type Theme = {
  pageBg: string;
  sidebarBg: string;
  sidebarCard: string;
  card: string;
  cardSoft: string;
  subtle: string;
  input: string;
  select: string;
  option: string;
  textMuted: string;
  label: string;
  hover: string;
  active: string;
  accent: string;
  softAccent: string;
  buttonPrimary: string;
  buttonSecondary: string;
  logoutButton: string;
  danger: string;
  glassCard: string;
  headerBg: string;
};

type SaleLine = {
  id: string;
  category_id: string;
  product_id: string;
  quantity: number;
};

type DiscountType = "fixed" | "percent";

function formatSaleDate(dateStr: string) {
  return new Intl.DateTimeFormat("es-HN", {
    timeZone: "America/Tegucigalpa",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(dateStr));
}

function makeLine(): SaleLine {
  return {
    id: crypto.randomUUID(),
    category_id: "",
    product_id: "",
    quantity: 1,
  };
}

function buildLinesFromSale(sale: SaleRow): SaleLine[] {
  if (!sale.items.length) return [makeLine()];

  return sale.items.map((item) => {
    const productCategory = item.product?.category_id || "";

    return {
      id: crypto.randomUUID(),
      category_id: productCategory,
      product_id: item.product_id,
      quantity: Number(item.quantity || 1),
    };
  });
}

function getPreview(params: {
  lines: SaleLine[];
  discountType: DiscountType;
  discountValue: string;
  taxPercent: string;
  products: ProductOption[];
}) {
  const { lines, discountType, discountValue, taxPercent, products } = params;

  const numericDiscountValue = Number(discountValue || 0);
  const numericTaxPercent = Number(taxPercent || 0);

  let subtotal = 0;

  for (const line of lines) {
    const product = products.find((p) => p.id === line.product_id);
    if (!product) continue;
    subtotal += Number(product.price || 0) * Number(line.quantity || 0);
  }

  const safeDiscountValue =
    Number.isNaN(numericDiscountValue) || numericDiscountValue < 0
      ? 0
      : numericDiscountValue;

  const safeTaxPercent =
    Number.isNaN(numericTaxPercent) || numericTaxPercent < 0
      ? 0
      : numericTaxPercent;

  let discountAmount =
    discountType === "percent"
      ? subtotal * (safeDiscountValue / 100)
      : safeDiscountValue;

  if (discountAmount > subtotal) {
    discountAmount = subtotal;
  }

  const taxableBase = subtotal - discountAmount;
  const taxAmount = taxableBase * (safeTaxPercent / 100);
  const total = taxableBase + taxAmount;

  return {
    subtotal,
    discountValue: safeDiscountValue,
    discountAmount,
    taxPercent: safeTaxPercent,
    taxAmount,
    taxableBase,
    total,
  };
}

function buildItemsJson(lines: SaleLine[]) {
  return JSON.stringify(
    lines
      .filter((line) => line.product_id && Number(line.quantity) > 0)
      .map((line) => ({
        product_id: line.product_id,
        quantity: Number(line.quantity),
      }))
  );
}

export default function SalesClient({
  businessId,
  sales,
  products,
  categories,
  customers,
  staff,
  theme,
}: {
  businessId: string;
  sales: SaleRow[];
  products: ProductOption[];
  categories: ProductCategoryOption[];
  customers: CustomerOption[];
  staff: StaffOption[];
  theme: Theme;
}) {
  const [lines, setLines] = useState<SaleLine[]>([makeLine()]);
  const [discountType, setDiscountType] = useState<DiscountType>("fixed");
  const [discountValue, setDiscountValue] = useState("0");
  const [taxPercent, setTaxPercent] = useState("15");

  const [selectedSale, setSelectedSale] = useState<SaleRow | null>(null);
  const [editLines, setEditLines] = useState<SaleLine[]>([makeLine()]);
  const [editDiscountType, setEditDiscountType] = useState<DiscountType>("fixed");
  const [editDiscountValue, setEditDiscountValue] = useState("0");
  const [editTaxPercent, setEditTaxPercent] = useState("15");

  const preview = useMemo(
    () =>
      getPreview({
        lines,
        discountType,
        discountValue,
        taxPercent,
        products,
      }),
    [lines, discountType, discountValue, taxPercent, products]
  );

  const editPreview = useMemo(
    () =>
      getPreview({
        lines: editLines,
        discountType: editDiscountType,
        discountValue: editDiscountValue,
        taxPercent: editTaxPercent,
        products,
      }),
    [editLines, editDiscountType, editDiscountValue, editTaxPercent, products]
  );

  const itemsJson = buildItemsJson(lines);
  const editItemsJson = buildItemsJson(editLines);

  const openEdit = (sale: SaleRow) => {
    setSelectedSale(sale);
    setEditLines(buildLinesFromSale(sale));
    setEditDiscountType(sale.discount_type || "fixed");
    setEditDiscountValue(String(Number(sale.discount_value || 0)));
    setEditTaxPercent(String(Number(sale.tax_percent || 0)));
  };

  return (
    <div className="mx-auto max-w-7xl p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold lg:text-3xl">Ventas</h1>
          <p className={`mt-1 text-sm ${theme.textMuted}`}>
            Registra ventas de productos y controla el movimiento del inventario.
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
          <div className="mb-3 flex items-center justify-between">
            <p className={`text-sm ${theme.textMuted}`}>Subtotal actual</p>
            <Receipt className="h-5 w-5" />
          </div>
          <p className="text-3xl font-bold">L {preview.subtotal.toFixed(2)}</p>
        </div>

        <div className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
          <div className="mb-3 flex items-center justify-between">
            <p className={`text-sm ${theme.textMuted}`}>Descuento aplicado</p>
            <DollarSign className="h-5 w-5" />
          </div>
          <p className="text-3xl font-bold">L {preview.discountAmount.toFixed(2)}</p>
        </div>

        <div className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
          <div className="mb-3 flex items-center justify-between">
            <p className={`text-sm ${theme.textMuted}`}>ISV calculado</p>
            <Percent className="h-5 w-5" />
          </div>
          <p className="text-3xl font-bold">L {preview.taxAmount.toFixed(2)}</p>
        </div>

        <div className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
          <div className="mb-3 flex items-center justify-between">
            <p className={`text-sm ${theme.textMuted}`}>Total</p>
            <ShoppingCart className="h-5 w-5" />
          </div>
          <p className="text-3xl font-bold">L {preview.total.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Ventas recientes</h2>
            <p className={`text-sm ${theme.textMuted}`}>
              {sales.length} cargadas
            </p>
          </div>

          {sales.length === 0 ? (
            <div className={`rounded-2xl border p-6 ${theme.card}`}>
              <p className={theme.textMuted}>Aún no hay ventas registradas.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sales.map((sale) => (
                <div
                  key={sale.id}
                  className={`rounded-2xl border p-4 shadow-sm ${theme.card}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-base font-semibold">
                        Venta · L {sale.total.toFixed(2)}
                      </p>
                      <p className={`mt-1 text-sm ${theme.textMuted}`}>
                        {formatSaleDate(sale.sale_at)}
                      </p>
                      <p className={`mt-1 text-sm ${theme.textMuted}`}>
                        Cliente: {sale.customer?.name || "Sin cliente"} · Staff:{" "}
                        {sale.staff?.display_name || "Sin asignar"}
                      </p>
                      <p className={`mt-1 text-xs ${theme.textMuted}`}>
                        Items: {sale.items_count} · Subtotal: L{" "}
                        {sale.subtotal.toFixed(2)} · Descuento: L{" "}
                        {sale.discount.toFixed(2)} · ISV: L{" "}
                        {sale.tax_amount.toFixed(2)}
                      </p>
                      <p className={`mt-1 text-xs ${theme.textMuted}`}>
                        Tipo descuento:{" "}
                        {sale.discount_type === "percent" ? "%" : "L"} · Valor:{" "}
                        {sale.discount_value.toFixed(2)} · ISV%:{" "}
                        {sale.tax_percent.toFixed(2)}
                      </p>

                      {sale.items.length > 0 && (
                        <div className={`mt-2 text-xs ${theme.textMuted}`}>
                          {sale.items
                            .map((item) => {
                              const categoryName = Array.isArray(
                                item.product?.product_categories
                              )
                                ? item.product?.product_categories[0]?.name
                                : item.product?.product_categories?.name;

                              return `${item.product?.name || "Producto"} x${
                                item.quantity
                              }${categoryName ? ` (${categoryName})` : ""}`;
                            })
                            .join(" · ")}
                        </div>
                      )}

                      {sale.notes?.trim() && (
                        <p className={`mt-2 text-sm ${theme.textMuted}`}>
                          Nota: {sale.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(sale)}
                        className={`rounded-xl border px-3 py-2 text-sm transition ${theme.buttonSecondary}`}
                        title="Editar venta"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

                      <div className="shrink-0 rounded-full border px-3 py-1 text-xs font-medium">
                        Ticket
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className={`rounded-2xl border p-6 shadow-sm ${theme.card}`}>
          <h2 className="mb-4 text-xl font-semibold">Nueva venta</h2>

          <form action={createSaleAction} className="space-y-4">
            <input type="hidden" name="businessId" value={businessId} />
            <input type="hidden" name="items_json" value={itemsJson} />

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={`mb-1 block text-sm font-medium ${theme.label}`}>
                  Cliente
                </label>
                <select
                  name="customer_id"
                  defaultValue=""
                  className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.select}`}
                >
                  <option className={theme.option} value="">
                    Sin cliente
                  </option>
                  {customers.map((customer) => (
                    <option
                      key={customer.id}
                      value={customer.id}
                      className={theme.option}
                    >
                      {customer.name}
                      {customer.phone ? ` — ${customer.phone}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`mb-1 block text-sm font-medium ${theme.label}`}>
                  Staff
                </label>
                <select
                  name="staff_id"
                  defaultValue=""
                  className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.select}`}
                >
                  <option className={theme.option} value="">
                    Sin asignar
                  </option>
                  {staff.map((member) => (
                    <option
                      key={member.id}
                      value={member.id}
                      className={theme.option}
                    >
                      {member.display_name}
                      {member.specialty ? ` — ${member.specialty}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className={`text-sm font-medium ${theme.label}`}>
                  Productos
                </label>

                <button
                  type="button"
                  onClick={() => setLines((prev) => [...prev, makeLine()])}
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${theme.buttonSecondary}`}
                >
                  <Plus className="h-4 w-4" />
                  Agregar línea
                </button>
              </div>

              <div className="space-y-3">
                {lines.map((line, index) => {
                  const filteredProducts = line.category_id
                    ? products.filter(
                        (product) => product.category_id === line.category_id
                      )
                    : products;

                  const selectedProduct = products.find(
                    (product) => product.id === line.product_id
                  );

                  return (
                    <div
                      key={line.id}
                      className="grid gap-3 rounded-2xl border p-4 md:grid-cols-2"
                    >
                      <div className="md:col-span-1">
                        <label
                          className={`mb-1 block text-xs font-medium ${theme.textMuted}`}
                        >
                          Categoría #{index + 1}
                        </label>
                        <select
                          value={line.category_id}
                          onChange={(e) =>
                            setLines((prev) =>
                              prev.map((item) =>
                                item.id === line.id
                                  ? {
                                      ...item,
                                      category_id: e.target.value,
                                      product_id: "",
                                    }
                                  : item
                              )
                            )
                          }
                          className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.select}`}
                        >
                          <option className={theme.option} value="">
                            Todas
                          </option>
                          {categories.map((category) => (
                            <option
                              key={category.id}
                              value={category.id}
                              className={theme.option}
                            >
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-1">
                        <label
                          className={`mb-1 block text-xs font-medium ${theme.textMuted}`}
                        >
                          Producto
                        </label>
                        <select
                          value={line.product_id}
                          onChange={(e) =>
                            setLines((prev) =>
                              prev.map((item) =>
                                item.id === line.id
                                  ? { ...item, product_id: e.target.value }
                                  : item
                              )
                            )
                          }
                          className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.select}`}
                        >
                          <option className={theme.option} value="">
                            Seleccionar producto
                          </option>
                          {filteredProducts.map((product) => (
                            <option
                              key={product.id}
                              value={product.id}
                              className={theme.option}
                            >
                              {product.name}
                              {product.category_name
                                ? ` — ${product.category_name}`
                                : ""}
                              {product.sku ? ` — ${product.sku}` : ""}
                              {` — L ${Number(product.price || 0).toFixed(
                                2
                              )} — Stock ${product.stock}`}
                            </option>
                          ))}
                        </select>

                        {selectedProduct && (
                          <p className={`mt-2 text-xs ${theme.textMuted}`}>
                            Categoría: {selectedProduct.category_name || "Sin categoría"} ·
                            Precio: L {Number(selectedProduct.price || 0).toFixed(2)} ·
                            Stock: {selectedProduct.stock}
                          </p>
                        )}
                      </div>

                      <div className="md:col-span-1">
                        <label
                          className={`mb-1 block text-xs font-medium ${theme.textMuted}`}
                        >
                          Cantidad
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={line.quantity}
                          onChange={(e) =>
                            setLines((prev) =>
                              prev.map((item) =>
                                item.id === line.id
                                  ? {
                                      ...item,
                                      quantity: Math.max(
                                        1,
                                        Number(e.target.value || 1)
                                      ),
                                    }
                                  : item
                              )
                            )
                          }
                          className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
                        />
                      </div>

                      <div className="md:col-span-1 flex items-end">
                        <button
                          type="button"
                          onClick={() =>
                            setLines((prev) =>
                              prev.length === 1
                                ? prev
                                : prev.filter((item) => item.id !== line.id)
                            )
                          }
                          className={`w-full rounded-xl px-3 py-2 transition ${
                            lines.length === 1
                              ? "cursor-not-allowed opacity-40"
                              : theme.danger
                          }`}
                          disabled={lines.length === 1}
                        >
                          <span className="inline-flex items-center justify-center gap-2">
                            <Trash2 className="h-4 w-4" />
                            Quitar línea
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className={`mb-1 block text-sm font-medium ${theme.label}`}>
                  Tipo de descuento
                </label>
                <select
                  name="discount_type"
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                  className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.select}`}
                >
                  <option value="fixed" className={theme.option}>
                    Monto fijo (L)
                  </option>
                  <option value="percent" className={theme.option}>
                    Porcentaje (%)
                  </option>
                </select>
              </div>

              <div>
                <label className={`mb-1 block text-sm font-medium ${theme.label}`}>
                  Valor descuento
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="discount_value"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
                />
              </div>

              <div>
                <label className={`mb-1 block text-sm font-medium ${theme.label}`}>
                  ISV %
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="tax_percent"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
                />
              </div>
            </div>

            <div>
              <label className={`mb-1 block text-sm font-medium ${theme.label}`}>
                Notas
              </label>
              <textarea
                name="notes"
                rows={3}
                className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
                placeholder="Opcional"
              />
            </div>

            <div className="rounded-2xl border p-4">
              <p className="text-sm font-medium">Resumen de venta</p>
              <div className={`mt-2 space-y-1 text-sm ${theme.textMuted}`}>
                <p>Subtotal: L {preview.subtotal.toFixed(2)}</p>
                <p>
                  Descuento aplicado: L {preview.discountAmount.toFixed(2)} (
                  {discountType === "percent" ? `${preview.discountValue.toFixed(2)}%` : `L ${preview.discountValue.toFixed(2)}`})
                </p>
                <p>Base gravable: L {preview.taxableBase.toFixed(2)}</p>
                <p>
                  ISV: L {preview.taxAmount.toFixed(2)} ({preview.taxPercent.toFixed(2)}%)
                </p>
                <p className="font-semibold">Total: L {preview.total.toFixed(2)}</p>
              </div>
            </div>

            <button
              type="submit"
              className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition ${theme.buttonPrimary}`}
            >
              Registrar venta
            </button>
          </form>
        </aside>
      </div>

      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedSale(null)}
          />
          <div className={`relative w-full max-w-3xl rounded-2xl border p-6 shadow-xl ${theme.card}`}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold">Editar venta</h3>
                <p className={`mt-1 text-sm ${theme.textMuted}`}>
                  Modifica productos, descuento, ISV y datos de la venta.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSale(null)}
                className={`rounded-xl border px-4 py-2 text-sm transition ${theme.buttonSecondary}`}
              >
                Cerrar
              </button>
            </div>

            <form action={updateSaleAction} className="space-y-4">
              <input type="hidden" name="saleId" value={selectedSale.id} />
              <input type="hidden" name="businessId" value={businessId} />
              <input type="hidden" name="items_json" value={editItemsJson} />

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={`mb-1 block text-sm font-medium ${theme.label}`}>
                    Cliente
                  </label>
                  <select
                    name="customer_id"
                    defaultValue={selectedSale.customer?.id || ""}
                    className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.select}`}
                  >
                    <option className={theme.option} value="">
                      Sin cliente
                    </option>
                    {customers.map((customer) => (
                      <option
                        key={customer.id}
                        value={customer.id}
                        className={theme.option}
                      >
                        {customer.name}
                        {customer.phone ? ` — ${customer.phone}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`mb-1 block text-sm font-medium ${theme.label}`}>
                    Staff
                  </label>
                  <select
                    name="staff_id"
                    defaultValue={selectedSale.staff?.id || ""}
                    className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.select}`}
                  >
                    <option className={theme.option} value="">
                      Sin asignar
                    </option>
                    {staff.map((member) => (
                      <option
                        key={member.id}
                        value={member.id}
                        className={theme.option}
                      >
                        {member.display_name}
                        {member.specialty ? ` — ${member.specialty}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className={`text-sm font-medium ${theme.label}`}>
                    Productos
                  </label>

                  <button
                    type="button"
                    onClick={() => setEditLines((prev) => [...prev, makeLine()])}
                    className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${theme.buttonSecondary}`}
                  >
                    <Plus className="h-4 w-4" />
                    Agregar línea
                  </button>
                </div>

                <div className="space-y-3">
                  {editLines.map((line, index) => {
                    const filteredProducts = line.category_id
                      ? products.filter(
                          (product) => product.category_id === line.category_id
                        )
                      : products;

                    const selectedProduct = products.find(
                      (product) => product.id === line.product_id
                    );

                    return (
                      <div
                        key={line.id}
                        className="grid gap-3 rounded-2xl border p-4 md:grid-cols-2"
                      >
                        <div className="md:col-span-1">
                          <label
                            className={`mb-1 block text-xs font-medium ${theme.textMuted}`}
                          >
                            Categoría #{index + 1}
                          </label>
                          <select
                            value={line.category_id}
                            onChange={(e) =>
                              setEditLines((prev) =>
                                prev.map((item) =>
                                  item.id === line.id
                                    ? {
                                        ...item,
                                        category_id: e.target.value,
                                        product_id: "",
                                      }
                                    : item
                                )
                              )
                            }
                            className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.select}`}
                          >
                            <option className={theme.option} value="">
                              Todas
                            </option>
                            {categories.map((category) => (
                              <option
                                key={category.id}
                                value={category.id}
                                className={theme.option}
                              >
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="md:col-span-1">
                          <label
                            className={`mb-1 block text-xs font-medium ${theme.textMuted}`}
                          >
                            Producto
                          </label>
                          <select
                            value={line.product_id}
                            onChange={(e) =>
                              setEditLines((prev) =>
                                prev.map((item) =>
                                  item.id === line.id
                                    ? { ...item, product_id: e.target.value }
                                    : item
                                )
                              )
                            }
                            className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.select}`}
                          >
                            <option className={theme.option} value="">
                              Seleccionar producto
                            </option>
                            {filteredProducts.map((product) => (
                              <option
                                key={product.id}
                                value={product.id}
                                className={theme.option}
                              >
                                {product.name}
                                {product.category_name
                                  ? ` — ${product.category_name}`
                                  : ""}
                                {product.sku ? ` — ${product.sku}` : ""}
                                {` — L ${Number(product.price || 0).toFixed(
                                  2
                                )} — Stock ${product.stock}`}
                              </option>
                            ))}
                          </select>

                          {selectedProduct && (
                            <p className={`mt-2 text-xs ${theme.textMuted}`}>
                              Categoría: {selectedProduct.category_name || "Sin categoría"} ·
                              Precio: L {Number(selectedProduct.price || 0).toFixed(2)} ·
                              Stock actual: {selectedProduct.stock}
                            </p>
                          )}
                        </div>

                        <div className="md:col-span-1">
                          <label
                            className={`mb-1 block text-xs font-medium ${theme.textMuted}`}
                          >
                            Cantidad
                          </label>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={line.quantity}
                            onChange={(e) =>
                              setEditLines((prev) =>
                                prev.map((item) =>
                                  item.id === line.id
                                    ? {
                                        ...item,
                                        quantity: Math.max(
                                          1,
                                          Number(e.target.value || 1)
                                        ),
                                      }
                                    : item
                                )
                              )
                            }
                            className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
                          />
                        </div>

                        <div className="md:col-span-1 flex items-end">
                          <button
                            type="button"
                            onClick={() =>
                              setEditLines((prev) =>
                                prev.length === 1
                                  ? prev
                                  : prev.filter((item) => item.id !== line.id)
                              )
                            }
                            className={`w-full rounded-xl px-3 py-2 transition ${
                              editLines.length === 1
                                ? "cursor-not-allowed opacity-40"
                                : theme.danger
                            }`}
                            disabled={editLines.length === 1}
                          >
                            <span className="inline-flex items-center justify-center gap-2">
                              <Trash2 className="h-4 w-4" />
                              Quitar línea
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className={`mb-1 block text-sm font-medium ${theme.label}`}>
                    Tipo de descuento
                  </label>
                  <select
                    name="discount_type"
                    value={editDiscountType}
                    onChange={(e) =>
                      setEditDiscountType(e.target.value as DiscountType)
                    }
                    className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.select}`}
                  >
                    <option value="fixed" className={theme.option}>
                      Monto fijo (L)
                    </option>
                    <option value="percent" className={theme.option}>
                      Porcentaje (%)
                    </option>
                  </select>
                </div>

                <div>
                  <label className={`mb-1 block text-sm font-medium ${theme.label}`}>
                    Valor descuento
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="discount_value"
                    value={editDiscountValue}
                    onChange={(e) => setEditDiscountValue(e.target.value)}
                    className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
                  />
                </div>

                <div>
                  <label className={`mb-1 block text-sm font-medium ${theme.label}`}>
                    ISV %
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="tax_percent"
                    value={editTaxPercent}
                    onChange={(e) => setEditTaxPercent(e.target.value)}
                    className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
                  />
                </div>
              </div>

              <div>
                <label className={`mb-1 block text-sm font-medium ${theme.label}`}>
                  Notas
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  defaultValue={selectedSale.notes || ""}
                  className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
                  placeholder="Opcional"
                />
              </div>

              <div className="rounded-2xl border p-4">
                <p className="text-sm font-medium">Resumen actualizado</p>
                <div className={`mt-2 space-y-1 text-sm ${theme.textMuted}`}>
                  <p>Subtotal: L {editPreview.subtotal.toFixed(2)}</p>
                  <p>
                    Descuento aplicado: L {editPreview.discountAmount.toFixed(2)} (
                    {editDiscountType === "percent"
                      ? `${editPreview.discountValue.toFixed(2)}%`
                      : `L ${editPreview.discountValue.toFixed(2)}`})
                  </p>
                  <p>Base gravable: L {editPreview.taxableBase.toFixed(2)}</p>
                  <p>
                    ISV: L {editPreview.taxAmount.toFixed(2)} ({editPreview.taxPercent.toFixed(2)}%)
                  </p>
                  <p className="font-semibold">Total: L {editPreview.total.toFixed(2)}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  className={`rounded-xl px-4 py-2 font-medium transition ${theme.buttonPrimary}`}
                >
                  Guardar cambios
                </button>
              </div>
            </form>

            <form action={deleteSaleAction} className="mt-4">
              <input type="hidden" name="saleId" value={selectedSale.id} />
              <input type="hidden" name="businessId" value={businessId} />
              <button
                type="submit"
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${theme.danger}`}
              >
                Eliminar venta
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}