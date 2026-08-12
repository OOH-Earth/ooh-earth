// src/api/base44Client.js attaches a real runtime method to the SDK client
// instance (see the comment there) that the @base44/sdk package's own
// Base44Client interface doesn't declare. This is declaration merging, not
// a new capability — it documents behavior that already exists at runtime
// and is called from 8+ call sites (CarbonCounter, CityPulse,
// DashboardDropdown, HeroConsole, Leaderboard, OffenderRegistry,
// OperativeNetwork, ...).
import '@base44/sdk';

declare module '@base44/sdk' {
  interface Base44Client {
    listAllLocations(sort?: string, pageSize?: number, hardCap?: number): Promise<any[]>;
  }
}
