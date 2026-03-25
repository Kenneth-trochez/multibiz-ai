import { redirect } from "next/navigation";
import { getCurrentBusiness } from "@/lib/tenant/getCurrentBusiness";
import { updateBusinessAction } from "../../actions/business";

function getThemeClasses(theme: string) {
  switch (theme) {
    case "dark":
      return {
        pageBg: "bg-[#181818] text-white",
        textMuted: "text-[#bdbdbd]",
        label: "text-[#f1f1f1]",
        input:
          "bg-white/10 border-white/20 text-white placeholder:text-white/50 backdrop-blur-md",
        select:
          "bg-[#2b2b2b] border-[#444444] text-white",
        option:
          "bg-[#2b2b2b] text-white",
        buttonPrimary: "bg-white text-black hover:bg-[#e8e8e8]",
        glassCard:
          "bg-white/10 border border-white/20 text-white shadow-2xl backdrop-blur-xl",
      };

    case "elegant":
      return {
        pageBg: "bg-[#f4efe8] text-[#2b211b]",
        textMuted: "text-[#7a6858]",
        label: "text-[#3e3027]",
        input:
          "bg-white/70 border-white/40 text-[#2b211b] placeholder:text-[#7a6858] backdrop-blur-md",
        select:
          "bg-white/80 border-[#d8c7b7] text-[#2b211b]",
        option:
          "bg-white text-[#2b211b]",
        buttonPrimary: "bg-[#6b4f3a] text-white hover:bg-[#5a4331]",
        glassCard:
          "bg-white/60 border border-white/50 text-[#2b211b] shadow-2xl backdrop-blur-xl",
      };

    case "minimal":
      return {
        pageBg: "bg-[#f8f8f8] text-[#1f1f1f]",
        textMuted: "text-[#6f6f6f]",
        label: "text-[#222222]",
        input:
          "bg-white/80 border-white/60 text-[#1f1f1f] placeholder:text-[#6f6f6f] backdrop-blur-md",
        select:
          "bg-white border-[#d6d6d6] text-[#1f1f1f]",
        option:
          "bg-white text-[#1f1f1f]",
        buttonPrimary: "bg-[#111111] text-white hover:bg-[#222222]",
        glassCard:
          "bg-white/70 border border-white/60 text-[#1f1f1f] shadow-2xl backdrop-blur-xl",
      };

    case "warm":
    default:
      return {
        pageBg: "bg-[#f6f1e8] text-[#2f241d]",
        textMuted: "text-[#6b5b4d]",
        label: "text-[#3f3128]",
        input:
          "bg-white/70 border-white/40 text-[#2f241d] placeholder:text-[#6b5b4d] backdrop-blur-md",
        select:
          "bg-white border-[#d9c6b2] text-[#2f241d]",
        option:
          "bg-white text-[#2f241d]",
        buttonPrimary: "bg-[#a56a3a] text-white hover:bg-[#8d582e]",
        glassCard:
          "bg-white/55 border border-white/50 text-[#2f241d] shadow-2xl backdrop-blur-xl",
      };
  }
}

export default async function SettingsPage() {
  const ctx = await getCurrentBusiness();

  if (!ctx?.business) {
    redirect("/onboarding");
  }

  const { business } = ctx;
  const theme = getThemeClasses(business.theme || "warm");

  return (
    <main className={`min-h-screen ${theme.pageBg}`}>
      <div className="mx-auto flex min-h-[calc(100vh-120px)] max-w-4xl items-center justify-center px-4 py-8 md:px-6">
        <section className={`w-full rounded-[28px] p-6 md:p-8 ${theme.glassCard}`}>
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold">Configuración del negocio</h1>
            <p className={`mt-2 text-sm ${theme.textMuted}`}>
              Personaliza la información visual y general de tu negocio.
            </p>
          </div>

          <form action={updateBusinessAction} className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className={`mb-2 block text-sm font-medium ${theme.label}`}>
                Nombre del negocio
              </label>
              <input
                type="text"
                name="name"
                defaultValue={business.name || ""}
                className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${theme.input}`}
                required
              />
            </div>

            <div>
              <label className={`mb-2 block text-sm font-medium ${theme.label}`}>
                Tipo de negocio
              </label>
              <input
                type="text"
                name="business_type"
                defaultValue={business.business_type || ""}
                className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${theme.input}`}
                placeholder="Ej. Barbería, Clínica, Restaurante"
              />
            </div>

            <div>
              <label className={`mb-2 block text-sm font-medium ${theme.label}`}>
                Teléfono
              </label>
              <input
                type="text"
                name="phone"
                defaultValue={business.phone || ""}
                className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${theme.input}`}
              />
            </div>

            <div className="md:col-span-2">
              <label className={`mb-2 block text-sm font-medium ${theme.label}`}>
                Dirección
              </label>
              <input
                type="text"
                name="address"
                defaultValue={business.address || ""}
                className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${theme.input}`}
              />
            </div>

            <div className="md:col-span-2">
              <label className={`mb-2 block text-sm font-medium ${theme.label}`}>
                Tema
              </label>
              <select
                name="theme"
                defaultValue={business.theme || "warm"}
                className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${theme.select}`}
              >
                <option value="warm" className={theme.option}>
                  Warm
                </option>
                <option value="elegant" className={theme.option}>
                  Elegant
                </option>
                <option value="dark" className={theme.option}>
                  Dark
                </option>
                <option value="minimal" className={theme.option}>
                  Minimal
                </option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className={`mb-2 block text-sm font-medium ${theme.label}`}>
                Logo del negocio
              </label>
              <input
                type="file"
                name="logo"
                accept="image/*"
                className={`w-full rounded-2xl border px-4 py-3 outline-none transition file:mr-4 file:rounded-xl file:border-0 file:px-4 file:py-2 file:font-medium ${theme.input}`}
              />
            </div>

            {business.logo_url && (
              <div className="md:col-span-2">
                <p className={`mb-3 text-sm ${theme.textMuted}`}>Logo actual</p>
                <img
                  src={business.logo_url}
                  alt="Logo del negocio"
                  className="h-24 w-24 rounded-2xl border object-cover"
                />
              </div>
            )}

            <div className="md:col-span-2 flex justify-center pt-2">
              <button
                type="submit"
                className={`rounded-2xl px-6 py-3 text-sm font-semibold transition ${theme.buttonPrimary}`}
              >
                Guardar cambios
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}