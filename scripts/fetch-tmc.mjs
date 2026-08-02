#!/usr/bin/env node
/**
 * Fetches TcIoXts and TcSoftDrive TMC files from the Beckhoff package feed.
 *
 * Run it locally once to backfill the release history, then let the scheduled workflow
 * pick up new releases:
 *
 *   TCPKG_USERNAME=… TCPKG_PASSWORD=… node scripts/fetch-tmc.mjs --dry-run
 *   TCPKG_USERNAME=… TCPKG_PASSWORD=… node scripts/fetch-tmc.mjs
 *
 * The run is idempotent: versions already recorded in `tmc/index.json` are skipped, so
 * an interrupted backfill can simply be repeated.
 */

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { credentialsFromEnv, downloadPackage, listPackageVersions } from './lib/feed.mjs'
import { checkToolchain, extractTmcFiles, TMC_FILES } from './lib/msi.mjs'
import { needsFetch, readManifest, storeVersion, writeManifest } from './lib/store.mjs'
import { parseLibrary, stripBom } from './lib/tmc.mjs'

// Lower case: the server is case-sensitive about the feed name.
const DEFAULT_FEED = 'https://public.tcpkg.beckhoff-cloud.com/api/v1/feeds/stable'
const DEFAULT_PACKAGE = 'TF5850.XTS.XAE'

/** Keeps one bad day from producing a twenty-version commit nobody reviews. */
const DEFAULT_MAX_NEW = 3

function parseArgs(argv) {
  const options = { max: DEFAULT_MAX_NEW, dryRun: false, force: null, probe: false }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--dry-run') options.dryRun = true
    else if (arg === '--probe') options.probe = true
    else if (arg === '--all') options.max = Number.POSITIVE_INFINITY
    else if (arg === '--max') options.max = Number(argv[++i])
    else if (arg === '--force') options.force = argv[++i]
    else throw new Error(`Unknown option '${arg}'. Supported: --dry-run --probe --all --max <n> --force <version>`)
  }

  return options
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const root = fileURLToPath(new URL('..', import.meta.url))
  const feed = process.env.TCPKG_FEED ?? DEFAULT_FEED
  const packageId = process.env.TCPKG_PACKAGE ?? DEFAULT_PACKAGE

  const credentials = credentialsFromEnv()
  console.log(
    credentials
      ? 'Using the credentials from TCPKG_USERNAME / TCPKG_PASSWORD.'
      : 'No credentials configured; requesting the feed anonymously.'
  )

  // Listing versions unpacks nothing, so the extractor is only needed for a real run.
  if (!options.dryRun && !options.probe) checkToolchain()

  const manifest = readManifest(root)
  manifest.packageId = packageId
  manifest.feed = feed

  const published = await listPackageVersions(feed, packageId, credentials)
  console.log(`Feed lists ${published.length} version(s) of ${packageId}.`)

  if (options.probe) {
    for (const pkg of published) console.log(`  ${pkg.version}  published=${pkg.published ?? '?'}  ${pkg.contentUrl ?? ''}`)
    return
  }

  const known = new Map(manifest.versions.map((entry) => [entry.package, entry]))
  const pending = published.filter((pkg) =>
    options.force ? pkg.version === options.force : needsFetch(known.get(pkg.version))
  )

  if (pending.length === 0) {
    console.log('Nothing new.')
    return
  }

  // Newest first, so a capped run always brings in the releases that matter most.
  const selected = pending.slice().reverse().slice(0, options.max)
  console.log(`${pending.length} version(s) to fetch, taking ${selected.length}.`)

  if (options.dryRun) {
    for (const pkg of selected) console.log(`  would fetch ${pkg.version}`)
    return
  }

  for (const pkg of selected) {
    const workDir = mkdtempSync(join(tmpdir(), 'tmc-sync-'))
    try {
      console.log(`Fetching ${packageId} ${pkg.version} …`)
      const nupkg = await downloadPackage(pkg, feed, credentials)
      const nupkgPath = join(workDir, 'package.nupkg')
      writeFileSync(nupkgPath, nupkg)

      const { files, extractor, reason } = extractTmcFiles(nupkgPath, workDir)

      if (reason) {
        console.log(`  no TMC: ${reason}`)
        upsert(manifest, { package: pkg.version, published: pkg.published ?? null, status: 'no-tmc', reason })
        continue
      }

      // Stored verbatim, byte order mark included, so the recorded hash is a hash of
      // the vendor's file and not of something this script normalised. Only the files
      // the package actually carried — TcSoftDrive is optional.
      const present = TMC_FILES.filter((fileName) => files[fileName])
      const contents = Object.fromEntries(present.map((fileName) => [fileName, readFileSync(files[fileName])]))
      const tmcVersions = Object.fromEntries(
        present.map((fileName) => [
          fileName.replace(/\.tmc$/, ''),
          parseLibrary(stripBom(contents[fileName].toString('utf8'))).version,
        ])
      )

      const entry = storeVersion(root, { pkg, files: contents, extractor, tmcVersions }, manifest)
      upsert(manifest, entry)

      console.log(
        `  stored TcIoXts ${entry.tcIoXts}` +
        (entry.tcSoftDrive ? ` / TcSoftDrive ${entry.tcSoftDrive}` : ' (no SoftDrive TMC in this package)') +
        (entry.sameTmcAs ? ` (identical to ${entry.sameTmcAs}, no files written)` : '')
      )
    } catch (error) {
      // Recorded but retryable: the next run tries again rather than writing this off.
      console.error(`  failed: ${error.message}`)
      upsert(manifest, { package: pkg.version, published: pkg.published ?? null, status: 'error', reason: error.message })
      process.exitCode = 1
    } finally {
      rmSync(workDir, { recursive: true, force: true })
    }
  }

  manifest.lastCheckedUtc = new Date().toISOString()
  writeManifest(root, manifest)
}

function upsert(manifest, entry) {
  const index = manifest.versions.findIndex((existing) => existing.package === entry.package)
  if (index === -1) manifest.versions.push(entry)
  else manifest.versions[index] = entry
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
