export function roleOf(user: any) {
  return user?.role ?? user?.data?.role ?? 'user';
}

export function accessOf(user: any) {
  return user?.access ?? user?.data?.access ?? 'member';
}

export function agencyOf(user: any) {
  return !!(user?.agency ?? user?.data?.agency);
}

export function isPlatformAdmin(user: any) {
  return !!user && roleOf(user) === 'admin';
}

export function isAppAdmin(user: any) {
  return !!user && (roleOf(user) === 'admin' || accessOf(user) === 'admin');
}

export function isAgency(user: any) {
  return isAppAdmin(user) || agencyOf(user);
}
