/**
 * The on-disk record of which TMC versions are known and where they came from.
 *
 * `tmc/index.json` is the source of truth for "what have we already fetched". Entries
 * are kept for versions that yielded nothing too, so a package without a TMC is not
 * re-downloaded on every run.
 */

import { gunzipSync, gzipSync } from 'node:zlib'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { compareVersions } from './feed.mjs'
import { sha256, TMC_FILES } from './msi.mjs'

export const MANIFEST_PATH = 'tmc/index.json'

/**
 * Maximum compression, and deterministic: Node writes no timestamp into the gzip
 * header, so re-compressing the same bytes produces the same file and does not show
 * up as a spurious change.
 */
const GZIP_OPTIONS = { level: 9 }

export function readManifest(root) {
  const path = join(root, MANIFEST_PATH)
  if (!existsSync(path)) {
    return { packageId: null, feed: null, versions: [] }
  }
  return JSON.parse(readFileSync(path, 'utf8'))
}

export function writeManifest(root, manifest) {
  const path = join(root, MANIFEST_PATH)
  mkdirSync(dirname(path), { recursive: true })

  const ordered = {
    ...manifest,
    versions: [...manifest.versions].sort((a, b) => compareVersions(a.package, b.package)),
  }

  writeFileSync(path, `${JSON.stringify(ordered, null, 2)}\n`)
}

/** Reads a stored TMC back as text. The byte order mark is left for the parser. */
export function readTmc(root, version, fileName) {
  return gunzipSync(readFileSync(join(root, 'tmc', version, `${fileName}.gz`))).toString('utf8')
}

/**
 * Stores the two TMCs of one version and returns its manifest entry.
 *
 * When the files are byte-identical to a version already stored, nothing is written
 * and the entry points at that version instead. Most TF5850 releases change the
 * installer without changing the driver metadata, and gzipped blobs do not delta in
 * git, so this is what keeps the repository from growing by a quarter of a megabyte
 * per release for no new information.
 */
export function storeVersion(root, { pkg, files, extractor, tmcVersions }, manifest) {
  const hashes = Object.fromEntries(TMC_FILES.map((fileName) => [fileName, sha256(files[fileName])]))

  const identical = manifest.versions.find(
    (entry) =>
      entry.status === 'ok' &&
      !entry.sameTmcAs &&
      TMC_FILES.every((fileName) => entry.sha256?.[fileName] === hashes[fileName])
  )

  const entry = {
    package: pkg.version,
    published: pkg.published ?? null,
    tcIoXts: tmcVersions.TcIoXts,
    tcSoftDrive: tmcVersions.TcSoftDrive,
    status: 'ok',
    extractor,
    sha256: hashes,
  }

  if (identical) {
    entry.sameTmcAs = identical.package
    return entry
  }

  const directory = join(root, 'tmc', pkg.version)
  mkdirSync(directory, { recursive: true })
  for (const fileName of TMC_FILES) {
    writeFileSync(join(directory, `${fileName}.gz`), gzipSync(files[fileName], GZIP_OPTIONS))
  }

  return entry
}

/** The version whose directory actually holds the files for `entry`. */
export function artifactVersion(entry) {
  return entry.sameTmcAs ?? entry.package
}

/**
 * Whether a version still needs fetching.
 *
 * A version that was fetched successfully, or that provably has no TMC, is done. An
 * entry recorded after an error is retried, because the cause was as likely to be the
 * network as the package.
 */
export function needsFetch(entry) {
  return !entry || (entry.status !== 'ok' && entry.status !== 'no-tmc')
}
