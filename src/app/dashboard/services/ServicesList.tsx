"use client";

import { useState } from "react";
import { formatMoneyByTimezone } from "@/lib/money/currency";
import {
  deactivateServiceAction,
  deleteServiceAction,
  reactivateServiceAction,
  updateServiceAction,
} from "../../actions/services";

type ServiceRow = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
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

export default function ServicesList({
  services,
  theme,
  timezone,
}: {
  services: ServiceRow[];
  theme: Theme;
  timezone: string;
}) {
  const [selectedService, setSelectedService] = useState<ServiceRow | null>(null);

  return (
    <>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Lista de servicios</h2>
          <p className={`text-sm ${theme.textMuted}`}>
            {services.length} en esta página
          </p>
        </div>

        {services.length === 0 ? (
          <div className={`rounded-2xl border p-6 ${theme.card}`}>
            <p className={theme.textMuted}>Aún no hay servicios registrados.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {services.map((service) => (
              <button
                key={service.id}
                type="button"
                onClick={() => setSelectedService(service)}
                className={`w-full rounded-2xl border p-4 text-left shadow-sm transition hover:scale-[1.01] ${theme.card}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-base font-semibold">{service.name}</p>
                      <span className={`rounded-full border px-2 py-1 text-[11px] ${theme.cardSoft}`}>
                        {service.active ? "Activo" : "Inactivo"}
                      </span>
                    </div>

                    <p className={`truncate text-sm ${theme.textMuted}`}>
                      {service.description?.trim() || "Sin descripción"}
                    </p>

                    <p className={`mt-1 truncate text-xs ${theme.textMuted}`}>
                      {service.duration_minutes} min ·{" "}
                      {formatMoneyByTimezone(service.price, timezone)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {selectedService && (
        <div className="fixed inset-0 z-50 p-3 sm:p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSelectedService(null)}
          />

          <div className="relative flex min-h-full items-start justify-center sm:items-center">
            <div
              className={`mt-4 w-full max-w-2xl overflow-hidden rounded-2xl border shadow-xl ${theme.card} max-h-[92vh]`}
            >
              <div className="flex items-start justify-between gap-3 border-b px-4 py-4 sm:px-6">
                <div className="min-w-0">
                  <h3 className="text-xl font-semibold">Editar servicio</h3>
                  <p className={`mt-1 text-sm ${theme.textMuted}`}>
                    Modifica la información del servicio, desactívalo o elimínalo si no tiene historial relacionado.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedService(null)}
                  className={`shrink-0 rounded-xl px-3 py-2 text-sm transition ${theme.buttonSecondary}`}
                >
                  Cerrar
                </button>
              </div>

              <div className="overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 max-h-[calc(92vh-81px)]">
                <form action={updateServiceAction} className="grid gap-4">
                  <input type="hidden" name="serviceId" value={selectedService.id} />

                  <div>
                    <label className={`mb-1 block text-sm font-medium ${theme.label}`}>
                      Nombre
                    </label>
                    <input
                      name="name"
                      defaultValue={selectedService.name}
                      className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
                      required
                    />
                  </div>

                  <div>
                    <label className={`mb-1 block text-sm font-medium ${theme.label}`}>
                      Descripción
                    </label>
                    <textarea
                      name="description"
                      rows={3}
                      defaultValue={selectedService.description || ""}
                      className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className={`mb-1 block text-sm font-medium ${theme.label}`}>
                        Precio
                      </label>
                      <input
                        name="price"
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={selectedService.price}
                        className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
                        required
                      />
                    </div>

                    <div>
                      <label className={`mb-1 block text-sm font-medium ${theme.label}`}>
                        Duración (minutos)
                      </label>
                      <input
                        name="duration"
                        type="number"
                        min="1"
                        step="1"
                        defaultValue={selectedService.duration_minutes}
                        className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      id={`active_${selectedService.id}`}
                      type="checkbox"
                      name="active"
                      defaultChecked={selectedService.active}
                    />
                    <label
                      htmlFor={`active_${selectedService.id}`}
                      className={`text-sm font-medium ${theme.label}`}
                    >
                      Servicio activo
                    </label>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <button
                      type="submit"
                      className={`rounded-xl px-4 py-2 font-medium transition ${theme.buttonPrimary}`}
                    >
                      Guardar cambios
                    </button>
                  </div>
                </form>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  {selectedService.active ? (
                    <form action={deactivateServiceAction}>
                      <input type="hidden" name="serviceId" value={selectedService.id} />
                      <button
                        type="submit"
                        className={`w-full rounded-xl px-4 py-2 text-sm font-medium transition sm:w-auto ${theme.buttonSecondary}`}
                      >
                        Desactivar
                      </button>
                    </form>
                  ) : (
                    <form action={reactivateServiceAction}>
                      <input type="hidden" name="serviceId" value={selectedService.id} />
                      <button
                        type="submit"
                        className={`w-full rounded-xl px-4 py-2 text-sm font-medium transition sm:w-auto ${theme.buttonPrimary}`}
                      >
                        Reactivar
                      </button>
                    </form>
                  )}

                  <form
                    action={deleteServiceAction}
                    onSubmit={(event) => {
                      const confirmed = window.confirm(
                        "¿Deseas eliminar este servicio? Solo se eliminará si no tiene historial relacionado."
                      );

                      if (!confirmed) {
                        event.preventDefault();
                      }
                    }}
                  >
                    <input type="hidden" name="serviceId" value={selectedService.id} />
                    <button
                      type="submit"
                      className={`w-full rounded-xl px-4 py-2 text-sm font-medium transition sm:w-auto ${theme.danger}`}
                    >
                      Eliminar
                    </button>
                  </form>
                </div>

                {!selectedService.active && (
                  <p className={`mt-4 text-sm ${theme.textMuted}`}>
                    Este servicio está inactivo. Puedes reactivarlo cuando quieras volver a ofrecerlo.
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