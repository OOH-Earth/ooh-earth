export function isAppAdmin(user: any) {
  return user?.role === 'admin' || user?.access === 'admin';
}
