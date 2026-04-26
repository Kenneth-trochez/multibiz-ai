import { redirect } from "next/navigation";
import {
  Building2,
  MapPin,
  Phone,
  BriefcaseBusiness,
  Sparkles,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { createBusinessAction } from "@/app/actions/auth";
import { getCurrentBusiness } from "@/lib/tenant/getCurrentBusiness";
import { getThemeClasses } from "@/lib/theme/getThemeClasses";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const currentBusiness = await getCurrentBusiness();

  if (currentBusiness?.business) {
    redirect("/dashboard");
  }

  const theme = getThemeClasses("warm");

  return (
    <main className={`relative overflow-hidden ${theme.pageBg}`}>
      <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-[#a56a3a]/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-white/50 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.22)_45%,transparent_70%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="flex flex-col justify-center">
            <div className={`mb-5 inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${theme.softAccent}`}>
              <Sparkles className="h-4 w-4" />
              Configuración inicial
            </div>

            <h1 className="max-w-2xl text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Crea tu negocio y activa tu espacio de trabajo
            </h1>

            <p className={`mt-5 max-w-2xl text-base leading-7 ${theme.textMuted}`}>
              Configura la base de tu negocio en MultiBiz AI. Después podrás
              administrar clientes, servicios, personal, citas, ventas y métricas
              desde un solo dashboard.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className={`rounded-3xl border p-5 ${theme.card}`}>
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${theme.softAccent}`}>
                  <Building2 className="h-5 w-5" />
                </div>
                <h2 className="text-base font-bold">Multi-negocio</h2>
                <p className={`mt-2 text-sm leading-6 ${theme.textMuted}`}>
                  Cada negocio mantiene sus datos separados: clientes, citas,
                  ventas, servicios y personal.
                </p>
              </div>

              <div className={`rounded-3xl border p-5 ${theme.card}`}>
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${theme.softAccent}`}>
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h2 className="text-base font-bold">Listo para escalar</h2>
                <p className={`mt-2 text-sm leading-6 ${theme.textMuted}`}>
                  Tu negocio queda preparado para usar temas, horarios, métricas,
                  roles y automatización con IA.
                </p>
              </div>
            </div>
          </section>

          <section className="flex items-center justify-center">
            <div className={`w-full max-w-xl rounded-[2rem] border p-6 shadow-sm sm:p-8 ${theme.glassCard}`}>
              <div className="mb-7">
                <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-3xl ${theme.accent}`}>
                  <BriefcaseBusiness className="h-6 w-6" />
                </div>

                <h2 className="text-2xl font-black">Crear negocio</h2>
                <p className={`mt-2 text-sm leading-6 ${theme.textMuted}`}>
                  Completa la información inicial para generar tu espacio de
                  trabajo.
                </p>
              </div>

              {params.error && (
                <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {params.error}
                </div>
              )}

              <form action={createBusinessAction} className="space-y-4">
                <div>
                  <label className={`mb-1.5 block text-sm font-semibold ${theme.label}`}>
                    Nombre del negocio
                  </label>
                  <div className="relative">
                    <Building2 className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${theme.textMuted}`} />
                    <input
                      type="text"
                      name="businessName"
                      className={`w-full rounded-2xl border py-3 pl-10 pr-4 text-sm outline-none transition ${theme.input}`}
                      placeholder="Ej. Estilo Pro, Taller Norte, Clínica Nova"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className={`mb-1.5 block text-sm font-semibold ${theme.label}`}>
                    Tipo de negocio
                  </label>
                  <div className="relative">
                    <BriefcaseBusiness className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${theme.textMuted}`} />
                    <select
                      name="businessType"
                      className={`w-full rounded-2xl border py-3 pl-10 pr-4 text-sm outline-none transition ${theme.select}`}
                      required
                      defaultValue=""
                    >
                      <option value="" disabled className={theme.option}>
                        Selecciona una opción
                      </option>
                      <option value="general" className={theme.option}>General</option>
                      <option value="barbershop" className={theme.option}>Barbería</option>
                      <option value="beauty_salon" className={theme.option}>Salón de belleza</option>
                      <option value="spa" className={theme.option}>Spa</option>
                      <option value="clinic" className={theme.option}>Clínica</option>
                      <option value="workshop" className={theme.option}>Taller</option>
                      <option value="store" className={theme.option}>Tienda</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={`mb-1.5 block text-sm font-semibold ${theme.label}`}>
                    Teléfono
                  </label>
                  <div className="relative">
                    <Phone className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${theme.textMuted}`} />
                    <input
                      type="text"
                      name="phone"
                      className={`w-full rounded-2xl border py-3 pl-10 pr-4 text-sm outline-none transition ${theme.input}`}
                      placeholder="Opcional"
                    />
                  </div>
                </div>

                <div>
                  <label className={`mb-1.5 block text-sm font-semibold ${theme.label}`}>
                    Dirección
                  </label>
                  <div className="relative">
                    <MapPin className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${theme.textMuted}`} />
                    <input
                      type="text"
                      name="address"
                      className={`w-full rounded-2xl border py-3 pl-10 pr-4 text-sm outline-none transition ${theme.input}`}
                      placeholder="Opcional"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className={`mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition ${theme.buttonPrimary}`}
                >
                  Crear negocio
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}