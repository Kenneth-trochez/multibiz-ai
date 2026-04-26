import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Bot,
  Building2,
  BrushCleaning,
  Download,
  ShieldCheck,
  Smartphone,
  Store,
} from "lucide-react";
import { getUser } from "@/lib/auth/getUser";
import { getCurrentBusiness } from "@/lib/tenant/getCurrentBusiness";
import { getThemeClasses } from "@/lib/theme/getThemeClasses";
import HomeBusinessCarousel from "./dashboard/components/HomeBusinessCarousel";

export default async function HomePage() {
  const user = await getUser();

  if (user) {
    const currentBusiness = await getCurrentBusiness();

    if (currentBusiness?.business) {
      redirect("/dashboard");
    }

    redirect("/onboarding");
  }

  const theme = getThemeClasses("warm");

  return (
    <main className={`relative overflow-hidden ${theme.pageBg}`}>
      <div className="pointer-events-none absolute -left-32 top-20 h-80 w-80 rounded-full bg-[#a56a3a]/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-white/50 blur-3xl" />
      <div className="pointer-events-none absolute bottom-24 left-1/2 h-80 w-80 rounded-full bg-[#ead9c8]/60 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.20)_45%,transparent_72%)]" />

      <section className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8">
        <header className={`flex items-center justify-between rounded-3xl border px-4 py-3 ${theme.glassCard}`}>
          <Link href="/" className="flex items-center gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${theme.accent}`}>
              <Store size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black">MultiBiz AI</h1>
              <p className={`text-sm ${theme.textMuted}`}>SaaS multi-negocio</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${theme.buttonSecondary}`}
            >
              Iniciar sesión
            </Link>
            <Link
              href="/signup"
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${theme.buttonPrimary}`}
            >
              Crear cuenta
            </Link>
          </div>
        </header>

        <div className="grid flex-1 items-center gap-12 py-14 lg:grid-cols-[1.02fr_0.98fr]">
          <div>
            <div className={`mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${theme.softAccent}`}>
              <ShieldCheck size={16} />
              Plataforma moderna para negocios
            </div>

            <h2 className="max-w-2xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Administra negocios, citas, ventas y clientes desde una plataforma elegante.
            </h2>

            <p className={`mt-6 max-w-xl text-lg leading-8 ${theme.textMuted}`}>
              Crea tu cuenta, registra tu empresa, personaliza tu marca y controla
              clientes, servicios, personal, ventas, balance y automatización con IA
              desde un solo lugar.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className={`inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 font-bold transition ${theme.buttonPrimary}`}
              >
                Empezar ahora
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className={`rounded-2xl border px-6 py-3 text-center font-bold transition ${theme.buttonSecondary}`}
              >
                Ya tengo cuenta
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                {
                  icon: Building2,
                  title: "Multi-negocio",
                  description: "Cada empresa ve solo su propia información.",
                },
                {
                  icon: BrushCleaning,
                  title: "Marca propia",
                  description: "Logo, nombre, colores y estilo visual por negocio.",
                },
                {
                  icon: Bot,
                  title: "IA integrada",
                  description: "Agenda por voz y control de uso por plan.",
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.title} className={`rounded-3xl border p-5 ${theme.card}`}>
                    <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${theme.softAccent}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-black">{item.title}</h3>
                    <p className={`mt-2 text-sm leading-6 ${theme.textMuted}`}>
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <HomeBusinessCarousel />
        </div>

        <section className={`mt-5 rounded-[2rem] border p-5 ${theme.glassCard}`}>
          <div className="flex items-start gap-4">
            <div className={`flex h-13 w-13 shrink-0 items-center justify-center rounded-3xl p-3 ${theme.softAccent}`}>
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-black">App móvil para tu equipo</h3>
                <span className={`rounded-full border px-3 py-1 text-xs font-bold ${theme.softAccent}`}>
                  Android primero
                </span>
                <span className={`rounded-full border px-3 py-1 text-xs font-bold ${theme.softAccent}`}>
                  Necesitas de plan bronze minimo para usar
                </span>
              </div>
              <p className={`text-sm leading-6 ${theme.textMuted}`}>
                Consulta citas, balance, clientes y notificaciones desde el teléfono.
                Mientras no esté en Play Store, puedes usar una página privada de descarga.
              </p>

              <Link
                href="/app-download"
                className={`mt-4 inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold transition ${theme.buttonPrimary}`}
              >
                <Download className="h-4 w-4" />
                Ver descarga
              </Link>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
