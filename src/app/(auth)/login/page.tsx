import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Store,
} from "lucide-react";
import { loginAction } from "../../actions/auth";
import { getThemeClasses } from "@/lib/theme/getThemeClasses";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const theme = getThemeClasses("warm");

  return (
    <main className={`relative overflow-hidden px-4 py-10 ${theme.pageBg}`}>
      <div className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-[#a56a3a]/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-white/50 blur-3xl" />

      <div className={`relative mx-auto grid min-h-[85vh] max-w-6xl overflow-hidden rounded-[2rem] border shadow-xl lg:grid-cols-2 ${theme.glassCard}`}>
        <div className="relative flex flex-col justify-between overflow-hidden bg-[#3b2f2a] p-8 text-[#fffaf3] lg:p-10">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#a56a3a]/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

          <div className="relative">
            <Link href="/" className="mb-10 flex w-fit items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fffaf3] text-[#3b2f2a] shadow-sm">
                <Store size={22} />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-[#d8c6b6]">
                  MultiBiz AI
                </p>
                <p className="text-xs text-[#d8c6b6]">SaaS multi-negocio</p>
              </div>
            </Link>

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-[#e6d8cc]">
              <Sparkles className="h-4 w-4" />
              Acceso seguro
            </div>

            <h1 className="text-4xl font-black leading-tight lg:text-5xl">
              Accede a tu plataforma de negocio
            </h1>
            <p className="mt-5 max-w-md leading-7 text-[#e6d8cc]">
              Gestiona tu empresa, personaliza tu marca y mantén todo organizado
              desde un solo panel.
            </p>
          </div>

          <div className="relative rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
            <p className="text-sm font-semibold text-[#e1d2c5]">Pensado para:</p>
            <ul className="mt-3 space-y-2 text-sm text-[#fffaf3]">
              <li className="flex gap-2">
                <ShieldCheck className="h-4 w-4" /> Negocios de servicios
              </li>
              <li className="flex gap-2">
                <ShieldCheck className="h-4 w-4" /> Empresas con personal y clientes
              </li>
              <li className="flex gap-2">
                <ShieldCheck className="h-4 w-4" /> Marcas con identidad visual propia
              </li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 lg:p-10">
          <div className="w-full max-w-md">
            <Link href="/" className={`mb-6 inline-flex items-center gap-2 text-sm font-semibold ${theme.textMuted}`}>
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio
            </Link>

            <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-3xl ${theme.accent}`}>
              <Building2 className="h-6 w-6" />
            </div>

            <h2 className="text-3xl font-black">Iniciar sesión</h2>
            <p className={`mt-2 text-sm ${theme.textMuted}`}>
              Entra con tu correo y contraseña.
            </p>

            {params.error && (
              <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {params.error}
              </p>
            )}

            {params.success && (
              <p className="mt-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {params.success}
              </p>
            )}

            <form action={loginAction} className="mt-6 space-y-4">
              <div>
                <label className={`mb-1.5 block text-sm font-semibold ${theme.label}`}>
                  Correo
                </label>
                <div className="relative">
                  <Mail className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${theme.textMuted}`} />
                  <input
                    type="email"
                    name="email"
                    className={`w-full rounded-2xl border py-3 pl-10 pr-4 outline-none transition ${theme.input}`}
                    placeholder="correo@ejemplo.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className={`mb-1.5 block text-sm font-semibold ${theme.label}`}>
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${theme.textMuted}`} />
                  <input
                    type="password"
                    name="password"
                    className={`w-full rounded-2xl border py-3 pl-10 pr-4 outline-none transition ${theme.input}`}
                    placeholder="********"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className={`w-full rounded-2xl px-4 py-3 font-bold transition ${theme.buttonPrimary}`}
              >
                Entrar
              </button>
            </form>

            <p className={`mt-6 text-sm ${theme.textMuted}`}>
              ¿No tienes cuenta?{" "}
              <Link href="/signup" className="font-bold underline">
                Crear cuenta
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
