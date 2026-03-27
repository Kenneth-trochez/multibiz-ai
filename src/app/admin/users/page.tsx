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
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("es-HN");
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

      supabase.from("businesses").select("id, name, slug"),
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

  const businessMap = new Map(businesses.map((business) => [business.id, business]));
  const platformAdminSet = new Set(platformAdmins.map((item) => item.user_id));

  const membersByUser = new Map<string, BusinessMemberRow[]>();
  for (const member of members) {
    const current = membersByUser.get(member.user_id) || [];
    current.push(member);
    membersByUser.set(member.user_id, current);
  }

  const profileIds = new Set(profiles.map((profile) => profile.id));
  const orphanMembershipUserIds = [
    ...new Set(
      members
        .map((member) => member.user_id)
        .filter((userId) => !profileIds.has(userId))
    ),
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-[#e7d8c7] bg-[#fffaf3] p-6 shadow-sm">
        <h2 className="text-3xl font-bold text-[#2f241d]">Usuarios</h2>
        <p className="mt-2 text-sm text-[#6b5b4d]">
          Vista global de perfiles, membresías y admins internos.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          Error cargando usuarios: {error.message}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[1.5rem] border border-[#e7d8c7] bg-[#fffaf3] p-5 shadow-sm">
              <p className="text-sm text-[#6b5b4d]">Perfiles</p>
              <p className="mt-2 text-3xl font-bold text-[#2f241d]">{profiles.length}</p>
            </div>

            <div className="rounded-[1.5rem] border border-[#e7d8c7] bg-[#fffaf3] p-5 shadow-sm">
              <p className="text-sm text-[#6b5b4d]">Platform admins</p>
              <p className="mt-2 text-3xl font-bold text-[#2f241d]">{platformAdmins.length}</p>
            </div>

            <div className="rounded-[1.5rem] border border-[#e7d8c7] bg-[#fffaf3] p-5 shadow-sm">
              <p className="text-sm text-[#6b5b4d]">Usuarios con negocios</p>
              <p className="mt-2 text-3xl font-bold text-[#2f241d]">{membersByUser.size}</p>
            </div>

            <div className="rounded-[1.5rem] border border-[#e7d8c7] bg-[#fffaf3] p-5 shadow-sm">
              <p className="text-sm text-[#6b5b4d]">Vinculaciones huérfanas</p>
              <p className="mt-2 text-3xl font-bold text-[#2f241d]">{orphanMembershipUserIds.length}</p>
            </div>
          </div>

          {profiles.length === 0 ? (
            <div className="rounded-[1.5rem] border border-[#e7d8c7] bg-[#fffaf3] p-6 text-[#6b5b4d] shadow-sm">
              No hay perfiles registrados.
            </div>
          ) : (
            <div className="space-y-4">
              {profiles.map((profile) => {
                const userMemberships = membersByUser.get(profile.id) || [];
                const isPlatformAdmin = platformAdminSet.has(profile.id);

                return (
                  <div
                    key={profile.id}
                    className="rounded-[1.5rem] border border-[#e7d8c7] bg-[#fffaf3] p-5 shadow-sm"
                  >
                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-semibold text-[#2f241d]">
                            {profile.full_name?.trim() || "Sin nombre"}
                          </h3>

                          {isPlatformAdmin && (
                            <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs text-green-700">
                              Platform admin
                            </span>
                          )}

                          {userMemberships.length === 0 && (
                            <span className="rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs text-yellow-700">
                              Sin negocios
                            </span>
                          )}
                        </div>

                        <div className="mt-3 grid gap-3 text-sm text-[#6b5b4d] md:grid-cols-2">
                          <div className="min-w-0">
                            <p className="font-medium text-[#3f3128]">User ID:</p>
                            <p className="break-all">{profile.id}</p>
                          </div>

                          <div className="min-w-0">
                            <p className="font-medium text-[#3f3128]">Email:</p>
                            <p className="break-all">{profile.email || "—"}</p>
                          </div>

                          <div>
                            <p className="font-medium text-[#3f3128]">Creado:</p>
                            <p>{formatDate(profile.created_at)}</p>
                          </div>

                          <div>
                            <p className="font-medium text-[#3f3128]">Actualizado:</p>
                            <p>{formatDate(profile.updated_at)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="w-full rounded-[1.5rem] border border-[#ead9c8] bg-[#fff7ee] p-4">
                        <p className="mb-3 text-sm font-medium text-[#3f3128]">
                          Negocios vinculados ({userMemberships.length})
                        </p>

                        {userMemberships.length === 0 ? (
                          <p className="text-sm text-[#6b5b4d]">
                            Este usuario no tiene memberships en negocios.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {userMemberships.map((membership) => {
                              const business = businessMap.get(membership.business_id);

                              return (
                                <div
                                  key={membership.id}
                                  className="rounded-xl border border-[#ead9c8] bg-white px-3 py-2"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium text-[#2f241d]">
                                        {business?.name || "Negocio no encontrado"}
                                      </p>
                                      <p className="break-all text-xs text-[#6b5b4d]">
                                        {business?.slug || membership.business_id}
                                      </p>
                                    </div>

                                    <span className="rounded-full border border-[#e7d8c7] bg-[#f8efe5] px-3 py-1 text-xs text-[#6b5b4d]">
                                      {membership.role}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
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