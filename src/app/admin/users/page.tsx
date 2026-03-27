import { createAdminClient } from "@/lib/supabase/admin";
import { requirePlatformAdmin } from "@/lib/auth/requirePlatformAdmin";

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

type PlatformAdminRow = {
  user_id: string;
};

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

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("es-HN");
}

function roleBadgeClasses(role: "owner" | "manager" | "staff") {
  if (role === "owner") return "border-green-200 bg-green-50 text-green-700";
  if (role === "manager") return "border-blue-200 bg-blue-50 text-blue-700";
  return "border-[#e7d8c7] bg-[#f8efe5] text-[#6b5b4d]";
}

export default async function AdminUsersPage() {
  await requirePlatformAdmin();

  const supabase = createAdminClient();

  const [profilesResult, platformAdminsResult, membersResult, businessesResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, email, full_name, avatar_url, created_at, updated_at")
        .order("created_at", { ascending: false }),
      supabase.from("platform_admins").select("user_id"),
      supabase
        .from("business_members")
        .select("id, business_id, user_id, role, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("businesses")
        .select("id, name, slug, owner_user_id")
        .order("created_at", { ascending: false }),
    ]);

  const error =
    profilesResult.error ||
    platformAdminsResult.error ||
    membersResult.error ||
    businessesResult.error;

  const profiles = (profilesResult.data || []) as ProfileRow[];
  const platformAdmins = (platformAdminsResult.data || []) as PlatformAdminRow[];
  const members = (membersResult.data || []) as BusinessMemberRow[];
  const businesses = (businessesResult.data || []) as BusinessRow[];

  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
  const platformAdminSet = new Set(platformAdmins.map((item) => item.user_id));

  const membershipsByBusiness = new Map<string, BusinessMemberRow[]>();
  for (const member of members) {
    const current = membershipsByBusiness.get(member.business_id) || [];
    current.push(member);
    membershipsByBusiness.set(member.business_id, current);
  }

  const profileIds = new Set(profiles.map((profile) => profile.id));
  const orphanMembershipUserIds = [
    ...new Set(
      members.map((member) => member.user_id).filter((userId) => !profileIds.has(userId))
    ),
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-[2rem] border border-[#e7d8c7] bg-[#fffaf3] p-5 shadow-sm sm:p-6">
        <h2 className="text-2xl font-bold text-[#2f241d] sm:text-3xl">Usuarios</h2>
        <p className="mt-2 text-sm text-[#6b5b4d]">
          Vista agrupada por negocio para revisar usuarios, roles y accesos internos.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          Error cargando usuarios: {error.message}
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[1.5rem] border border-[#e7d8c7] bg-[#fffaf3] p-4 shadow-sm sm:p-5">
              <p className="text-sm text-[#6b5b4d]">Perfiles</p>
              <p className="mt-2 text-2xl font-bold text-[#2f241d] sm:text-3xl">
                {profiles.length}
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-[#e7d8c7] bg-[#fffaf3] p-4 shadow-sm sm:p-5">
              <p className="text-sm text-[#6b5b4d]">Platform admins</p>
              <p className="mt-2 text-2xl font-bold text-[#2f241d] sm:text-3xl">
                {platformAdmins.length}
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-[#e7d8c7] bg-[#fffaf3] p-4 shadow-sm sm:p-5">
              <p className="text-sm text-[#6b5b4d]">Negocios</p>
              <p className="mt-2 text-2xl font-bold text-[#2f241d] sm:text-3xl">
                {businesses.length}
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-[#e7d8c7] bg-[#fffaf3] p-4 shadow-sm sm:p-5">
              <p className="text-sm text-[#6b5b4d]">Vinculaciones huérfanas</p>
              <p className="mt-2 text-2xl font-bold text-[#2f241d] sm:text-3xl">
                {orphanMembershipUserIds.length}
              </p>
            </div>
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

                return (
                  <section
                    key={business.id}
                    className="rounded-[1.5rem] border border-[#e7d8c7] bg-[#fffaf3] p-4 shadow-sm sm:p-5"
                  >
                    <div className="border-b border-[#ead9c8] pb-4">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <h3 className="text-lg font-semibold text-[#2f241d] sm:text-xl">
                          {business.name}
                        </h3>

                        <span className="rounded-full border border-[#e7d8c7] bg-[#f8efe5] px-3 py-1 text-xs text-[#6b5b4d]">
                          {business.slug}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-2 text-sm text-[#6b5b4d] sm:grid-cols-2 xl:grid-cols-4">
                        <p className="break-all">
                          <span className="font-medium text-[#3f3128]">Business ID:</span> {business.id}
                        </p>
                        <p className="break-all">
                          <span className="font-medium text-[#3f3128]">Owner user ID:</span> {business.owner_user_id}
                        </p>
                        <p>
                          <span className="font-medium text-[#3f3128]">Usuarios vinculados:</span> {businessMemberships.length}
                        </p>
                        <p>
                          <span className="font-medium text-[#3f3128]">Owners / Managers / Staff:</span> {ownerMembers.length} / {managerMembers.length} / {staffMembers.length}
                        </p>
                      </div>
                    </div>

                    {businessMemberships.length === 0 ? (
                      <div className="pt-4 text-sm text-[#6b5b4d]">
                        Este negocio no tiene usuarios vinculados.
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
                                  const isPlatformAdmin = platformAdminSet.has(membership.user_id);
                                  const isMainOwner =
                                    membership.user_id === business.owner_user_id &&
                                    membership.role === "owner";

                                  return (
                                    <div
                                      key={membership.id}
                                      className="rounded-[1.25rem] border border-[#ead9c8] bg-[#fff7ee] p-4"
                                    >
                                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
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

                                            {isMainOwner && (
                                              <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs text-green-700">
                                                Owner principal
                                              </span>
                                            )}

                                            {isPlatformAdmin && (
                                              <span className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs text-purple-700">
                                                Platform admin
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
                                              <p className="font-medium text-[#3f3128]">Creado perfil</p>
                                              <p>{formatDate(profile?.created_at || null)}</p>
                                            </div>

                                            <div>
                                              <p className="font-medium text-[#3f3128]">Creado membership</p>
                                              <p>{formatDate(membership.created_at)}</p>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="w-full rounded-[1.25rem] border border-[#ead9c8] bg-white p-4 xl:max-w-xs">
                                          <p className="text-sm font-medium text-[#3f3128]">
                                            Resumen rápido
                                          </p>

                                          <div className="mt-3 space-y-2 text-sm text-[#6b5b4d]">
                                            <p>
                                              <span className="font-medium text-[#3f3128]">Negocio:</span>{" "}
                                              {business.name}
                                            </p>
                                            <p>
                                              <span className="font-medium text-[#3f3128]">Rol:</span>{" "}
                                              {membership.role}
                                            </p>
                                            <p>
                                              <span className="font-medium text-[#3f3128]">Membership ID:</span>
                                            </p>
                                            <p className="break-all text-xs">{membership.id}</p>
                                          </div>
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

          {orphanMembershipUserIds.length > 0 && (
            <div className="rounded-[1.5rem] border border-yellow-200 bg-yellow-50 p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-[#5a3d2a]">
                Vinculaciones sin perfil
              </h3>
              <p className="mt-2 text-sm text-[#7a5a45]">
                Hay memberships cuyo `user_id` no aparece en `profiles`.
              </p>

              <div className="mt-4 space-y-2">
                {orphanMembershipUserIds.map((userId) => (
                  <div
                    key={userId}
                    className="rounded-xl border border-yellow-200 bg-white px-3 py-2 text-sm break-all text-[#5a3d2a]"
                  >
                    {userId}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}