import type { ModuleDescriptor } from '@/lib/converter/modules'
import type { ParameterMeta } from '@/lib/converter/types'
import index from '@/data/tmc/index.json'
import { DEFAULT_DATASET, DEFAULT_TEMPLATE } from '@/data/tmc/default'

/**
 * Access to the driver metadata, per TcIoXts version.
 *
 * Everything here is generated from the vendor's `.tmc` files by
 * `scripts/generate-tmc-data.mjs` and committed under `src/data/tmc/`, so the browser
 * does no derivation and a driver update shows up as a reviewable diff.
 *
 * The default version is imported statically, because most sessions never change it
 * and several call sites read the metadata during module initialisation. Every other
 * version is a separate lazily-loaded chunk, so a long release history costs nothing
 * until someone picks a version from it.
 */

export interface ParameterMetaByModule {
  [moduleKey: string]: Record<string, ParameterMeta>
}

export interface TmcDataset {
  version: string
  libraries: { TcIoXts: string; TcSoftDrive: string }
  mc: { modules: ModuleDescriptor[]; parameters: ParameterMetaByModule }
  sd: { modules: ModuleDescriptor[]; parameters: ParameterMetaByModule }
}

export interface TmcVersionInfo {
  /** The TcIoXts version, which is what the user picks. */
  version: string
  /** The package version it was published in; not always the same number. */
  package: string
  /** Directory under `src/data/tmc` holding the artifacts, shared between identical versions. */
  artifacts: string
  published: string | null
  tcSoftDrive: string
  /** Parameters the driver has that the overlay does not surface. Informational. */
  unlistedParameters: number
}

/** Every known driver version, newest first. */
export const TMC_VERSIONS: TmcVersionInfo[] = index.versions

export const DEFAULT_TMC_VERSION: string = index.defaultVersion

const DATASETS = import.meta.glob<{ default: TmcDataset }>('@/data/tmc/*/dataset.json')
const TEMPLATES = import.meta.glob('@/data/tmc/*/template.xti', { query: '?raw', import: 'default' })

const loaded = new Map<string, { dataset: TmcDataset; template: string }>([
  [DEFAULT_TMC_VERSION, { dataset: DEFAULT_DATASET as TmcDataset, template: DEFAULT_TEMPLATE }],
])

let activeVersion = DEFAULT_TMC_VERSION

export function findVersion(version: string): TmcVersionInfo | undefined {
  return TMC_VERSIONS.find((entry) => entry.version === version)
}

/**
 * Loads a version's artifacts, if they are not already in memory.
 *
 * Resolving to `false` rather than throwing keeps a stale selection — a version that
 * was removed from the store since it was last chosen — from blanking the application
 * on start-up. The caller falls back to the default.
 */
export async function loadTmcVersion(version: string): Promise<boolean> {
  if (loaded.has(version)) return true

  const info = findVersion(version)
  if (!info) return false

  const datasetKey = Object.keys(DATASETS).find((path) => path.includes(`/${info.artifacts}/`))
  const templateKey = Object.keys(TEMPLATES).find((path) => path.includes(`/${info.artifacts}/`))
  if (!datasetKey || !templateKey) return false

  const [dataset, template] = await Promise.all([
    DATASETS[datasetKey]() as Promise<{ default: TmcDataset } | TmcDataset>,
    TEMPLATES[templateKey]() as Promise<string>,
  ])

  loaded.set(version, {
    dataset: ('default' in dataset ? dataset.default : dataset) as TmcDataset,
    template,
  })
  return true
}

/** Switches the active version. Its artifacts must already be loaded. */
export function setActiveTmcVersion(version: string): void {
  if (!loaded.has(version)) {
    throw new Error(`TcIoXts ${version} has not been loaded. Call loadTmcVersion() first.`)
  }
  activeVersion = version
}

export function activeTmcVersion(): string {
  return activeVersion
}

export function activeDataset(): TmcDataset {
  return loaded.get(activeVersion)!.dataset
}

/** The XTI template of the active version, already generated for that driver. */
export function activeTemplate(): string {
  return loaded.get(activeVersion)!.template
}

export function mcParameterMeta(): ParameterMetaByModule {
  return activeDataset().mc.parameters
}

export function sdParameterMeta(): ParameterMetaByModule {
  return activeDataset().sd.parameters
}

export function mcModules(): ModuleDescriptor[] {
  return activeDataset().mc.modules
}

export function sdModules(): ModuleDescriptor[] {
  return activeDataset().sd.modules
}
