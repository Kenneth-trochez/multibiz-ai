import { createAdminClient } from "@/lib/supabase/admin";
import { requirePlatformAdmin } from "@/lib/auth/requirePlatformAdmin";
import {
  createMembershipAction,
  deleteMembershipAction,
  syncOwnerMembershipAction,
  updateMembershipRoleAction,
} from "../actions/memberships";

type SearchParams = Promise<{
  error?: string;
  success?: string;
}>;

type BusinessMemberRow = {
  id: string;
  business_id: string;
  user_id: string;
  role: "owner" | "manager" | "staff";
  created_at: string;
};

type BusinessRow = {
  id: string;
  name: string;
  slug: string;
  owner_user_id: string;
};

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("es-HN");
}

export default async function AdminMembershipsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requirePlatformAdmin();
  const params = await searchParams;

  const supabase = createAdminClient();

  const [membersResult, businessesResult, profilesResult] = await Promise.all([
    supabase
      .from("business_members")
      .select("id, business_id, user_id, role, created_at")
      .order("created_at", { ascending: false }),

    supabase
      .from("businesses")
      .select("id, name, slug, owner_user_id")
      .order("created_at", { ascending: false }),

    supabase
      .from("profiles")
      .select("id, email, full_name")
      .order("created_at", { ascending: false }),
  ]);

  const error =
    membersResult.error || businessesResult.error || profilesResult.error;

  const members = (membersResult.data || []) as BusinessMemberRow[];
  const businesses = (businessesResult.data || []) as BusinessRow[];
  const profiles = (profilesResult.data || []) as ProfileRow[];

  const businessMap = new Map(businesses.map((business) => [business.id, business]));
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

  const ownerMembershipIssues: BusinessRow[] = [];

  for (const business of businesses) {
    const ownerMembership = members.find(
      (member) =>
        member.business_id === business.id &&
        member.user_id === business.owner_user_id &&
        member.role === "owner"
    );

    if (!ownerMembership) {
      ownerMembershipIssues.push(business);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-[#e7d8c7] bg-[#fffaf3] p-6 shadow-sm">
        <h2 className="text-3xl font-bold text-[#2f241d]">Vinculaciones</h2>
        <p className="mt-2 text-sm text-[#6b5b4d]">
          Revisión técnica y administración manual de relaciones entre usuarios y negocios.
        </p>
      </div>

      {params.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {params.error}
        </div>
      )}

      {params.success === "membership_created" && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Vinculación creada correctamente.
        </div>
      )}

      {params.success === "membership_updated" && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Rol actualizado correctamente.
        </div>
      )}

      {params.success === "membership_deleted" && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Vinculación eliminada correctamente.
        </div>
      )}

      {params.success === "owner_synced" && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Owner sincronizado correctamente.
        </div>
      )}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          Error cargando vinculaciones: {error.message}
        </div>
      ) : (
        <>
          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-[1.5rem] border border-[#e7d8c7] bg-[#fffaf3] p-5 shadow-sm">
              <h3 className="text-xl font-semibold text-[#2f241d]">
                Crear vinculación manual
              </h3>
              <p className="mt-1 text-sm text-[#6b5b4d]">
                Asocia un usuario a un negocio con el rol que necesites.
              </p>

              <form action={createMembershipAction} className="mt-4 grid gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#3f3128]">
                    Negocio
                  </label>
                  <select
                    name="businessId"
                    className="w-full rounded-xl border border-[#d9c6b2] bg-white px-3 py-2 text-sm text-[#2f241d] outline-none"
                    required
                  >
                    <option value="">Selecciona un negocio</option>
                    {businesses.map((business) => (
                      <option key={business.id} value={business.id}>
                        {business.name} ({business.slug})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-[#3f3128]">
                    Usuario
                  </label>
                  <select
                    name="userId"
                    className="w-full rounded-xl border border-[#d9c6b2] bg-white px-3 py-2 text-sm text-[#2f241d] outline-none"
                    required
                  >
                    <option value="">Selecciona un usuario</option>
                    {profiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {(profile.full_name?.trim() || "Sin nombre") +
                          " — " +
                          (profile.email || profile.id)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-[#3f3128]">
                    Rol
                  </label>
                  <select
                    name="role"
                    defaultValue="staff"
                    className="w-full rounded-xl border border-[#d9c6b2] bg-white px-3 py-2 text-sm text-[#2f241d] outline-none"
                    required
                  >
                    <option value="owner">owner</option>
                    <option value="manager">manager</option>
                    <option value="staff">staff</option>
                  </select>
                </div>

                <div>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#a56a3a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#8d582e]"
                  >
                    Crear vinculación
                  </button>
                </div>
              </form>
            </section>

            <section className="rounded-[1.5rem] border border-[#e7d8c7] bg-[#fffaf3] p-5 shadow-sm">
              <h3 className="text-xl font-semibold text-[#2f241d]">
                Inconsistencias owner
              </h3>
              <p className="mt-1 text-sm text-[#6b5b4d]">
                Corrige negocios cuyo `owner_user_id` no coincide con una membership owner.
              </p>

              <div className="mt-4 space-y-3">
                {ownerMembershipIssues.length === 0 ? (
                  <p className="text-sm text-[#6b5b4d]">
                    No hay inconsistencias de owner detectadas.
                  </p>
                ) : (
                  ownerMembershipIssues.map((business) => (
                    <div
                      key={business.id}
                      className="rounded-xl border border-yellow-200 bg-yellow-50 p-3"
                    >
                      <p className="font-medium text-[#5a3d2a]">{business.name}</p>
                      <p className="mt-1 break-all text-xs text-[#7a5a45]">
                        owner_user_id: {business.owner_user_id}
                      </p>

                      <form action={syncOwnerMembershipAction} className="mt-3">
                        <input type="hidden" name="businessId" value={business.id} />
                        <button
                          type="submit"
                          className="rounded-xl bg-[#f0d9b5] px-4 py-2 text-sm font-medium text-[#5a3d2a] transition hover:bg-[#e8c998]"
                        >
                          Sincronizar owner
                        </button>
                      </form>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {members.length === 0 ? (
            <div className="rounded-[1.5rem] border border-[#e7d8c7] bg-[#fffaf3] p-6 text-[#6b5b4d] shadow-sm">
              No hay vinculaciones registradas.
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((membership) => {
                const business = businessMap.get(membership.business_id);
                const profile = profileMap.get(membership.user_id);
                const isExpectedOwner =
                  business?.owner_user_id === membership.user_id &&
                  membership.role === "owner";

                return (
                  <div
                    key={membership.id}
                    className="rounded-[1.5rem] border border-[#e7d8c7] bg-[#fffaf3] p-5 shadow-sm"
                  >
                    <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_320px]">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-semibold text-[#2f241d]">
                            {business?.name || "Negocio no encontrado"}
                          </h3>

                          <span className="rounded-full border border-[#e7d8c7] bg-[#f8efe5] px-3 py-1 text-xs text-[#6b5b4d]">
                            {membership.role}
                          </span>

                          {isExpectedOwner && (
                            <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs text-green-700">
                              Owner consistente
                            </span>
                          )}
                        </div>

                        <div className="mt-3 grid gap-3 text-sm text-[#6b5b4d] md:grid-cols-2">
                          <div>
                            <p className="font-medium text-[#3f3128]">Negocio</p>
                            <p>{business?.slug || membership.business_id}</p>
                          </div>

                          <div className="min-w-0">
                            <p className="font-medium text-[#3f3128]">Usuario</p>
                            <p>{profile?.full_name || "Sin nombre"}</p>
                            <p className="break-all text-xs text-[#6b5b4d]">
                              {membership.user_id}
                            </p>
                          </div>

                          <div className="min-w-0">
                            <p className="font-medium text-[#3f3128]">Email</p>
                            <p className="break-all">{profile?.email || "—"}</p>
                          </div>

                          <div>
                            <p className="font-medium text-[#3f3128]">Creado</p>
                            <p>{formatDate(membership.created_at)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[1.5rem] border border-[#ead9c8] bg-[#fff7ee] p-4">
                        <p className="mb-3 text-sm font-medium text-[#3f3128]">
                          Administrar vinculación
                        </p>

                        <form action={updateMembershipRoleAction} className="space-y-3">
                          <input
                            type="hidden"
                            name="membershipId"
                            value={membership.id}
                          />

                          <div>
                            <label className="mb-1 block text-xs text-[#6b5b4d]">
                              Rol
                            </label>
                            <select
                              name="role"
                              defaultValue={membership.role}
                              className="w-full rounded-xl border border-[#d9c6b2] bg-white px-3 py-2 text-sm text-[#2f241d] outline-none"
                            >
                              <option value="owner">owner</option>
                              <option value="manager">manager</option>
                              <option value="staff">staff</option>
                            </select>
                          </div>

                          <button
                            type="submit"
                            className="w-full rounded-xl bg-[#a56a3a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#8d582e]"
                          >
                            Guardar rol
                          </button>
                        </form>

                        <form action={deleteMembershipAction} className="mt-3">
                          <input
                            type="hidden"
                            name="membershipId"
                            value={membership.id}
                          />
                          <button
                            type="submit"
                            className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
                          >
                            Eliminar vinculación
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}