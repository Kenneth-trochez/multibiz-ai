"use client";

import { useState } from "react";
import {
  deactivateCustomerAction,
  deleteCustomerAction,
  reactivateCustomerAction,
  updateCustomerAction,
} from "../../actions/customers";

type CustomerRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
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

export default function CustomersList({
  customers,
  theme,
}: {
  customers: CustomerRow[];
  theme: Theme;
}) {
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRow | null>(null);

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
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-base font-semibold">{customer.name}</p>
                      <span className={`rounded-full border px-2 py-1 text-[11px] ${theme.cardSoft}`}>
                        {customer.active ? "Activo" : "Inactivo"}
                      </span>
                    </div>

                    <p className={`truncate text-sm ${theme.textMuted}`}>
                      {customer.phone?.trim() ? customer.phone : "Sin teléfono"}
                    </p>

                    <p className={`mt-1 truncate text-xs ${theme.textMuted}`}>
                      {customer.email?.trim() ? customer.email : "Sin correo"}
                    </p>
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
                    Modifica la información del cliente, desactívalo o elimínalo si no tiene historial relacionado.
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

                  <div className="md:col-span-2">
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

                  <div>
                    <label className={`mb-1 block text-sm font-medium ${theme.label}`}>
                      Teléfono
                    </label>
                    <input
                      name="phone"
                      defaultValue={selectedCustomer.phone || ""}
                      className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
                    />
                  </div>

                  <div>
                    <label className={`mb-1 block text-sm font-medium ${theme.label}`}>
                      Correo
                    </label>
                    <input
                      name="email"
                      type="email"
                      defaultValue={selectedCustomer.email || ""}
                      className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className={`mb-1 block text-sm font-medium ${theme.label}`}>
                      Dirección
                    </label>
                    <input
                      name="address"
                      defaultValue={selectedCustomer.address || ""}
                      className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className={`mb-1 block text-sm font-medium ${theme.label}`}>
                      Notas
                    </label>
                    <textarea
                      name="notes"
                      rows={3}
                      defaultValue={selectedCustomer.notes || ""}
                      className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
                    />
                  </div>

                  <div className="md:col-span-2 flex items-center gap-3">
                    <input
                      id={`active_${selectedCustomer.id}`}
                      type="checkbox"
                      name="active"
                      defaultChecked={selectedCustomer.active}
                    />
                    <label
                      htmlFor={`active_${selectedCustomer.id}`}
                      className={`text-sm font-medium ${theme.label}`}
                    >
                      Cliente activo
                    </label>
                  </div>

                  <div className="flex flex-col gap-3 md:col-span-2 sm:flex-row sm:flex-wrap">
                    <button
                      type="submit"
                      className={`rounded-xl px-4 py-2 font-medium transition ${theme.buttonPrimary}`}
                    >
                      Guardar cambios
                    </button>
                  </div>
                </form>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  {selectedCustomer.active ? (
                    <form action={deactivateCustomerAction}>
                      <input type="hidden" name="customerId" value={selectedCustomer.id} />
                      <button
                        type="submit"
                        className={`w-full rounded-xl px-4 py-2 text-sm font-medium transition sm:w-auto ${theme.buttonSecondary}`}
                      >
                        Desactivar
                      </button>
                    </form>
                  ) : (
                    <form action={reactivateCustomerAction}>
                      <input type="hidden" name="customerId" value={selectedCustomer.id} />
                      <button
                        type="submit"
                        className={`w-full rounded-xl px-4 py-2 text-sm font-medium transition sm:w-auto ${theme.buttonPrimary}`}
                      >
                        Reactivar
                      </button>
                    </form>
                  )}

                  <form
                    action={deleteCustomerAction}
                    onSubmit={(event) => {
                      const confirmed = window.confirm(
                        "¿Deseas eliminar este cliente? Solo se eliminará si no tiene historial relacionado."
                      );

                      if (!confirmed) {
                        event.preventDefault();
                      }
                    }}
                  >
                    <input type="hidden" name="customerId" value={selectedCustomer.id} />
                    <button
                      type="submit"
                      className={`w-full rounded-xl px-4 py-2 text-sm font-medium transition sm:w-auto ${theme.danger}`}
                    >
                      Eliminar
                    </button>
                  </form>
                </div>

                {!selectedCustomer.active && (
                  <p className={`mt-4 text-sm ${theme.textMuted}`}>
                    Este cliente está inactivo. Puedes reactivarlo cuando vuelva a atenderse en el negocio.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}