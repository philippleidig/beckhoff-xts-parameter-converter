export interface ModuleDescriptor {
  key: string
  label: string
  /** BMP icon as it appears in the TMC, hex-encoded. */
  iconHex: string
}

/*
 * `SD_MODULES` and `MC_MODULES` are now part of the generated per-version dataset —
 * the icons too, which were previously hex blobs copied into `icons/imageData.ts`.
 * Use `mcModules()` / `sdModules()` from `@/lib/tmc/registry`.
 */
