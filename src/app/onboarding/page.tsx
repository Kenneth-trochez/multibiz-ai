import { redirect } from "next/navigation";
import { Building2, MapPin, Phone, BriefcaseBusiness } from "lucide-react";
import { createBusinessAction } from "@/app/actions/auth";
import { getCurrentBusiness } from "@/lib/tenant/getCurrentBusiness";

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

  return (
    <main className="min-h-screen bg-[#f6f1e8] text-[#2f241d]">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="flex flex-col justify-center">
            <div className="mb-4 inline-flex w-fit items-center rounded-full border border-[#e3d4bf] bg-white/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-[#8d582e] backdrop-blur">
              Configuración inicial
            </div>

            <h1 className="max-w-2xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
              Crea tu negocio y empieza a usar tu dashboard
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#6b5b4d] sm:text-base">
              Configura el primer negocio dentro de tu cuenta SaaS. Después
              podrás administrar clientes, servicios, personal, citas y métricas
              desde un solo lugar.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#eadfce] bg-white p-4 shadow-sm">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#f3e8dc] text-[#8d582e]">
                  <Building2 className="h-5 w-5" />
                </div>
                <h2 className="text-sm font-semibold">Multi-negocio</h2>
                <p className="mt-1 text-sm text-[#6b5b4d]">
                  Estructura preparada para trabajar por negocio y mantener los
                  datos separados correctamente.
                </p>
              </div>

              <div className="rounded-2xl border border-[#eadfce] bg-white p-4 shadow-sm">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#f3e8dc] text-[#8d582e]">
                  <BriefcaseBusiness className="h-5 w-5" />
                </div>
                <h2 className="text-sm font-semibold">Listo para crecer</h2>
                <p className="mt-1 text-sm text-[#6b5b4d]">
                  Deja tu negocio listo para luego configurar servicios,
                  personal, branding y citas.
                </p>
              </div>
            </div>
          </section>

          <section className="flex items-center justify-center">
            <div className="w-full max-w-xl rounded-3xl border border-[#eadfce] bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold">Crear negocio</h2>
                <p className="mt-2 text-sm text-[#6b5b4d]">
                  Completa esta información para generar la base inicial de tu
                  espacio de trabajo.
                </p>
              </div>

              {params.error && (
                <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {params.error}
                </div>
              )}

              <form action={createBusinessAction} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#3f3128]">
                    Nombre del negocio
                  </label>
                  <div className="relative">
                    <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8f7a68]" />
                    <input
                      type="text"
                      name="businessName"
                      className="w-full rounded-2xl border border-[#d9c6b2] bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#a56a3a]"
                      placeholder="Ej. Estilo Pro, Taller Norte, Clínica Nova"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#3f3128]">
                    Tipo de negocio
                  </label>
                  <div className="relative">
                    <BriefcaseBusiness className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8f7a68]" />
                    <select
                      name="businessType"
                      className="w-full rounded-2xl border border-[#d9c6b2] bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#a56a3a]"
                      required
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Selecciona una opción
                      </option>
                      <option value="general">General</option>
                      <option value="barbershop">Barbería</option>
                      <option value="beauty_salon">Salón de belleza</option>
                      <option value="spa">Spa</option>
                      <option value="clinic">Clínica</option>
                      <option value="workshop">Taller</option>
                      <option value="store">Tienda</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#3f3128]">
                    Teléfono
                  </label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8f7a68]" />
                    <input
                      type="text"
                      name="phone"
                      className="w-full rounded-2xl border border-[#d9c6b2] bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#a56a3a]"
                      placeholder="Opcional"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#3f3128]">
                    Dirección
                  </label>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8f7a68]" />
                    <input
                      type="text"
                      name="address"
                      className="w-full rounded-2xl border border-[#d9c6b2] bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#a56a3a]"
                      placeholder="Opcional"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="mt-2 w-full rounded-2xl bg-[#a56a3a] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#8d582e]"
                >
                  Crear negocio
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}