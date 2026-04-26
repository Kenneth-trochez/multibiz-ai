"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function clean(value: FormDataEntryValue | null) {
  return String(value || "").trim();
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = clean(formData.get("email")).toLowerCase();

  if (!email) {
    redirect("/login/forgot-password?error=Ingresa+tu+correo");
  }

  const headersList = await headers();
  const origin =
    headersList.get("origin") ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/auth/update-password`,
  });

  if (error) {
    redirect(
      `/login/forgot-password?error=${encodeURIComponent(error.message)}`
    );
  }

  redirect(
    "/login/forgot-password?success=Si+el+correo+existe,+te+enviaremos+un+enlace+para+restablecer+tu+contraseña"
  );
}

export async function updatePasswordAction(formData: FormData) {
  const password = clean(formData.get("password"));
  const confirmPassword = clean(formData.get("confirmPassword"));

  if (!password || !confirmPassword) {
    redirect("/auth/update-password?error=Completa+ambos+campos");
  }

  if (password.length < 8) {
    redirect(
      "/auth/update-password?error=La+contraseña+debe+tener+al+menos+8+caracteres"
    );
  }

  if (password !== confirmPassword) {
    redirect("/auth/update-password?error=Las+contraseñas+no+coinciden");
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    redirect(`/auth/update-password?error=${encodeURIComponent(error.message)}`);
  }

  await supabase.auth.signOut();

  redirect(
    "/login?success=Contraseña+actualizada+correctamente.+Inicia+sesión+con+tu+nueva+contraseña"
  );
}
