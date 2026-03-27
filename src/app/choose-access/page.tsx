import Link from "next/link";
import { redirect } from "next/navigation";
import { getAccessContext } from "@/lib/auth/getAccessContext";

export default async function ChooseAccessPage() {
  const { user, hasBusinessAccess, isPlatformAdmin } = await getAccessContext();

  if (!hasBusinessAccess && !isPlatformAdmin) {
    redirect("/onboarding");
  }

  if (hasBusinessAccess && !isPlatformAdmin) {
    redirect("/dashboard");
  }

  if (!hasBusinessAccess && isPlatformAdmin) {
    redirect("/admin");
  }

  return (
    <main className="min-h-screen bg-[#f6f1e8] px-4 py-10">
      <div className="mx-auto grid min-h-[85vh] max-w-6xl overflow-hidden rounded-[2rem] border border-[#e7d8c7] bg-[#fffaf3] shadow-xl lg:grid-cols-2">
        <div className="flex flex-col justify-between bg-[#3b2f2a] p-8 text-[#fffaf3] lg:p-10">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#d8c6b6]">
              MultiBiz AI
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight">
              Elige cómo quieres entrar
            </h1>
            <p className="mt-4 max-w-md text-[#e6d8cc]">
              Tu cuenta tiene acceso tanto al entorno del negocio como al panel
              interno del SaaS.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-[#e1d2c5]">Sesión activa:</p>
            <p className="mt-2 break-all text-sm text-[#fffaf3]">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 lg:p-10">
          <div className="w-full max-w-xl">
            <h2 className="text-3xl font-bold text-[#2f241d]">
              Selecciona un acceso
            </h2>
            <p className="mt-2 text-sm text-[#6b5b4d]">
              Puedes entrar al dashboard de negocio o al panel administrativo del SaaS.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <Link
                href="/dashboard"
                className="rounded-[1.5rem] border border-[#e7d8c7] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <p className="text-sm uppercase tracking-[0.18em] text-[#8d582e]">
                  Negocio
                </p>
                <h3 className="mt-3 text-2xl font-bold text-[#2f241d]">
                  Dashboard cliente
                </h3>
                <p className="mt-3 text-sm text-[#6b5b4d]">
                  Entra al panel normal del negocio para ver citas, clientes,
                  ventas, productos y configuración.
                </p>

                <div className="mt-6 inline-flex rounded-xl bg-[#a56a3a] px-4 py-2 text-sm font-medium text-white">
                  Entrar al dashboard
                </div>
              </Link>

              <Link
                href="/admin"
                className="rounded-[1.5rem] border border-[#d8c6b6] bg-[#fff7ee] p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <p className="text-sm uppercase tracking-[0.18em] text-[#8d582e]">
                  Plataforma
                </p>
                <h3 className="mt-3 text-2xl font-bold text-[#2f241d]">
                  Admin SaaS
                </h3>
                <p className="mt-3 text-sm text-[#6b5b4d]">
                  Gestiona negocios, suscripciones, usuarios, vinculaciones y
                  herramientas internas de la plataforma.
                </p>

                <div className="mt-6 inline-flex rounded-xl border border-[#c9b39f] bg-[#f3e5d8] px-4 py-2 text-sm font-medium text-[#5a3d2a]">
                  Entrar al panel admin
                </div>
              </Link>
            </div>

            <p className="mt-6 text-sm text-[#6b5b4d]">
              También puedes volver luego y cambiar entre ambos accesos.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}