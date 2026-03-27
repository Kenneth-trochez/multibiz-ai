"use client";

import { useState } from "react";
import {
  deleteServiceAction,
  updateServiceAction,
} from "../../actions/services";

type Service = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
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

function splitDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return { hours, minutes };
}

function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${minutes} min`;
}

export default function ServicesList({
  services,
  theme,
}: {
  services: Service[];
  theme: Theme;
}) {
  const [selectedService, setSelectedService] = useState<Service | null>(null);

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
                    <p className="truncate text-base font-semibold">
                      {service.name}
                    </p>
                    <p className={`truncate text-sm ${theme.textMuted}`}>
                      {service.description?.trim()
                        ? service.description
                        : `${formatDuration(service.duration_minutes)} • L ${Number(
                            service.price
                          ).toFixed(2)}`}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold">
                      L {Number(service.price).toFixed(2)}
                    </p>
                    <p className={`text-xs ${theme.textMuted}`}>
                      {service.active ? "Activo" : "Inactivo"}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className={`w-full max-w-2xl rounded-2xl border p-6 shadow-xl ${theme.card}`}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">Editar servicio</h3>
                <p className={`mt-1 text-sm ${theme.textMuted}`}>
                  Modifica la información del servicio o elimínalo.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedService(null)}
                className={`rounded-xl px-3 py-2 text-sm transition ${theme.buttonSecondary}`}
              >
                Cerrar
              </button>
            </div>

            <form action={updateServiceAction} className="grid gap-4 md:grid-cols-2">
              <input type="hidden" name="serviceId" value={selectedService.id} />

              <div className="md:col-span-2">
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

              <div className="md:col-span-2">
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

              {(() => {
                const { hours, minutes } = splitDuration(
                  selectedService.duration_minutes
                );

                return (
                  <div>
                    <label className={`mb-1 block text-sm font-medium ${theme.label}`}>
                      Duración
                    </label>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        name="duration_hours"
                        min="0"
                        defaultValue={hours}
                        className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
                        required
                      />

                      <input
                        type="number"
                        name="duration_minutes_input"
                        min="0"
                        max="59"
                        defaultValue={minutes}
                        className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
                        required
                      />
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className={`mb-1 block text-sm font-medium ${theme.label}`}>
                  Precio
                </label>
                <input
                  type="number"
                  name="price"
                  min="0"
                  step="0.01"
                  defaultValue={selectedService.price}
                  className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
                  required
                />
              </div>

              <div className="md:col-span-2 flex items-center gap-3">
                <input
                  id={`active_${selectedService.id}`}
                  type="checkbox"
                  name="is_active"
                  defaultChecked={selectedService.active}
                />
                <label
                  htmlFor={`active_${selectedService.id}`}
                  className={`text-sm font-medium ${theme.label}`}
                >
                  Servicio activo
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

            <form action={deleteServiceAction} className="mt-4">
              <input type="hidden" name="serviceId" value={selectedService.id} />
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