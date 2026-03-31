"use client";

import { useState } from "react";
import {
  deleteProductAction,
  updateProductAction,
} from "../../actions/products";

type CategoryRow = {
  id: string;
  name: string;
};

type ProductRow = {
  id: string;
  category_id: string | null;
  category_name: string | null;
  name: string;
  description: string | null;
  sku: string | null;
  price: number;
  stock: number;
  active: boolean;
  created_at: string;
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

export default function ProductsList({
  products,
  categories,
  theme,
}: {
  products: ProductRow[];
  categories: CategoryRow[];
  theme: Theme;
}) {
  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(null);

  return (
    <>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Lista de productos</h2>
          <p className={`text-sm ${theme.textMuted}`}>
            {products.length} en esta página
          </p>
        </div>

        {products.length === 0 ? (
          <div className={`rounded-2xl border p-6 ${theme.card}`}>
            <p className={theme.textMuted}>Aún no hay productos registrados.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => setSelectedProduct(product)}
                className={`w-full rounded-2xl border p-4 text-left shadow-sm transition hover:scale-[1.01] ${theme.card}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-base font-semibold">{product.name}</p>
                      <span className={`rounded-full border px-2 py-1 text-[11px] ${theme.cardSoft}`}>
                        {product.category_name || "Sin categoría"}
                      </span>
                    </div>

                    <p className={`truncate text-sm ${theme.textMuted}`}>
                      {product.sku?.trim() ? `SKU: ${product.sku}` : "Sin SKU"}
                    </p>

                    <p className={`mt-1 truncate text-xs ${theme.textMuted}`}>
                      Stock: {product.stock} · L {Number(product.price || 0).toFixed(2)}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className={`text-xs ${theme.textMuted}`}>
                      {product.active ? "Activo" : "Inactivo"}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className={`w-full max-w-2xl rounded-2xl border p-6 shadow-xl ${theme.card}`}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">Editar producto</h3>
                <p className={`mt-1 text-sm ${theme.textMuted}`}>
                  Modifica la información del producto o elimínalo.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className={`rounded-xl px-3 py-2 text-sm transition ${theme.buttonSecondary}`}
              >
                Cerrar
              </button>
            </div>

            <form action={updateProductAction} className="grid gap-4 md:grid-cols-2">
              <input type="hidden" name="productId" value={selectedProduct.id} />

              <div className="md:col-span-2">
                <label className={`mb-1 block text-sm font-medium ${theme.label}`}>
                  Nombre
                </label>
                <input
                  name="name"
                  defaultValue={selectedProduct.name}
                  className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className={`mb-1 block text-sm font-medium ${theme.label}`}>
                  Categoría
                </label>
                <select
                  name="categoryId"
                  defaultValue={selectedProduct.category_id || ""}
                  className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.select}`}
                >
                  <option value="">Sin categoría</option>
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

              <div>
                <label className={`mb-1 block text-sm font-medium ${theme.label}`}>
                  SKU
                </label>
                <input
                  name="sku"
                  defaultValue={selectedProduct.sku || ""}
                  className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
                />
              </div>

              <div>
                <label className={`mb-1 block text-sm font-medium ${theme.label}`}>
                  Precio
                </label>
                <input
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={selectedProduct.price}
                  className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
                  required
                />
              </div>

              <div>
                <label className={`mb-1 block text-sm font-medium ${theme.label}`}>
                  Stock
                </label>
                <input
                  name="stock"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={selectedProduct.stock}
                  className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className={`mb-1 block text-sm font-medium ${theme.label}`}>
                  Descripción
                </label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={selectedProduct.description || ""}
                  className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
                />
              </div>

              <div className="md:col-span-2 flex items-center gap-3">
                <input
                  id={`active_${selectedProduct.id}`}
                  type="checkbox"
                  name="active"
                  defaultChecked={selectedProduct.active}
                />
                <label
                  htmlFor={`active_${selectedProduct.id}`}
                  className={`text-sm font-medium ${theme.label}`}
                >
                  Producto activo
                </label>
              </div>

              <div className="flex flex-wrap gap-3 md:col-span-2">
                <button
                  type="submit"
                  className={`rounded-xl px-4 py-2 font-medium transition ${theme.buttonPrimary}`}
                >
                  Guardar cambios
                </button>
              </div>
            </form>

            <form action={deleteProductAction} className="mt-4">
              <input type="hidden" name="productId" value={selectedProduct.id} />
              <button
                type="submit"
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${theme.danger}`}
              >
                Eliminar
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}