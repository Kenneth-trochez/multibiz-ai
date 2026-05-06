"use client";

import { useMemo, useState } from "react";
import { formatMoneyByTimezone } from "@/lib/money/currency";
import {
  deactivateServiceAction,
  deleteServiceAction,
  reactivateServiceAction,
  updateServiceAction,
} from "../../actions/services";

type DiscountType = "fixed" | "percent";

type ServiceRow = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  active: boolean;
  created_at: string;
  discount_enabled: boolean;
  discount_name: string | null;
  discount_type: DiscountType | null;
  discount_value: number;
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

function calculateDiscountedPrice(service: ServiceRow) {
  const price = Number(service.price || 0);
  const discountValue = Number(service.discount_value || 0);

  if (!service.discount_enabled || discountValue <= 0) {
    return price;
  }

  if (service.discount_type === "percent") {
    const percent = Math.min(100, Math.max(0, discountValue));
    return Math.max(0, price - price * (percent / 100));
  }

  return Math.max(0, price - discountValue);
}

function getDiscountLabel(service: ServiceRow, timezone: string) {
  if (!service.discount_enabled || !service.discount_value) {
    return null;
  }

  const name = service.discount_name?.trim() || "Descuento";
  const value =
    service.discount_type === "percent"
      ? `${service.discount_value}%`
      : formatMoneyByTimezone(service.discount_value, timezone);

  return `${name}: ${value}`;
}

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

  const selectedDiscountedPrice = useMemo(() => {
    if (!selectedService) return 0;
    return calculateDiscountedPrice(selectedService);
  }, [selectedService]);

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
            {services.map((service) => {
              const discountLabel = getDiscountLabel(service, timezone);
              const discountedPrice = calculateDiscountedPrice(service);

              return (
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
                        {discountLabel && (
                          <span className="rounded-full border border-green-200 bg-green-50 px-2 py-1 text-[11px] font-medium text-green-700">
                            {discountLabel}
                          </span>
                        )}
                      </div>

                      <p className={`truncate text-sm ${theme.textMuted}`}>
                        {service.description?.trim() || "Sin descripción"}
                      </p>

                      <p className={`mt-1 truncate text-xs ${theme.textMuted}`}>
                        {service.duration_minutes} min ·{" "}
                        {discountLabel ? (
                          <>
                            <span className="line-through opacity-70">
                              {formatMoneyByTimezone(service.price, timezone)}
                            </span>{" "}
                            <span className="font-semibold">
                              {formatMoneyByTimezone(discountedPrice, timezone)}
                            </span>
                          </>
                        ) : (
                          formatMoneyByTimezone(service.price, timezone)
                        )}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {selectedService && (
        <div className="fixed inset-0 z-50 p-3 sm:p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSelectedService(null)}
          />

          <div className="relative flex min-h-[100dvh] items-start justify-center py-3 sm:items-center sm:py-6">
            <div
              className={`flex max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border shadow-xl sm:max-h-[calc(100dvh-3rem)] ${theme.card}`}
            >
              <div className="shrink-0 border-b px-4 py-4 sm:px-6">
                <div className="flex items-start justify-between gap-3">
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
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
                <form id="service-edit-form" action={updateServiceAction} className="grid gap-4">
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
                        Precio normal
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

                  <div className={`rounded-2xl border p-4 ${theme.cardSoft}`}>
                    <label className="flex items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        name="discount_enabled"
                        defaultChecked={selectedService.discount_enabled}
                      />
                      <span className={`font-medium ${theme.label}`}>
                        Este servicio tiene descuento especial
                      </span>
                    </label>

                    <div className="mt-4 grid gap-4">
                      <div>
                        <label className={`mb-1 block text-sm font-medium ${theme.label}`}>
                          Nombre del descuento
                        </label>
                        <input
                          name="discount_name"
                          defaultValue={selectedService.discount_name || ""}
                          className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
                          placeholder="Ej. Tercera edad, estudiante, promoción"
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className={`mb-1 block text-sm font-medium ${theme.label}`}>
                            Tipo de descuento
                          </label>
                          <select
                            name="discount_type"
                            defaultValue={selectedService.discount_type || "percent"}
                            className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.select}`}
                          >
                            <option className={theme.option} value="percent">
                              Porcentaje %
                            </option>
                            <option className={theme.option} value="fixed">
                              Monto fijo
                            </option>
                          </select>
                        </div>

                        <div>
                          <label className={`mb-1 block text-sm font-medium ${theme.label}`}>
                            Valor
                          </label>
                          <input
                            name="discount_value"
                            type="number"
                            min="0"
                            step="0.01"
                            defaultValue={selectedService.discount_value || ""}
                            className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
                            placeholder="Ej. 10"
                          />
                        </div>
                      </div>

                      {selectedService.discount_enabled && selectedService.discount_value > 0 && (
                        <p className={`text-xs ${theme.textMuted}`}>
                          Precio con descuento estimado:{" "}
                          <span className="font-semibold">
                            {formatMoneyByTimezone(selectedDiscountedPrice, timezone)}
                          </span>
                        </p>
                      )}
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

                  {!selectedService.active && (
                    <p className={`text-sm ${theme.textMuted}`}>
                      Este servicio está inactivo. Puedes reactivarlo cuando quieras volver a ofrecerlo.
                    </p>
                  )}
                </form>
              </div>

              <div className={`shrink-0 border-t px-4 py-4 sm:px-6 ${theme.card}`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-between">
                  <button
                    type="submit"
                    form="service-edit-form"
                    className={`rounded-xl px-4 py-2 font-medium transition ${theme.buttonPrimary}`}
                  >
                    Guardar cambios
                  </button>

                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
