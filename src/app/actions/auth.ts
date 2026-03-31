"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function signUpAction(formData: FormData): Promise<void> {
  const fullName = String(formData.get("fullName") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "").trim();

  if (!fullName || !email || !password) {
    redirect("/signup?error=Todos+los+campos+son+obligatorios");
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/login?success=Cuenta+creada+correctamente");
}

export async function loginAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "").trim();

  if (!email || !password) {
    redirect("/login?error=Correo+y+contrase%C3%B1a+son+obligatorios");
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/choose-access");
}

export async function createBusinessAction(formData: FormData): Promise<void> {
  const businessName = String(formData.get("businessName") || "").trim();
  const businessType = String(formData.get("businessType") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const address = String(formData.get("address") || "").trim();

  if (!businessName || !businessType) {
    redirect("/onboarding?error=El+nombre+y+tipo+de+negocio+son+obligatorios");
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login?error=Debes+iniciar+sesion+para+continuar");
  }

  const baseSlug = slugify(businessName);
  let finalSlug = baseSlug;

  const { data: existingSlug } = await supabase
    .from("businesses")
    .select("id")
    .eq("slug", baseSlug)
    .maybeSingle();

  if (existingSlug) {
    finalSlug = `${baseSlug}-${Math.floor(Math.random() * 10000)}`;
  }

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .insert({
      name: businessName,
      slug: finalSlug,
      business_type: businessType,
      phone: phone || null,
      address: address || null,
      owner_user_id: user.id,
      default_icon: "store",
    })
    .select("id")
    .single();

  if (businessError || !business) {
    redirect(
      `/onboarding?error=${encodeURIComponent(
        businessError?.message || "No se pudo crear el negocio"
      )}`
    );
  }

  const { error: memberError } = await supabase
    .from("business_members")
    .insert({
      business_id: business.id,
      user_id: user.id,
      role: "owner",
    });

  if (memberError) {
    redirect(`/onboarding?error=${encodeURIComponent(memberError.message)}`);
  }

  const { error: rolesError } = await supabase.from("roles").insert([
    {
      business_id: business.id,
      name: "owner",
      permissions: {
        dashboard: true,
        "customers.view": true,
        "customers.create": true,
        "customers.edit": true,
        "customers.delete": true,
        "services.view": true,
        "services.create": true,
        "services.edit": true,
        "services.delete": true,
        "staff.view": true,
        "staff.create": true,
        "staff.edit": true,
        "staff.delete": true,
        "appointments.view": true,
        "appointments.create": true,
        "appointments.edit": true,
        "appointments.delete": true,
        "balance.view": true,
        "settings.view": true,
        "settings.edit": true,
        "roles.manage": true,
      },
    },
    {
      business_id: business.id,
      name: "admin",
      permissions: {
        dashboard: true,
        "customers.view": true,
        "customers.create": true,
        "customers.edit": true,
        "customers.delete": true,
        "services.view": true,
        "services.create": true,
        "services.edit": true,
        "services.delete": true,
        "staff.view": true,
        "staff.create": true,
        "staff.edit": true,
        "staff.delete": false,
        "appointments.view": true,
        "appointments.create": true,
        "appointments.edit": true,
        "appointments.delete": true,
        "balance.view": true,
        "settings.view": false,
        "settings.edit": false,
        "roles.manage": false,
      },
    },
    {
      business_id: business.id,
      name: "staff",
      permissions: {
        dashboard: true,
        "customers.view": true,
        "customers.create": false,
        "customers.edit": false,
        "customers.delete": false,
        "services.view": true,
        "services.create": false,
        "services.edit": false,
        "services.delete": false,
        "staff.view": false,
        "staff.create": false,
        "staff.edit": false,
        "staff.delete": false,
        "appointments.view": true,
        "appointments.create": true,
        "appointments.edit": true,
        "appointments.delete": false,
        "balance.view": false,
        "settings.view": false,
        "settings.edit": false,
        "roles.manage": false,
      },
    },
  ]);

  const defaultProductCategories = [
    "Cuidado",
    "Alimentos",
    "Accesorios",
    "Limpieza",
    "Otros",
  ];

  const { error: categoriesError } = await supabase
    .from("product_categories")
    .insert(
      defaultProductCategories.map((name) => ({
        business_id: business.id,
        name,
      }))
    );

  if (categoriesError) {
    redirect(`/onboarding?error=${encodeURIComponent(categoriesError.message)}`);
  }

  if (rolesError) {
    redirect(`/onboarding?error=${encodeURIComponent(rolesError.message)}`);
  }

  redirect("/dashboard");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}