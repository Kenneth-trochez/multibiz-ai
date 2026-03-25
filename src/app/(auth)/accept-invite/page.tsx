import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { acceptStaffInvitationAction } from "@/app/actions/staff";

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ invitation?: string }>;
}) {
  const params = await searchParams;
  const invitationToken = String(params.invitation || "").trim();

  if (!invitationToken) {
    redirect("/login?error=Invitación+inválida");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: invitation } = await supabase
    .from("staff_invitations")
    .select(`
      id,
      email,
      status,
      expires_at,
      business_id,
      staff_id
    `)
    .eq("token", invitationToken)
    .maybeSingle();

  if (!invitation) {
    return (
      <main className="min-h-screen bg-[#f6f1e8] px-6 py-12 text-[#2f241d]">
        <div className="mx-auto max-w-xl rounded-2xl border border-[#eadfce] bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold">Invitación inválida</h1>
          <p className="mt-3 text-sm text-[#6b5b4d]">
            No encontramos esa invitación o ya no está disponible.
          </p>
        </div>
      </main>
    );
  }

  const isExpired = new Date(invitation.expires_at).getTime() < Date.now();

  if (invitation.status !== "pending" || isExpired) {
    return (
      <main className="min-h-screen bg-[#f6f1e8] px-6 py-12 text-[#2f241d]">
        <div className="mx-auto max-w-xl rounded-2xl border border-[#eadfce] bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold">Invitación no disponible</h1>
          <p className="mt-3 text-sm text-[#6b5b4d]">
            Esta invitación ya fue usada, fue revocada o ha expirado.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f1e8] px-6 py-12 text-[#2f241d]">
      <div className="mx-auto max-w-xl rounded-2xl border border-[#eadfce] bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold">Aceptar invitación</h1>

        <p className="mt-3 text-sm text-[#6b5b4d]">
          Has sido invitado con el correo:
        </p>
        <p className="mt-1 font-medium">{invitation.email}</p>

        {!user ? (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-[#6b5b4d]">
              Primero necesitas iniciar sesión con ese mismo correo para completar la invitación.
            </p>

            <a
              href={`/login?next=${encodeURIComponent(`/auth/accept-invite?invitation=${invitationToken}`)}`}
              className="inline-flex rounded-xl bg-[#a56a3a] px-4 py-2 font-medium text-white transition hover:bg-[#8d582e]"
            >
              Ir a iniciar sesión
            </a>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-[#6b5b4d]">
              Estás conectado como:
            </p>
            <p className="font-medium">{user.email}</p>

            <form action={acceptStaffInvitationAction}>
              <input type="hidden" name="invitationToken" value={invitationToken} />
              <button
                type="submit"
                className="rounded-xl bg-[#a56a3a] px-4 py-2 font-medium text-white transition hover:bg-[#8d582e]"
              >
                Aceptar e ingresar
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}