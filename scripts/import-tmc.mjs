#!/usr/bin/env node
/**
 * Imports TMC files from a local directory into the version store.
 *
 *   node scripts/import-tmc.mjs <directory> [--dry-run]
 *
 * The counterpart to `fetch-tmc.mjs`, for TMCs that did not come from the package feed
 * — a release archive from Beckhoff, or files copied out of a TwinCAT installation.
 * It needs no credentials and no MSI tooling.
 *
 * The directory is scanned recursively and every `.tmc` below it is taken, whatever it
 * is called and however it is nested. The version comes from each file's own
 * `<Library><Version>` element rather than from its path: vendor archives are zipped on
 * Windows and arrive with backslash separators that extract into names no glob will
 * match, and the file itself is the authority on which version it describes anyway.
 */

import { readFileSync } from 'node:fs'
import { argv } from 'node:process'
import { basename, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { walkFiles } from './lib/msi.mjs'
import { readManifest, storeVersion, writeManifest } from './lib/store.mjs'
import { parseLibrary, stripBom } from './lib/tmc.mjs'

/** Library names this project reads, mapped to the file name they are stored under. */
const KNOWN_LIBRARIES = { TcIoXts: 'TcIoXts.tmc', TcSoftDrive: 'TcSoftDrive.tmc' }

function parseArgs(argv) {
  const options = { directory: null, dryRun: false }

  for (const arg of argv) {
    if (arg === '--dry-run') options.dryRun = true
    else if (arg.startsWith('--')) throw new Error(`Unknown option '${arg}'. Supported: --dry-run`)
    else if (options.directory) throw new Error('Give exactly one directory.')
    else options.directory = arg
  }

  if (!options.directory) {
    throw new Error('Usage: node scripts/import-tmc.mjs <directory> [--dry-run]')
  }

  return options
}

/** Groups every TMC below `directory` by the driver version it declares. */
export function collect(directory) {
  const byVersion = new Map()
  const skipped = []

  for (const path of walkFiles(directory)) {
    if (!path.toLowerCase().endsWith('.tmc')) continue

    const bytes = readFileSync(path)
    let library
    try {
      library = parseLibrary(stripBom(bytes.toString('utf8')))
    } catch (error) {
      skipped.push(`${path}: ${error.message}`)
      continue
    }

    const fileName = KNOWN_LIBRARIES[library.name]
    if (!fileName) {
      skipped.push(`${path}: describes '${library.name}', which this project does not read`)
      continue
    }

    const entry = byVersion.get(library.version) ?? { files: {}, sources: {} }
    if (entry.files[fileName]) {
      // Vendor archives ship the same TMC under several paths; identical copies are
      // fine, genuinely different ones would make the import order decide the outcome.
      if (!entry.files[fileName].equals(bytes)) {
        throw new Error(
          `Two different ${fileName} files both declare version ${library.version}:\n` +
          `  ${entry.sources[fileName]}\n  ${path}`
        )
      }
      continue
    }

    entry.files[fileName] = bytes
    entry.sources[fileName] = path
    byVersion.set(library.version, entry)
  }

  return { byVersion, skipped }
}

function main() {
  const options = parseArgs(process.argv.slice(2))
  const root = fileURLToPath(new URL('..', import.meta.url))
  const directory = resolve(options.directory)

  const { byVersion, skipped } = collect(directory)
  for (const note of skipped) console.warn(`  skipped ${note}`)

  if (byVersion.size === 0) {
    throw new Error(`No TcIoXts or TcSoftDrive TMC found below ${directory}.`)
  }

  const manifest = readManifest(root)
  const versions = [...byVersion.keys()].sort()

  console.log(`Found ${versions.length} driver version(s) below ${basename(directory)}.`)

  if (options.dryRun) {
    for (const version of versions) {
      console.log(`  ${version}: ${Object.keys(byVersion.get(version).files).join(', ')}`)
    }
    return
  }

  for (const version of versions) {
    const { files } = byVersion.get(version)
    const tmcVersions = Object.fromEntries(
      Object.entries(files).map(([fileName, bytes]) => [
        fileName.replace(/\.tmc$/, ''),
        parseLibrary(stripBom(bytes.toString('utf8'))).version,
      ])
    )

    const entry = storeVersion(root, { pkg: { version }, files, extractor: 'import', tmcVersions }, manifest)
    entry.source = `imported from ${basename(directory)}`

    const index = manifest.versions.findIndex((existing) => existing.package === version)
    if (index === -1) manifest.versions.push(entry)
    else manifest.versions[index] = entry

    console.log(
      `  ${version}: ${Object.keys(files).join(', ')}` +
      (entry.sameTmcAs ? ` (identical to ${entry.sameTmcAs}, no files written)` : '')
    )
  }

  writeManifest(root, manifest)
  console.log(`Stored ${versions.length} version(s). Run 'npm run tmc:generate' next.`)
}

// Only when run as a command. `collect()` is imported by its test, which must not
// trigger a store write as a side effect of loading this module.
if (argv[1] && resolve(argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main()
  } catch (error) {
    console.error(error.message)
    process.exit(1)
  }
}
