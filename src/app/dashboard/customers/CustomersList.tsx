"use client";

import { useState } from "react";
import {
  deleteCustomerAction,
  updateCustomerAction,
} from "../../actions/customers";
import CustomerContactFields from "./CustomerContactFields";

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
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

export default function CustomersList({
  customers,
  theme,
}: {
  customers: Customer[];
  theme: Theme;
}) {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  return (
    <>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Lista de clientes</h2>
          <p className={`text-sm ${theme.textMuted}`}>
            {customers.length} en esta página
          </p>
        </div>

        {customers.length === 0 ? (
          <div className={`rounded-2xl border p-6 ${theme.card}`}>
            <p className={theme.textMuted}>Aún no hay clientes registrados.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {customers.map((customer) => (
              <button
                key={customer.id}
                type="button"
                onClick={() => setSelectedCustomer(customer)}
                className={`w-full rounded-2xl border p-4 text-left shadow-sm transition hover:scale-[1.01] ${theme.card}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold">{customer.name}</p>
                    <p className={`truncate text-sm ${theme.textMuted}`}>
                      {customer.address?.trim()
                        ? customer.address
                        : customer.notes?.trim()
                          ? customer.notes
                          : customer.email?.trim()
                            ? customer.email
                            : customer.phone?.trim()
                              ? customer.phone
                              : "Sin descripción"}
                    </p>
                  </div>

                  <div className={`shrink-0 text-xs ${theme.textMuted}`}>
                    {new Date(customer.created_at).toLocaleDateString("es-HN")}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {selectedCustomer && (
        <div className="fixed inset-0 z-50 p-3 sm:p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSelectedCustomer(null)}
          />

          <div className="relative flex min-h-full items-start justify-center sm:items-center">
            <div
              className={`mt-4 w-full max-w-2xl overflow-hidden rounded-2xl border shadow-xl ${theme.card} max-h-[92vh]`}
            >
              <div className="flex items-start justify-between gap-3 border-b px-4 py-4 sm:px-6">
                <div className="min-w-0">
                  <h3 className="text-xl font-semibold">Editar cliente</h3>
                  <p className={`mt-1 text-sm ${theme.textMuted}`}>
                    Modifica la información del cliente o elimínalo.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className={`shrink-0 rounded-xl px-3 py-2 text-sm transition ${theme.buttonSecondary}`}
                >
                  Cerrar
                </button>
              </div>

              <div className="overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 max-h-[calc(92vh-81px)]">
                <form action={updateCustomerAction} className="grid gap-4 md:grid-cols-2">
                  <input type="hidden" name="customerId" value={selectedCustomer.id} />

                  <div>
                    <label className={`mb-1 block text-sm font-medium ${theme.label}`}>
                      Nombre
                    </label>
                    <input
                      name="name"
                      defaultValue={selectedCustomer.name}
                      className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
                      required
                    />
                  </div>

                  <CustomerContactFields
                    theme={theme}
                    initialPhone={selectedCustomer.phone || ""}
                    initialEmail={selectedCustomer.email || ""}
                  />

                  <div>
                    <label className={`mb-1 block text-sm font-medium ${theme.label}`}>
                      Dirección
                    </label>
                    <input
                      name="address"
                      defaultValue={selectedCustomer.address || ""}
                      className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
                      placeholder="Opcional"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className={`mb-1 block text-sm font-medium ${theme.label}`}>
                      Notas
                    </label>
                    <textarea
                      name="notes"
                      rows={4}
                      defaultValue={selectedCustomer.notes || ""}
                      className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
                    />
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

                <form action={deleteCustomerAction} className="mt-4">
                  <input type="hidden" name="customerId" value={selectedCustomer.id} />
                  <button
                    type="submit"
                    className={`w-full rounded-xl px-4 py-2 text-sm font-medium transition sm:w-auto ${theme.danger}`}
                  >
                    Eliminar
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}