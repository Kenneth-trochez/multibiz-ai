import Link from "next/link";
import { signUpAction } from "../../actions/auth";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-[#f6f1e8] px-4 py-10">
      <div className="mx-auto grid min-h-[85vh] max-w-6xl overflow-hidden rounded-[2rem] border border-[#e7d8c7] bg-[#fffaf3] shadow-xl lg:grid-cols-2">
        <div className="flex flex-col justify-between bg-[#3b2f2a] p-8 text-[#fffaf3] lg:p-10">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#d8c6b6]">
              MultiBiz AI
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight">
              Crea tu cuenta y comienza tu negocio
            </h1>
            <p className="mt-4 max-w-md text-[#e6d8cc]">
              Regístrate, crea tu empresa y empieza a personalizar tu espacio
              dentro de la plataforma.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-[#e1d2c5]">Con esta cuenta podrás:</p>
            <ul className="mt-3 space-y-2 text-sm text-[#fffaf3]">
              <li>• Crear tu negocio</li>
              <li>• Gestionar clientes y servicios</li>
              <li>• Personalizar la imagen de tu marca</li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 lg:p-10">
          <div className="w-full max-w-md">
            <h2 className="text-3xl font-bold text-[#2f241d]">Crear cuenta</h2>
            <p className="mt-2 text-sm text-[#6b5b4d]">
              Registra tu usuario para comenzar.
            </p>

            {params.error && (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {params.error}
              </p>
            )}

            {params.success && (
              <p className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {params.success}
              </p>
            )}

            <form action={signUpAction} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[#3f3128]">
                  Nombre completo
                </label>
                <input
                  type="text"
                  name="fullName"
                  className="w-full rounded-xl border border-[#d9c6b2] bg-white px-4 py-3 text-[#2f241d] outline-none transition focus:border-[#a56a3a]"
                  placeholder="Tu nombre"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#3f3128]">
                  Correo
                </label>
                <input
                  type="email"
                  name="email"
                  className="w-full rounded-xl border border-[#d9c6b2] bg-white px-4 py-3 text-[#2f241d] outline-none transition focus:border-[#a56a3a]"
                  placeholder="correo@ejemplo.com"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#3f3128]">
                  Contraseña
                </label>
                <input
                  type="password"
                  name="password"
                  className="w-full rounded-xl border border-[#d9c6b2] bg-white px-4 py-3 text-[#2f241d] outline-none transition focus:border-[#a56a3a]"
                  placeholder="********"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-[#a56a3a] px-4 py-3 font-medium text-white transition hover:bg-[#8d582e]"
              >
                Crear cuenta
              </button>
            </form>

            <p className="mt-6 text-sm text-[#6b5b4d]">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="font-medium text-[#8d582e] underline">
                Iniciar sesión
              </Link>
            </p>

            <p className="mt-3 text-sm text-[#6b5b4d]">
              <Link href="/" className="underline">
                Volver al inicio
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}