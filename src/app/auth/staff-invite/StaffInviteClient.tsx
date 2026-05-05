"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { acceptStaffInvitationWithPasswordAction } from "@/app/actions/staff";

type Theme = {
  pageBg: string;
  sidebarBg: string;
  sidebarCard: string;
  card: string;
  cardSoft: string;
  subtle: string;
  input: string;
  select: string;
  option: string;
  textMuted: string;
  label: string;
  hover: string;
  active: string;
  accent: string;
  softAccent: string;
  buttonPrimary: string;
  buttonSecondary: string;
  logoutButton: string;
  danger: string;
  glassCard: string;
  headerBg: string;
};

type SessionState =
  | "checking"
  | "ready"
  | "missing"
  | "email_mismatch"
  | "error";

function StatusMessage({
  title,
  message,
  kind = "warning",
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

  const Icon = kind === "success" ? CheckCircle2 : AlertTriangle;

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

function getHashParams() {
  if (typeof window === "undefined") return new URLSearchParams();

  const rawHash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;

  return new URLSearchParams(rawHash);
}

export default function StaffInviteClient({
  invitationToken,
  invitedEmail,
  staffName,
  theme,
}: {
  invitationToken: string;
  invitedEmail: string;
  staffName: string;
  theme: Theme;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [sessionState, setSessionState] = useState<SessionState>("checking");
  const [currentEmail, setCurrentEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [inviteAccessToken, setInviteAccessToken] = useState("");
  const [inviteRefreshToken, setInviteRefreshToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function hydrateInviteSession() {
      setSessionState("checking");

      try {
        const hashParams = getHashParams();
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const type = hashParams.get("type");

        if (accessToken) {
          setInviteAccessToken(accessToken);
        }

        if (refreshToken) {
          setInviteRefreshToken(refreshToken);
        }

        if (accessToken && refreshToken) {
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (setSessionError) {
            throw setSessionError;
          }

          if (type === "invite") {
            const cleanUrl = `${window.location.pathname}${window.location.search}`;
            window.history.replaceState({}, document.title, cleanUrl);
          }
        }

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user?.email) {
          if (!mounted) return;
          setCurrentEmail("");
          setSessionState("missing");
          return;
        }

        const normalizedCurrentEmail = user.email.trim().toLowerCase();
        const normalizedInvitedEmail = invitedEmail.trim().toLowerCase();

        if (!mounted) return;

        setCurrentEmail(user.email);

        if (normalizedCurrentEmail !== normalizedInvitedEmail) {
          setSessionState("email_mismatch");
          return;
        }

        setSessionState("ready");
      } catch (error) {
        if (!mounted) return;

        const message =
          error instanceof Error
            ? error.message
            : "No se pudo validar la sesión de invitación";

        setErrorMessage(message);
        setSessionState("error");
      }
    }

    hydrateInviteSession();

    return () => {
      mounted = false;
    };
  }, [invitedEmail, supabase]);

  if (sessionState === "checking") {
    return (
      <div className={`mt-6 rounded-3xl border p-5 ${theme.cardSoft}`}>
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <div>
            <p className="font-bold">Validando invitación...</p>
            <p className={`mt-1 text-sm ${theme.textMuted}`}>
              Estamos creando la sesión temporal enviada por Supabase.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (sessionState === "missing") {
    return (
      <StatusMessage
        title="Falta validar la sesión"
        message="Abre esta pantalla usando el botón del correo de invitación. El enlace debe incluir la sesión temporal generada por Supabase."
        kind="warning"
      />
    );
  }

  if (sessionState === "email_mismatch") {
    return (
      <StatusMessage
        title="Correo incorrecto"
        message={`Esta invitación es para ${invitedEmail}, pero la sesión actual es ${currentEmail || "otro correo"}. Cierra sesión y abre el enlace desde el correo correcto.`}
        kind="error"
      />
    );
  }

  if (sessionState === "error") {
    return (
      <StatusMessage
        title="No se pudo validar la sesión"
        message={errorMessage}
        kind="error"
      />
    );
  }

  return (
    <>
      <div className={`mt-4 flex items-center gap-3 rounded-3xl border p-4 ${theme.cardSoft}`}>
        <UserRound className={`h-4 w-4 ${theme.textMuted}`} />
        <div className="min-w-0">
          <p className={`text-xs font-semibold ${theme.textMuted}`}>Sesión validada</p>
          <p className="truncate text-sm font-bold">{currentEmail}</p>
        </div>
      </div>

      <form action={acceptStaffInvitationWithPasswordAction} className="mt-6 space-y-4">
        <input type="hidden" name="invitationToken" value={invitationToken} />
        <input type="hidden" name="inviteAccessToken" value={inviteAccessToken} />
        <input type="hidden" name="inviteRefreshToken" value={inviteRefreshToken} />

        <div>
          <label className={`mb-1.5 block text-sm font-semibold ${theme.label}`}>
            Crea tu contraseña
          </label>
          <div className="relative">
            <Lock
              className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${theme.textMuted}`}
            />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              minLength={8}
              autoComplete="new-password"
              className={`w-full rounded-2xl border py-3 pl-10 pr-12 outline-none transition ${theme.input}`}
              placeholder="Mínimo 8 caracteres"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 ${theme.textMuted}`}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className={`mb-1.5 block text-sm font-semibold ${theme.label}`}>
            Confirmar contraseña
          </label>
          <div className="relative">
            <ShieldCheck
              className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${theme.textMuted}`}
            />
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              minLength={8}
              autoComplete="new-password"
              className={`w-full rounded-2xl border py-3 pl-10 pr-12 outline-none transition ${theme.input}`}
              placeholder="Repite la contraseña"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((value) => !value)}
              className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 ${theme.textMuted}`}
              aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={!inviteAccessToken || !inviteRefreshToken}
          className={`w-full rounded-2xl px-4 py-3 font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${theme.buttonPrimary}`}
        >
          Crear contraseña y entrar
        </button>
      </form>

      <p className={`mt-4 text-xs leading-5 ${theme.textMuted}`}>
        Acceso preparado para <span className="font-semibold">{staffName}</span>.
      </p>
    </>
  );
}
