import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Users,
  Scissors,
  BellRing,
  BarChart3,
  Bot,
} from "lucide-react";
import { getThemeClasses } from "@/lib/theme/getThemeClasses";

export const metadata = {
  title: "Software para Tiendas | MultiBiz AI",
  description:
    "Sistema para tiendas con gestión de citas, clientes, servicios, ventas, balance y recordatorios desde app móvil.",
  keywords: [
    "software para Tiendas",
    "sistema de citas para Tienda",
    "app para Tienda",
    "gestión de Tienda",
    "agenda para tienda",
    "MultiBiz AI",
  ],
};

export default function BarberiasPage() {
  const theme = getThemeClasses("warm");

  const features = [
    {
      icon: CalendarDays,
      title: "Agenda de citas",
      text: "Organiza citas por día, estado, cliente, servicio y personal.",
    },
    {
      icon: Users,
      title: "Clientes registrados",
      text: "Guarda datos de clientes, historial y notas importantes.",
    },
    {
      icon: Scissors,
      title: "Servicios y personal",
      text: "Administra servicios si tienes, prestamos, precios, duración y staff disponible.",
    },
    {
      icon: BellRing,
      title: "Notificaciones móviles",
      text: "Recibe avisos de citas nuevas, cambios y recordatorios.",
    },
    {
      icon: BarChart3,
      title: "Balance del negocio",
      text: "Consulta ingresos por citas, ventas, servicios y productos.",
    },
    {
      icon: Bot,
      title: "Asistente con IA",
      text: "Permite automatizar reservas por voz según el plan contratado.",
    },
  ];

  return (
    <main className={`relative min-h-screen overflow-hidden px-4 py-10 ${theme.pageBg}`}>
      <div className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-[#a56a3a]/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-white/50 blur-3xl" />

      <div className="relative mx-auto max-w-6xl">
        <Link
          href="/"
          className={`mb-6 inline-flex items-center gap-2 text-sm font-semibold ${theme.textMuted}`}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>

        <section className={`rounded-[2rem] border p-6 shadow-xl md:p-10 ${theme.glassCard}`}>
          <div className="max-w-3xl">
            <div className={`mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold ${theme.softAccent}`}>
              <Scissors className="h-4 w-4" />
              Solución para Tiendas
            </div>

            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
              Software para Tiendas con citas, clientes y control de ingresos.
            </h1>

            <p className={`mt-5 text-base leading-7 ${theme.textMuted}`}>
              MultiBiz AI ayuda a Tiendas a organizar su agenda, administrar
              clientes, controlar servicios, registrar ventas y consultar el
              balance del negocio desde el SaaS y la app móvil.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-bold transition ${theme.buttonPrimary}`}
              >
                Crear cuenta
              </Link>

              <Link
                href="/login"
                className={`inline-flex items-center justify-center rounded-2xl border px-5 py-3 text-sm font-bold transition ${theme.buttonSecondary}`}
              >
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div key={feature.title} className={`rounded-[1.5rem] border p-5 shadow-sm ${theme.card}`}>
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${theme.softAccent}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-black">{feature.title}</h2>
                <p className={`mt-2 text-sm leading-6 ${theme.textMuted}`}>
                  {feature.text}
                </p>
              </div>
            );
          })}
        </section>

        <section className={`mt-8 rounded-[2rem] border p-6 md:p-8 ${theme.glassCard}`}>
          <h2 className="text-2xl font-black">
            ¿Por qué una tienda debería usar MultiBiz AI?
          </h2>

          <p className={`mt-3 max-w-3xl text-sm leading-7 ${theme.textMuted}`}>
            Porque centraliza la operación diaria: citas, clientes, servicios,
            staff, productos, ventas y balance. Esto reduce desorden, mejora el
            seguimiento del cliente y permite ver mejor cómo se mueve el negocio.
          </p>

          <div className="mt-6">
            <Link
              href="/signup"
              className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-bold transition ${theme.buttonPrimary}`}
            >
              Empezar con MultiBiz AI
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}