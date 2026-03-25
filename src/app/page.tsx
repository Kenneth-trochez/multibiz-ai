import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, BrushCleaning, ShieldCheck, Store } from "lucide-react";
import { getUser } from "@/lib/auth/getUser";
import { getCurrentBusiness } from "@/lib/tenant/getCurrentBusiness";

export default async function HomePage() {
  const user = await getUser();

  if (user) {
    const currentBusiness = await getCurrentBusiness();

    if (currentBusiness?.business) {
      redirect("/dashboard");
    }

    redirect("/onboarding");
  }

  return (
    <main className="min-h-screen bg-[#f6f1e8] text-[#2f241d]">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#3b2f2a] text-[#fffaf3] shadow-sm">
              <Store size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#2f241d]">MultiBiz AI</h1>
              <p className="text-sm text-[#7a6858]">SaaS multi-negocio</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl border border-[#d9c6b2] bg-[#fffaf3] px-4 py-2 text-sm font-medium text-[#3b2f2a] transition hover:bg-[#f3e8dc]"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-[#a56a3a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#8d582e]"
            >
              Crear cuenta
            </Link>
          </div>
        </header>

        <div className="grid flex-1 items-center gap-12 py-14 lg:grid-cols-2">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#e7d8c7] bg-[#fffaf3] px-4 py-2 text-sm text-[#6b5b4d] shadow-sm">
              <ShieldCheck size={16} />
              Plataforma moderna para negocios
            </div>

            <h2 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl text-[#2f241d]">
              Administra varios negocios desde una plataforma elegante, clara y
              escalable.
            </h2>

            <p className="mt-5 max-w-xl text-lg leading-8 text-[#6b5b4d]">
              Crea tu cuenta, registra tu empresa, personaliza tu marca y
              controla clientes, servicios, personal y operaciones desde un solo
              lugar.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="rounded-2xl bg-[#a56a3a] px-6 py-3 text-center font-medium text-white shadow-sm transition hover:bg-[#8d582e]"
              >
                Empezar ahora
              </Link>
              <Link
                href="/login"
                className="rounded-2xl border border-[#d9c6b2] bg-[#fffaf3] px-6 py-3 text-center font-medium text-[#3b2f2a] transition hover:bg-[#f3e8dc]"
              >
                Ya tengo cuenta
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#e7d8c7] bg-[#fffaf3] p-4 shadow-sm">
                <Building2 className="mb-3 text-[#8d582e]" size={20} />
                <h3 className="font-semibold text-[#2f241d]">Multi-negocio</h3>
                <p className="mt-1 text-sm text-[#6b5b4d]">
                  Cada empresa ve solo su propia información.
                </p>
              </div>

              <div className="rounded-2xl border border-[#e7d8c7] bg-[#fffaf3] p-4 shadow-sm">
                <BrushCleaning className="mb-3 text-[#8d582e]" size={20} />
                <h3 className="font-semibold text-[#2f241d]">Marca propia</h3>
                <p className="mt-1 text-sm text-[#6b5b4d]">
                  Logo, nombre y estilo visual por negocio.
                </p>
              </div>

              <div className="rounded-2xl border border-[#e7d8c7] bg-[#fffaf3] p-4 shadow-sm">
                <ShieldCheck className="mb-3 text-[#8d582e]" size={20} />
                <h3 className="font-semibold text-[#2f241d]">Seguro</h3>
                <p className="mt-1 text-sm text-[#6b5b4d]">
                  Acceso separado por negocio y por roles.
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[2rem] border border-[#e7d8c7] bg-[#fffaf3] p-6 shadow-xl">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#7a6858]">Vista previa</p>
                  <h3 className="text-xl font-bold text-[#2f241d]">
                    Panel del negocio
                  </h3>
                </div>
                <div className="rounded-xl bg-[#f3e8dc] px-3 py-1 text-sm font-medium text-[#5a473c]">
                  Demo
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-2xl border border-[#eadfce] bg-[#f9f2e8] p-4">
                  <p className="text-sm text-[#7a6858]">Negocio activo</p>
                  <h4 className="text-lg font-semibold text-[#2f241d]">
                    Nova Studio
                  </h4>
                  <p className="text-sm text-[#6b5b4d]">
                    Tipo: Salón de belleza
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[#eadfce] bg-white p-4">
                    <p className="text-sm text-[#7a6858]">Clientes</p>
                    <p className="mt-2 text-3xl font-bold text-[#2f241d]">
                      128
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[#eadfce] bg-white p-4">
                    <p className="text-sm text-[#7a6858]">Servicios</p>
                    <p className="mt-2 text-3xl font-bold text-[#2f241d]">
                      24
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#eadfce] bg-white p-4">
                  <p className="text-sm text-[#7a6858]">Personalización</p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full border border-[#d8c3ab] bg-[#3b2f2a]" />
                    <div className="h-8 w-8 rounded-full border border-[#d8c3ab] bg-[#a56a3a]" />
                    <div className="h-8 w-8 rounded-full border border-[#d8c3ab] bg-[#f3e8dc]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -left-6 -top-6 h-24 w-24 rounded-full bg-[#ead9c8] blur-3xl" />
            <div className="absolute -bottom-8 -right-6 h-28 w-28 rounded-full bg-[#dcc2aa] blur-3xl" />
          </div>
        </div>
      </section>
    </main>
  );
}