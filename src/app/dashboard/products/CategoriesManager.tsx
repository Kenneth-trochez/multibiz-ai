"use client";

import { useMemo, useState } from "react";
import {
  createProductCategoryAction,
  deleteProductCategoryAction,
  updateProductCategoryAction,
} from "../../actions/product-categories";

type CategoryRow = {
  id: string;
  name: string;
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

export default function CategoriesManager({
  businessId,
  categories,
  theme,
}: {
  businessId: string;
  categories: CategoryRow[];
  theme: Theme;
}) {
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(categories.length / pageSize));

  const safePage = Math.min(currentPage, totalPages);

  const visibleCategories = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return categories.slice(start, start + pageSize);
  }, [categories, safePage]);

  return (
    <>
      <section className={`rounded-2xl border p-6 shadow-sm ${theme.card}`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Administrar categorías</h2>
            <p className={`mt-1 text-sm ${theme.textMuted}`}>
              Crea categorías propias para el negocio y edita las existentes.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${theme.buttonSecondary}`}
          >
            Editar categorías
          </button>
        </div>

        <form
          action={createProductCategoryAction}
          className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]"
        >
          <input type="hidden" name="businessId" value={businessId} />

          <input
            name="name"
            placeholder="Nueva categoría"
            className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
            required
          />

          <button
            type="submit"
            className={`rounded-xl px-4 py-2 font-medium transition ${theme.buttonPrimary}`}
          >
            Agregar
          </button>
        </form>
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 p-3 sm:p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setShowModal(false);
              setEditingCategoryId(null);
            }}
          />

          <div className="relative flex min-h-full items-start justify-center sm:items-center">
            <div
              className={`mt-4 w-full max-w-2xl overflow-hidden rounded-2xl border shadow-xl ${theme.card} max-h-[92vh]`}
            >
              <div className="flex items-start justify-between gap-3 border-b px-4 py-4 sm:px-6">
                <div className="min-w-0">
                  <h3 className="text-xl font-semibold">Editar categorías</h3>
                  <p className={`mt-1 text-sm ${theme.textMuted}`}>
                    Administra las categorías del negocio actual.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCategoryId(null);
                  }}
                  className={`shrink-0 rounded-xl px-3 py-2 text-sm transition ${theme.buttonSecondary}`}
                >
                  Cerrar
                </button>
              </div>

              <div className="overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 max-h-[calc(92vh-81px)]">
                <div className="space-y-3">
                  {visibleCategories.length === 0 ? (
                    <p className={`text-sm ${theme.textMuted}`}>
                      No hay categorías registradas.
                    </p>
                  ) : (
                    visibleCategories.map((category) => (
                      <div
                        key={category.id}
                        className={`rounded-xl border p-3 ${theme.cardSoft}`}
                      >
                        {editingCategoryId === category.id ? (
                          <form
                            action={updateProductCategoryAction}
                            className="grid gap-3 md:grid-cols-[1fr_auto_auto]"
                          >
                            <input type="hidden" name="categoryId" value={category.id} />

                            <input
                              name="name"
                              defaultValue={category.name}
                              className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
                              required
                            />

                            <button
                              type="submit"
                              className={`rounded-xl px-4 py-2 font-medium transition ${theme.buttonPrimary}`}
                            >
                              Guardar
                            </button>

                            <button
                              type="button"
                              onClick={() => setEditingCategoryId(null)}
                              className={`rounded-xl px-4 py-2 text-sm transition ${theme.buttonSecondary}`}
                            >
                              Cancelar
                            </button>
                          </form>
                        ) : (
                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                              <p className="font-medium">{category.name}</p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingCategoryId(category.id)}
                                className={`rounded-xl px-4 py-2 text-sm transition ${theme.buttonSecondary}`}
                              >
                                Editar
                              </button>

                              <form action={deleteProductCategoryAction}>
                                <input
                                  type="hidden"
                                  name="categoryId"
                                  value={category.id}
                                />
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
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-5 flex flex-col gap-3 border-t pt-4 md:flex-row md:items-center md:justify-between">
                  <p className={`text-sm ${theme.textMuted}`}>
                    Página {safePage} de {totalPages}
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={safePage <= 1}
                      className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                        safePage <= 1
                          ? "pointer-events-none opacity-50"
                          : theme.buttonSecondary
                      }`}
                    >
                      ← Anterior
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      disabled={safePage >= totalPages}
                      className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                        safePage >= totalPages
                          ? "pointer-events-none opacity-50"
                          : theme.buttonSecondary
                      }`}
                    >
                      Siguiente →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}