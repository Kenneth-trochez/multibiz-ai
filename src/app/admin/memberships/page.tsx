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

function roleBadgeClasses(role: "owner" | "manager" | "staff") {
  if (role === "owner") return "border-green-200 bg-green-50 text-green-700";
  if (role === "manager") return "border-blue-200 bg-blue-50 text-blue-700";
  return "border-[#e7d8c7] bg-[#f8efe5] text-[#6b5b4d]";
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

  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

  const membershipsByBusiness = new Map<string, BusinessMemberRow[]>();
  for (const member of members) {
    const current = membershipsByBusiness.get(member.business_id) || [];
    current.push(member);
    membershipsByBusiness.set(member.business_id, current);
  }

  const ownerMembershipIssues: BusinessRow[] = [];

  for (const business of businesses) {
    const businessMemberships = membershipsByBusiness.get(business.id) || [];

    const ownerMembership = businessMemberships.find(
      (member) =>
        member.user_id === business.owner_user_id && member.role === "owner"
    );

    if (!ownerMembership) {
      ownerMembershipIssues.push(business);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-[2rem] border border-[#e7d8c7] bg-[#fffaf3] p-5 shadow-sm sm:p-6">
        <h2 className="text-2xl font-bold text-[#2f241d] sm:text-3xl">Vinculaciones</h2>
        <p className="mt-2 text-sm text-[#6b5b4d]">
          Administración de relaciones entre usuarios y negocios, agrupadas por cliente.
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
          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-[1.5rem] border border-[#e7d8c7] bg-[#fffaf3] p-4 shadow-sm sm:p-5">
              <h3 className="text-lg font-semibold text-[#2f241d] sm:text-xl">
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
                    className="w-full rounded-xl bg-[#a56a3a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#8d582e] sm:w-auto"
                  >
                    Crear vinculación
                  </button>
                </div>
              </form>
            </section>

            <section className="rounded-[1.5rem] border border-[#e7d8c7] bg-[#fffaf3] p-4 shadow-sm sm:p-5">
              <h3 className="text-lg font-semibold text-[#2f241d] sm:text-xl">
                Inconsistencias owner
              </h3>
              <p className="mt-1 text-sm text-[#6b5b4d]">
                Negocios donde `owner_user_id` no tiene una membership con rol `owner`.
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
                      <p className="mt-1 text-xs text-[#7a5a45]">{business.slug}</p>
                      <p className="mt-1 break-all text-xs text-[#7a5a45]">
                        owner_user_id: {business.owner_user_id}
                      </p>

                      <form action={syncOwnerMembershipAction} className="mt-3">
                        <input type="hidden" name="businessId" value={business.id} />
                        <button
                          type="submit"
                          className="w-full rounded-xl bg-[#f0d9b5] px-4 py-2 text-sm font-medium text-[#5a3d2a] transition hover:bg-[#e8c998] sm:w-auto"
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

          {businesses.length === 0 ? (
            <div className="rounded-[1.5rem] border border-[#e7d8c7] bg-[#fffaf3] p-6 text-[#6b5b4d] shadow-sm">
              No hay negocios registrados.
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-5">
              {businesses.map((business) => {
                const businessMemberships = membershipsByBusiness.get(business.id) || [];
                const ownerMembers = businessMemberships.filter((member) => member.role === "owner");
                const managerMembers = businessMemberships.filter((member) => member.role === "manager");
                const staffMembers = businessMemberships.filter((member) => member.role === "staff");

                const hasConsistentOwner = ownerMembers.some(
                  (member) => member.user_id === business.owner_user_id
                );

                return (
                  <section
                    key={business.id}
                    className="rounded-[1.5rem] border border-[#e7d8c7] bg-[#fffaf3] p-4 shadow-sm sm:p-5"
                  >
                    <div className="flex flex-col gap-4 border-b border-[#ead9c8] pb-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <h3 className="text-lg font-semibold text-[#2f241d] sm:text-xl">
                            {business.name}
                          </h3>

                          <span className="rounded-full border border-[#e7d8c7] bg-[#f8efe5] px-3 py-1 text-xs text-[#6b5b4d]">
                            {business.slug}
                          </span>

                          {hasConsistentOwner ? (
                            <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs text-green-700">
                              Owner consistente
                            </span>
                          ) : (
                            <span className="rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs text-yellow-700">
                              Revisar owner
                            </span>
                          )}
                        </div>

                        <div className="mt-3 grid gap-2 text-sm text-[#6b5b4d] sm:grid-cols-2">
                          <p className="break-all">
                            <span className="font-medium text-[#3f3128]">Business ID:</span> {business.id}
                          </p>
                          <p className="break-all">
                            <span className="font-medium text-[#3f3128]">Owner user ID:</span> {business.owner_user_id}
                          </p>
                          <p>
                            <span className="font-medium text-[#3f3128]">Total vinculaciones:</span> {businessMemberships.length}
                          </p>
                          <p>
                            <span className="font-medium text-[#3f3128]">Owners / Managers / Staff:</span> {ownerMembers.length} / {managerMembers.length} / {staffMembers.length}
                          </p>
                        </div>
                      </div>

                      {!hasConsistentOwner && (
                        <form action={syncOwnerMembershipAction}>
                          <input type="hidden" name="businessId" value={business.id} />
                          <button
                            type="submit"
                            className="w-full rounded-xl bg-[#f0d9b5] px-4 py-2 text-sm font-medium text-[#5a3d2a] transition hover:bg-[#e8c998] lg:w-auto"
                          >
                            Sincronizar owner
                          </button>
                        </form>
                      )}
                    </div>

                    {businessMemberships.length === 0 ? (
                      <div className="pt-4 text-sm text-[#6b5b4d]">
                        Este negocio no tiene vinculaciones registradas.
                      </div>
                    ) : (
                      <div className="space-y-5 pt-5">
                        {[
                          { title: "Owners", items: ownerMembers },
                          { title: "Managers", items: managerMembers },
                          { title: "Staff", items: staffMembers },
                        ].map((group) => (
                          <div key={group.title}>
                            <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.15em] text-[#8d582e]">
                              {group.title}
                            </h4>

                            {group.items.length === 0 ? (
                              <div className="rounded-xl border border-[#ead9c8] bg-[#fff7ee] px-4 py-3 text-sm text-[#6b5b4d]">
                                No hay usuarios en esta categoría.
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {group.items.map((membership) => {
                                  const profile = profileMap.get(membership.user_id);
                                  const isExpectedOwner =
                                    membership.user_id === business.owner_user_id &&
                                    membership.role === "owner";

                                  return (
                                    <div
                                      key={membership.id}
                                      className="rounded-[1.25rem] border border-[#ead9c8] bg-[#fff7ee] p-4"
                                    >
                                      <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
                                        <div className="min-w-0 flex-1">
                                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                            <h5 className="text-base font-semibold text-[#2f241d]">
                                              {profile?.full_name?.trim() || "Sin nombre"}
                                            </h5>

                                            <span
                                              className={`rounded-full border px-3 py-1 text-xs ${roleBadgeClasses(
                                                membership.role
                                              )}`}
                                            >
                                              {membership.role}
                                            </span>

                                            {isExpectedOwner && (
                                              <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs text-green-700">
                                                Owner principal
                                              </span>
                                            )}
                                          </div>

                                          <div className="mt-3 grid gap-3 text-sm text-[#6b5b4d] sm:grid-cols-2">
                                            <div className="min-w-0">
                                              <p className="font-medium text-[#3f3128]">Email</p>
                                              <p className="break-all">{profile?.email || "—"}</p>
                                            </div>

                                            <div className="min-w-0">
                                              <p className="font-medium text-[#3f3128]">User ID</p>
                                              <p className="break-all">{membership.user_id}</p>
                                            </div>

                                            <div>
                                              <p className="font-medium text-[#3f3128]">Creado</p>
                                              <p>{formatDate(membership.created_at)}</p>
                                            </div>

                                            <div>
                                              <p className="font-medium text-[#3f3128]">Membership ID</p>
                                              <p className="break-all">{membership.id}</p>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="rounded-[1.25rem] border border-[#ead9c8] bg-white p-4 2xl:w-[320px]">
                                          <p className="mb-3 text-sm font-medium text-[#3f3128]">
                                            Administrar vinculación
                                          </p>

                                          <form
                                            action={updateMembershipRoleAction}
                                            className="space-y-3"
                                          >
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

                                          <form
                                            action={deleteMembershipAction}
                                            className="mt-3"
                                          >
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
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}