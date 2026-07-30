/**
 * Gets the TMC files out of a downloaded package.
 *
 * The path is `.nupkg` (a zip) → `.msi` (a Windows installer, often with its payload
 * in a CAB stream) → `TcIoXts.tmc` / `TcSoftDrive.tmc`. Two things about it are
 * assumed rather than verified, because the feed needs credentials nobody has yet:
 * that the MSI is inside this package at all, and how its files are laid out. Both
 * assumptions are checked at runtime and reported precisely when they do not hold.
 */

import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

/** The two files this project needs, matched however the vendor capitalises them. */
export const TMC_FILES = ['TcIoXts.tmc', 'TcSoftDrive.tmc']

/** Recognises a TMC by content, for the case where extraction mangles file names. */
const TMC_SIGNATURE = /<TcModuleClass[\s>]/

function which(command) {
  try {
    execFileSync('sh', ['-c', `command -v ${command}`], { stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

/**
 * Checks the external tools up front.
 *
 * Discovering halfway through a 40-version backfill that the extractor is missing
 * wastes the whole run, so this is called before the first download.
 */
export function checkToolchain() {
  const missing = []
  if (!which('unzip')) missing.push('unzip')
  if (!which('msiextract') && !which('7z')) missing.push('msitools (msiextract) or p7zip (7z)')

  if (missing.length > 0) {
    throw new Error(
      `Missing tools needed to unpack the package: ${missing.join(', ')}.\n` +
      'On Debian or Ubuntu: sudo apt-get install -y unzip msitools'
    )
  }
}

export function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex')
}

/** Every file below `root`, recursively. */
export function walkFiles(root) {
  const found = []

  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name)
      if (entry.isDirectory()) visit(path)
      else if (entry.isFile()) found.push(path)
    }
  }

  if (statSync(root, { throwIfNoEntry: false })?.isDirectory()) visit(root)
  return found
}

/**
 * Finds a TMC by name, case-insensitively.
 *
 * The repository spells it `TcSoftDrive.tmc` and parts of the Beckhoff documentation
 * spell it `TcSoftdrive.tmc`, and MSI extraction can produce either — or, via the 7z
 * fallback, an 8.3-mangled name, which is why content sniffing is the last resort.
 */
export function findTmcFile(paths, fileName) {
  const wanted = fileName.toLowerCase()
  const byName = paths.filter((path) => path.split('/').pop().toLowerCase() === wanted)
  if (byName.length > 0) return byName

  const library = fileName.replace(/\.tmc$/i, '').toLowerCase()
  return paths.filter((path) => {
    if (!path.toLowerCase().endsWith('.tmc')) return false
    const head = readFileSync(path, 'utf8').slice(0, 4000)
    return TMC_SIGNATURE.test(head) && new RegExp(`<Name>${library}</Name>`, 'i').test(head)
  })
}

/**
 * Picks the one real file among several matches.
 *
 * An MSI can install the same file to more than one location. Identical copies are
 * fine; genuinely different ones are not, and choosing silently would put unexplained
 * content into the repository.
 */
export function pickUnique(paths, fileName) {
  if (paths.length <= 1) return paths[0]

  const distinct = new Set(paths.map((path) => sha256(readFileSync(path))))
  if (distinct.size === 1) return paths[0]

  throw new Error(
    `The package contains ${distinct.size} different versions of ${fileName}:\n` +
    paths.map((path) => `  ${path}`).join('\n')
  )
}

function run(command, args, cwd) {
  execFileSync(command, args, { cwd, stdio: 'pipe', maxBuffer: 512 * 1024 * 1024 })
}

export function extractZip(archivePath, destination) {
  run('unzip', ['-qq', '-o', archivePath, '-d', destination])
}

/**
 * Unpacks an MSI.
 *
 * `msiextract` is preferred: it rebuilds the installer's directory tree with long file
 * names and expands CAB-compressed streams on its own. `7z` is the fallback and needs
 * a second pass over any CAB it leaves behind, and produces less useful names.
 */
export function extractMsi(msiPath, destination) {
  if (which('msiextract')) {
    run('msiextract', ['-C', destination, msiPath])
    return 'msiextract'
  }

  run('7z', ['x', '-y', `-o${destination}`, msiPath])
  for (const cab of walkFiles(destination).filter((path) => path.toLowerCase().endsWith('.cab'))) {
    run('7z', ['x', '-y', `-o${destination}`, cab])
  }
  return '7z'
}

/**
 * Extracts the TMC files from a downloaded package into `workDir`.
 *
 * Returns the files that were found along with how they were obtained. A package with
 * no TMC is a result, not a failure: older TF5850 releases may predate the
 * MoverController, and the caller records that so the version is not retried forever.
 */
export function extractTmcFiles(nupkgPath, workDir) {
  const packageDir = join(workDir, 'package')
  extractZip(nupkgPath, packageDir)

  const packageFiles = walkFiles(packageDir)
  const found = {}
  let extractor = 'nupkg'

  // Some packages ship the files directly rather than wrapping them in an installer.
  for (const fileName of TMC_FILES) {
    const direct = findTmcFile(packageFiles, fileName)
    if (direct.length > 0) found[fileName] = pickUnique(direct, fileName)
  }

  if (Object.keys(found).length < TMC_FILES.length) {
    const installers = packageFiles.filter((path) => path.toLowerCase().endsWith('.msi'))

    for (const [index, installer] of installers.entries()) {
      const msiDir = join(workDir, `msi-${index}`)
      extractor = extractMsi(installer, msiDir)
      const msiFiles = walkFiles(msiDir)

      for (const fileName of TMC_FILES) {
        if (found[fileName]) continue
        const matches = findTmcFile(msiFiles, fileName)
        if (matches.length > 0) found[fileName] = pickUnique(matches, fileName)
      }
    }

    if (installers.length === 0 && Object.keys(found).length === 0) {
      return { files: {}, extractor: 'none', reason: 'the package contains neither an .msi nor a .tmc' }
    }
  }

  const missing = TMC_FILES.filter((fileName) => !found[fileName])
  if (missing.length > 0) {
    return { files: found, extractor, reason: `${missing.join(' and ')} not found in the package` }
  }

  return { files: found, extractor }
}
