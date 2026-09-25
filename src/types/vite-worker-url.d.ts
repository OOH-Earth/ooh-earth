// Vite's `?worker&url` import suffix (used in src/lib/maplibreWorkerSetup.js
// to get maplibre-gl's worker bundled as a self-contained chunk and resolve
// to its real, correctly-hashed URL) isn't declared by this project's
// jsconfig -- no vite/client types reference exists here. This is the same
// declaration Vite's own `vite/client.d.ts` provides for that suffix,
// scoped narrowly rather than pulling in the full vite/client ambient set.
declare module '*?worker&url' {
  const url: string;
  export default url;
}
