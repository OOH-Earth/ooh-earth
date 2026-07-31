// Single source of truth for reading a user's clearance from the Base44 user
// object (which may be flat or nested under `.data`), plus the response
// unwrapper used across function-invoke call sites.
//
// Consolidated per security audit F13 — these helpers were previously
// re-implemented verbatim across Dashboard, Blog, Sitemap, AgencyNewsroom,
// Account, AccountMenu, and PortalOps. A future access-model change is now a
// single edit here instead of five-plus files in lockstep.

export const roleOf = (u) => (u && (u.role ?? u.data?.role)) || "user";
export const accessOf = (u) => (u && (u.access ?? u.data?.access)) || "member";
export const agencyOf = (u) => !!(u && (u.agency ?? u.data?.agency));
export const isAdmin = (u) => roleOf(u) === "admin" || accessOf(u) === "admin";

// Unwrap a Base44 function-invoke response ({ data } | data).
export const payload = (res) => (res && typeof res === "object" && "data" in res ? res.data : res);
