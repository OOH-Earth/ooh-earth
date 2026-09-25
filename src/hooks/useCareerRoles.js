import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ROLES as BASE_ROLES } from '@/components/ooh/careers/roles';

// Merges live status/visibility overrides from the CareerRoleStatus entity
// (edited at /careers/admin) onto the code-defined role content. Falls back
// to roles.js defaults until the console has provisioned records, or if the
// fetch fails/is still loading -- same fallback behaviour as before this was
// shared, just expressed as "no data yet" instead of a local catch block.
// Shared by /careers and /careers/:id, which previously each ran their own
// independent copy of this fetch with no caching between them.
export function useCareerRoles() {
  const { data } = useQuery({
    queryKey: ['career-role-status'],
    queryFn: () => base44.entities.CareerRoleStatus.list('sort_order'),
  });

  if (!data?.length) return BASE_ROLES;

  return BASE_ROLES.map((r) => {
    const rec = data.find((x) => x.role_id === r.id);
    return rec ? { ...r, status: rec.status, visible: rec.visible !== false } : r;
  });
}
