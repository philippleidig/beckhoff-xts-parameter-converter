import { mkdtempSync, readFileSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { artifactVersion, needsFetch, readManifest, readTmc, storeVersion, writeManifest } from './store.mjs'
import { findTmcFile, pickUnique, sha256 } from './msi.mjs'
import { parseLibrary } from './tmc.mjs'

describe('storeVersion', () => {
  let root

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'store-test-'))
  })
  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  const files = (marker) => ({
    'TcIoXts.tmc': Buffer.from(`<TcModuleClass>${marker}</TcModuleClass>`),
    'TcSoftDrive.tmc': Buffer.from(`<TcModuleClass>sd-${marker}</TcModuleClass>`),
  })
  const versions = { TcIoXts: '4.4.22.0', TcSoftDrive: '4.4.22.0' }

  it('writes both files and records their hashes', () => {
    const manifest = { versions: [] }
    const entry = storeVersion(root, { pkg: { version: '4.4.22.0' }, files: files('a'), extractor: 'msiextract', tmcVersions: versions }, manifest)

    expect(entry.status).toBe('ok')
    expect(entry.sha256['TcIoXts.tmc']).toBe(sha256(files('a')['TcIoXts.tmc']))
    expect(readTmc(root, '4.4.22.0', 'TcIoXts.tmc')).toBe('<TcModuleClass>a</TcModuleClass>')
  })

  /**
   * Most releases ship an unchanged driver. Gzipped blobs do not delta in git, so
   * writing them again would cost a quarter of a megabyte per release for no new
   * information — and `buildXtiXml()` rewrites the version string anyway, so one
   * stored copy legitimately serves them all.
   */
  it('points a byte-identical release at the version that introduced it', () => {
    const manifest = { versions: [] }
    manifest.versions.push(
      storeVersion(root, { pkg: { version: '4.4.22.0' }, files: files('a'), extractor: 'seed', tmcVersions: versions }, manifest)
    )

    const later = storeVersion(
      root,
      { pkg: { version: '4.4.23.0' }, files: files('a'), extractor: 'msiextract', tmcVersions: versions },
      manifest
    )

    expect(later.sameTmcAs).toBe('4.4.22.0')
    expect(existsSync(join(root, 'tmc', '4.4.23.0'))).toBe(false)
    expect(artifactVersion(later)).toBe('4.4.22.0')
  })

  it('stores a release whose driver metadata actually changed', () => {
    const manifest = { versions: [] }
    manifest.versions.push(
      storeVersion(root, { pkg: { version: '4.4.22.0' }, files: files('a'), extractor: 'seed', tmcVersions: versions }, manifest)
    )

    const later = storeVersion(
      root,
      { pkg: { version: '4.5.0.0' }, files: files('b'), extractor: 'msiextract', tmcVersions: versions },
      manifest
    )

    expect(later.sameTmcAs).toBeUndefined()
    expect(readTmc(root, '4.5.0.0', 'TcIoXts.tmc')).toContain('>b<')
  })

  it('compresses reproducibly, so an unchanged file is not a change', () => {
    const first = storeVersion(root, { pkg: { version: '1.0.0.0' }, files: files('a'), extractor: 'seed', tmcVersions: versions }, { versions: [] })
    const before = readFileSync(join(root, 'tmc', '1.0.0.0', 'TcIoXts.tmc.gz'))

    storeVersion(root, { pkg: { version: '1.0.0.0' }, files: files('a'), extractor: 'seed', tmcVersions: versions }, { versions: [] })

    expect(readFileSync(join(root, 'tmc', '1.0.0.0', 'TcIoXts.tmc.gz'))).toEqual(before)
    expect(first.package).toBe('1.0.0.0')
  })

  it('keeps the manifest ordered by version, not by when it was fetched', () => {
    writeManifest(root, {
      versions: [{ package: '4.4.9.0' }, { package: '4.5.0.0' }, { package: '4.4.22.0' }],
    })

    expect(readManifest(root).versions.map((entry) => entry.package)).toEqual(['4.4.9.0', '4.4.22.0', '4.5.0.0'])
  })
})

describe('needsFetch', () => {
  it('fetches a version that is not recorded yet', () => {
    expect(needsFetch(undefined)).toBe(true)
  })

  it('leaves a stored version alone', () => {
    expect(needsFetch({ status: 'ok' })).toBe(false)
  })

  // A package that provably has no TMC will never grow one; re-downloading it every
  // night would be pure waste.
  it('does not retry a package that has no TMC', () => {
    expect(needsFetch({ status: 'no-tmc' })).toBe(false)
  })

  // A failure is as likely to have been the network as the package.
  it('retries a version that failed', () => {
    expect(needsFetch({ status: 'error' })).toBe(true)
  })
})

describe('findTmcFile', () => {
  // The repository spells it TcSoftDrive.tmc, parts of the Beckhoff documentation
  // spell it TcSoftdrive.tmc, and the installer decides which one lands on disk.
  it('matches the file name whatever its capitalisation', () => {
    const paths = ['/x/TcSoftdrive.tmc', '/x/other.txt']

    expect(findTmcFile(paths, 'TcSoftDrive.tmc')).toEqual(['/x/TcSoftdrive.tmc'])
  })

  it('finds nothing rather than guessing at an unrelated file', () => {
    expect(findTmcFile(['/x/readme.txt'], 'TcIoXts.tmc')).toEqual([])
  })
})

describe('pickUnique', () => {
  let root
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'pick-test-'))
  })
  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  it('accepts the same file installed to two locations', async () => {
    const { writeFileSync } = await import('node:fs')
    writeFileSync(join(root, 'a.tmc'), 'same')
    writeFileSync(join(root, 'b.tmc'), 'same')

    expect(pickUnique([join(root, 'a.tmc'), join(root, 'b.tmc')], 'TcIoXts.tmc')).toBe(join(root, 'a.tmc'))
  })

  /** Picking one silently would put unexplained content into the repository. */
  it('refuses to choose between two different files', async () => {
    const { writeFileSync } = await import('node:fs')
    writeFileSync(join(root, 'a.tmc'), 'one')
    writeFileSync(join(root, 'b.tmc'), 'two')

    expect(() => pickUnique([join(root, 'a.tmc'), join(root, 'b.tmc')], 'TcIoXts.tmc')).toThrow(
      /2 different versions of TcIoXts.tmc/
    )
  })
})

describe('the stored 4.4.22.0 version', () => {
  const repoRoot = resolve(process.cwd())

  it('stores both files as readable TwinCAT module classes', () => {
    for (const fileName of ['TcIoXts.tmc', 'TcSoftDrive.tmc']) {
      expect(readTmc(repoRoot, '4.4.22.0', fileName)).toContain('<TcModuleClass')
    }
  })

  /**
   * The recorded hash is of the vendor's uncompressed bytes, byte order mark included,
   * so it remains a provenance record no matter how the file is stored.
   */
  it('records hashes that match the stored bytes', () => {
    const entry = readManifest(repoRoot).versions.find((version) => version.package === '4.4.22.0')

    for (const fileName of ['TcIoXts.tmc', 'TcSoftDrive.tmc']) {
      const stored = Buffer.from(readTmc(repoRoot, '4.4.22.0', fileName), 'utf8')
      expect(sha256(stored), fileName).toBe(entry.sha256[fileName])
    }
  })

  it('records the driver version the files actually declare', () => {
    const entry = readManifest(repoRoot).versions.find((version) => version.package === '4.4.22.0')

    expect(entry.tcIoXts).toBe(parseLibrary(readTmc(repoRoot, '4.4.22.0', 'TcIoXts.tmc')).version)
    expect(entry.tcSoftDrive).toBe(parseLibrary(readTmc(repoRoot, '4.4.22.0', 'TcSoftDrive.tmc')).version)
  })
})
