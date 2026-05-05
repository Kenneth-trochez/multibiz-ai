import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock3,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Store,
  UserRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getThemeClasses } from "@/lib/theme/getThemeClasses";
import { acceptStaffInvitationWithPasswordAction } from "@/app/actions/staff";

type BusinessView = {
  name: string;
  theme: string | null;
};

type StaffView = {
  display_name: string;
};

type InvitationView = {
  id: string;
  token: string;
  email: string;
  status: string;
  expires_at: string;
  business_id: string;
  staff_id: string | null;
  business: BusinessView | BusinessView[] | null;
  staff: StaffView | StaffView[] | null;
};

function firstOrNull<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] || null : value;
}

function getExpirationLabel(expiresAt: string) {
  const expiresMs = new Date(expiresAt).getTime();

  if (Number.isNaN(expiresMs)) {
    return "Fecha de expiración no disponible";
  }

  const diffMs = expiresMs - Date.now();
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

  if (diffHours <= 0) return "Invitación expirada";
  if (diffHours <= 24) return `Expira en ${diffHours} h`;

  const diffDays = Math.ceil(diffHours / 24);
  return `Expira en ${diffDays} día${diffDays === 1 ? "" : "s"}`;
}

function StatusMessage({
  title,
  message,
  kind = "error",
}: {
  title: string;
  message: string;
  kind?: "error" | "warning" | "success";
}) {
  const styles = {
    error: "border-red-200 bg-red-50 text-red-700",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    success: "border-green-200 bg-green-50 text-green-700",
  }[kind];

  const Icon = kind === "success" ? CheckCircle2 : kind === "warning" ? AlertTriangle : AlertTriangle;

  return (
    <div className={`mt-6 rounded-2xl border p-4 text-sm ${styles}`}>
      <div className="flex gap-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-bold">{title}</p>
          <p className="mt-1 leading-6">{message}</p>
        </div>
      </div>
    </div>
  );
}

export default async function StaffInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ invitation?: string; error?: string }>;
}) {
  const params = await searchParams;
  const invitationToken = String(params.invitation || "").trim();
  const theme = getThemeClasses("warm");

  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let invitation: InvitationView | null = null;
  let business: BusinessView | null = null;
  let staff: StaffView | null = null;
  let validationState:
    | "missing"
    | "invalid"
    | "expired"
    | "unavailable"
    | "session_missing"
    | "email_mismatch"
    | "ready" = "missing";

  if (invitationToken) {
    const { data } = await adminSupabase
      .from("staff_invitations")
      .select(`
        id,
        token,
        email,
        status,
        expires_at,
        business_id,
        staff_id,
        business:businesses(name, theme),
        staff:staff(display_name)
      `)
      .eq("token", invitationToken)
      .maybeSingle();

    invitation = data as InvitationView | null;
    business = firstOrNull(invitation?.business);
    staff = firstOrNull(invitation?.staff);

    if (!invitation) {
      validationState = "invalid";
    } else if (invitation.status !== "pending") {
      await adminSupabase.from("staff_invitations").delete().eq("id", invitation.id);
      validationState = "unavailable";
    } else {
      const expiresAtMs = new Date(invitation.expires_at).getTime();

      if (Number.isNaN(expiresAtMs) || expiresAtMs < Date.now()) {
        if (invitation.staff_id) {
          await adminSupabase
            .from("staff")
            .update({ invite_status: "expired" })
            .eq("id", invitation.staff_id)
            .eq("business_id", invitation.business_id);
        }

        await adminSupabase.from("staff_invitations").delete().eq("id", invitation.id);
        validationState = "expired";
      } else if (!user) {
        validationState = "session_missing";
      } else {
        const invitedEmail = invitation.email.trim().toLowerCase();
        const currentEmail = (user.email || "").trim().toLowerCase();

        validationState = currentEmail === invitedEmail ? "ready" : "email_mismatch";
      }
    }
  }

  const invitedEmail = invitation?.email || "Correo no disponible";
  const businessName = business?.name || "Negocio invitado";
  const staffName = staff?.display_name || "Nuevo miembro";

  return (
    <main className={`relative overflow-hidden px-4 py-10 ${theme.pageBg}`}>
      <div className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-[#a56a3a]/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-white/50 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-[#f3dfc8]/35 blur-3xl" />

      <div className={`relative mx-auto grid min-h-[85vh] max-w-6xl overflow-hidden rounded-[2rem] border shadow-xl lg:grid-cols-2 ${theme.glassCard}`}>
        <section className="relative flex flex-col justify-between overflow-hidden bg-[#3b2f2a] p-8 text-[#fffaf3] lg:p-10">
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
                <p className="text-xs text-[#d8c6b6]">Invitación de staff</p>
              </div>
            </Link>

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-[#e6d8cc]">
              <Sparkles className="h-4 w-4" />
              Acceso seguro al panel
            </div>

            <h1 className="text-4xl font-black leading-tight lg:text-5xl">
              Crea tu contraseña y entra al negocio
            </h1>
            <p className="mt-5 max-w-md leading-7 text-[#e6d8cc]">
              Esta pantalla es exclusiva para empleados invitados. La invitación se valida antes de crear el acceso y se elimina al ser usada.
            </p>
          </div>

          <div className="relative space-y-3 rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <Building2 className="mt-1 h-5 w-5 text-[#e1d2c5]" />
              <div>
                <p className="text-sm font-semibold text-[#e1d2c5]">Negocio asignado</p>
                <p className="mt-1 text-xl font-bold">{businessName}</p>
              </div>
            </div>

            {invitation?.expires_at && (
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-[#f7e9dc]">
                <Clock3 className="h-4 w-4" />
                {getExpirationLabel(invitation.expires_at)}
              </div>
            )}
          </div>
        </section>

        <section className="flex items-center justify-center p-6 lg:p-10">
          <div className="w-full max-w-md">
            <Link href="/login" className={`mb-6 inline-flex items-center gap-2 text-sm font-semibold ${theme.textMuted}`}>
              <ArrowLeft className="h-4 w-4" />
              Ir al login normal
            </Link>

            <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-3xl ${theme.accent}`}>
              <ShieldCheck className="h-6 w-6" />
            </div>

            <h2 className="text-3xl font-black">Aceptar invitación</h2>
            <p className={`mt-2 text-sm leading-6 ${theme.textMuted}`}>
              Invitación para <span className="font-bold">{staffName}</span>. Solo el correo invitado puede completar este registro.
            </p>

            <div className={`mt-4 space-y-3 rounded-3xl border p-4 ${theme.cardSoft}`}>
              <div className="flex items-center gap-3">
                <Mail className={`h-4 w-4 ${theme.textMuted}`} />
                <div className="min-w-0">
                  <p className={`text-xs font-semibold ${theme.textMuted}`}>Correo invitado</p>
                  <p className="truncate text-sm font-bold">{invitedEmail}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <UserRound className={`h-4 w-4 ${theme.textMuted}`} />
                <div className="min-w-0">
                  <p className={`text-xs font-semibold ${theme.textMuted}`}>Sesión actual</p>
                  <p className="truncate text-sm font-bold">{user?.email || "Sin sesión activa"}</p>
                </div>
              </div>
            </div>

            {params.error && (
              <StatusMessage title="No se pudo completar" message={params.error} />
            )}

            {validationState === "missing" && (
              <StatusMessage
                title="Invitación inválida"
                message="El enlace no contiene un token de invitación válido. Abre de nuevo el enlace desde el correo original."
              />
            )}

            {validationState === "invalid" && (
              <StatusMessage
                title="Invitación no encontrada"
                message="Esta invitación no existe, ya fue utilizada o fue eliminada por seguridad. Solicita una nueva invitación al administrador del negocio."
              />
            )}

            {validationState === "expired" && (
              <StatusMessage
                title="Invitación expirada"
                message="Esta invitación venció y fue eliminada automáticamente. Solicita una nueva invitación al owner del negocio."
                kind="warning"
              />
            )}

            {validationState === "unavailable" && (
              <StatusMessage
                title="Invitación no disponible"
                message="Esta invitación ya no puede utilizarse y fue eliminada para evitar duplicados. Solicita una nueva si aún necesitas acceso."
                kind="warning"
              />
            )}

            {validationState === "session_missing" && (
              <StatusMessage
                title="Falta validar la sesión"
                message="Abre el enlace original desde el correo de invitación. Supabase debe validar primero el link para crear una sesión temporal."
                kind="warning"
              />
            )}

            {validationState === "email_mismatch" && (
              <StatusMessage
                title="Correo incorrecto"
                message={`Esta invitación es para ${invitedEmail}, pero la sesión actual es ${user?.email || "otro correo"}. Cierra sesión y abre el enlace desde el correo correcto.`}
              />
            )}

            {validationState === "ready" && invitation && (
              <form action={acceptStaffInvitationWithPasswordAction} className="mt-6 space-y-4">
                <input type="hidden" name="invitationToken" value={invitationToken} />

                <div>
                  <label className={`mb-1.5 block text-sm font-semibold ${theme.label}`}>
                    Crea tu contraseña
                  </label>
                  <div className="relative">
                    <Lock className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${theme.textMuted}`} />
                    <input
                      type="password"
                      name="password"
                      minLength={8}
                      autoComplete="new-password"
                      className={`w-full rounded-2xl border py-3 pl-10 pr-4 outline-none transition ${theme.input}`}
                      placeholder="Mínimo 8 caracteres"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className={`mb-1.5 block text-sm font-semibold ${theme.label}`}>
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <ShieldCheck className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${theme.textMuted}`} />
                    <input
                      type="password"
                      name="confirmPassword"
                      minLength={8}
                      autoComplete="new-password"
                      className={`w-full rounded-2xl border py-3 pl-10 pr-4 outline-none transition ${theme.input}`}
                      placeholder="Repite la contraseña"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className={`w-full rounded-2xl px-4 py-3 font-bold transition ${theme.buttonPrimary}`}
                >
                  Crear contraseña y entrar
                </button>
              </form>
            )}

            <p className={`mt-6 text-xs leading-5 ${theme.textMuted}`}>
              Al completar este flujo, la invitación se consume y se borra para que no pueda reutilizarse ni duplicar accesos.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
