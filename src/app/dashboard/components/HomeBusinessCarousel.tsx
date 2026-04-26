"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  CalendarDays,
  DollarSign,
  Scissors,
  Stethoscope,
  Store,
  Users,
  Wrench,
} from "lucide-react";
import { getThemeClasses } from "@/lib/theme/getThemeClasses";

const demoBusinesses = [
  {
    name: "Nova Studio",
    type: "Salón de belleza",
    icon: Scissors,
    clients: 128,
    services: 24,
    appointments: 36,
    revenue: "$ 4,820.00",
    ai: "Agenda activa",
    tag: "Belleza",
    accent: "bg-[#a56a3a]",
  },
  {
    name: "Clínica Vital",
    type: "Clínica privada",
    icon: Stethoscope,
    clients: 312,
    services: 18,
    appointments: 74,
    revenue: "$ 12,450.00",
    ai: "Agenda por voz",
    tag: "Salud",
    accent: "bg-[#4f9cff]",
  },
  {
    name: "Taller Norte",
    type: "Taller automotriz",
    icon: Wrench,
    clients: 96,
    services: 15,
    appointments: 21,
    revenue: "$ 3,910.00",
    ai: "Recepción IA",
    tag: "Servicios",
    accent: "bg-[#ff7a00]",
  },
  {
    name: "Mini Market Sol",
    type: "Tienda",
    icon: Store,
    clients: 204,
    services: 9,
    appointments: 12,
    revenue: "$ 7,680.00",
    ai: "Soporte activo",
    tag: "Comercio",
    accent: "bg-[#28c493]",
  },
];

export default function HomeBusinessCarousel() {
  const theme = getThemeClasses("warm");
  const [index, setIndex] = useState(0);

  const current = demoBusinesses[index];
  const Icon = current.icon;

  const metrics = useMemo(
    () => [
      { label: "Clientes", value: current.clients, icon: Users },
      { label: "Servicios", value: current.services, icon: Store },
      { label: "Citas", value: current.appointments, icon: CalendarDays },
      { label: "Ingresos", value: current.revenue, icon: DollarSign },
    ],
    [current]
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % demoBusinesses.length);
    }, 3200);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="relative">
      <div className="mb-5">
        <p className={`text-sm font-bold uppercase tracking-[0.22em] ${theme.textMuted}`}>
          Negocios que puedes administrar
        </p>
        <h3 className="mt-2 text-3xl font-black tracking-tight">
          Un panel, varios tipos de negocio.
        </h3>
      </div>

      <div className="relative min-h-[540px]">
        <div className="pointer-events-none absolute -right-10 top-6 h-56 w-56 rounded-full bg-[#a56a3a]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-64 w-64 rounded-full bg-white/60 blur-3xl" />

        <div
          key={current.name}
          className={`relative overflow-hidden rounded-[2rem] border p-6 shadow-2xl transition-all duration-700 ease-out ${theme.glassCard}`}
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/40 to-transparent" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`flex h-16 w-16 items-center justify-center rounded-3xl ${theme.accent}`}>
                <Icon className="h-7 w-7" />
              </div>

              <div>
                <div className={`mb-2 inline-flex rounded-full border px-3 py-1 text-xs font-bold ${theme.softAccent}`}>
                  {current.tag}
                </div>
                <h4 className="text-3xl font-black">{current.name}</h4>
                <p className={`text-sm ${theme.textMuted}`}>{current.type}</p>
              </div>
            </div>

            <div className={`h-3 w-3 rounded-full ${current.accent} shadow-[0_0_24px_rgba(165,106,58,0.45)]`} />
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {metrics.map((metric) => {
              const MetricIcon = metric.icon;

              return (
                <div
                  key={metric.label}
                  className={`rounded-3xl border p-4 transition hover:-translate-y-0.5 ${theme.card}`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <p className={`text-sm font-semibold ${theme.textMuted}`}>
                      {metric.label}
                    </p>
                    <MetricIcon className="h-4 w-4 opacity-70" />
                  </div>
                  <p className="text-2xl font-black">{metric.value}</p>
                </div>
              );
            })}
          </div>

          <div className={`mt-4 rounded-3xl border p-5 ${theme.subtle}`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className={`text-sm font-semibold ${theme.textMuted}`}>
                  Asistente IA
                </p>
                <p className="mt-1 text-lg font-black">{current.ai}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${theme.card}`}>
                <Bot className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className={theme.textMuted}>Carga operativa</span>
              <span>78%</span>
            </div>
            <div className={`h-3 overflow-hidden rounded-full ${theme.subtle}`}>
              <div className="h-full w-[78%] rounded-full bg-[#a56a3a]" />
            </div>
          </div>
        </div>

        <div className="absolute -bottom-5 left-6 right-6 -z-10 h-24 rounded-[2rem] bg-[#a56a3a]/20 blur-2xl" />

        <div className="mt-7 flex justify-center gap-2">
          {demoBusinesses.map((business, businessIndex) => (
            <button
              key={business.name}
              type="button"
              onClick={() => setIndex(businessIndex)}
              className={`h-2.5 rounded-full transition-all ${
                businessIndex === index ? "w-9 bg-[#a56a3a]" : "w-2.5 bg-[#d9c6b2]"
              }`}
              aria-label={`Ver ${business.name}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
