import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { collect } from './import-tmc.mjs'

/** A minimal but structurally real TMC, byte order mark and CRLF included. */
const BOM = '\ufeff'

const tmc = (library, version, marker = '') =>
  `${BOM}<?xml version="1.0" encoding="utf-8"?>\r\n` +
  `<TcModuleClass>\r\n  <Library>\r\n    <Name>${library}</Name>\r\n` +
  `    <Version>${version}</Version>\r\n  </Library>\r\n  <!--${marker}-->\r\n</TcModuleClass>\r\n`

describe('collect', () => {
  let root

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'import-test-'))
  })
  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  const write = (relativePath, contents) => {
    const path = join(root, relativePath)
    mkdirSync(join(path, '..'), { recursive: true })
    writeFileSync(path, contents)
    return path
  }

  /**
   * The version comes from the file, not the path. Vendor archives are zipped on
   * Windows and extract into names that no directory-based scheme survives — the
   * 10-version TcIoXts archive arrives as single files with literal backslashes.
   */
  it('takes the version from the Library element rather than the path', () => {
    write('whatever/some-name.tmc', tmc('TcIoXts', '4.3.55.0'))

    const { byVersion } = collect(root)

    expect([...byVersion.keys()]).toEqual(['4.3.55.0'])
    expect(Object.keys(byVersion.get('4.3.55.0').files)).toEqual(['TcIoXts.tmc'])
  })

  it('groups the two libraries of one release together', () => {
    write('a/TcIoXts.tmc', tmc('TcIoXts', '4.4.22.0'))
    write('b/TcSoftDrive.tmc', tmc('TcSoftDrive', '4.4.22.0'))

    const { byVersion } = collect(root)

    expect(Object.keys(byVersion.get('4.4.22.0').files).sort()).toEqual(['TcIoXts.tmc', 'TcSoftDrive.tmc'])
  })

  it('accepts the same file appearing at several paths', () => {
    write('x/TcIoXts.tmc', tmc('TcIoXts', '4.4.22.0'))
    write('y/TcIoXts.tmc', tmc('TcIoXts', '4.4.22.0'))

    expect(() => collect(root)).not.toThrow()
  })

  /** Letting import order decide would put unexplained content into the repository. */
  it('refuses two different files claiming the same version', () => {
    write('x/TcIoXts.tmc', tmc('TcIoXts', '4.4.22.0', 'one'))
    write('y/TcIoXts.tmc', tmc('TcIoXts', '4.4.22.0', 'two'))

    expect(() => collect(root)).toThrow(/Two different TcIoXts.tmc files both declare version 4.4.22.0/)
  })

  it('reports a TMC for a library this project does not read', () => {
    write('TcIoCoupler.tmc', tmc('TcIoCoupler', '3.1.0.0'))

    const { byVersion, skipped } = collect(root)

    expect(byVersion.size).toBe(0)
    expect(skipped).toEqual([expect.stringContaining("describes 'TcIoCoupler'")])
  })

  it('reports a file it cannot read instead of failing the whole import', () => {
    write('broken.tmc', '<TcModuleClass></TcModuleClass>')
    write('good.tmc', tmc('TcIoXts', '4.2.44.0'))

    const { byVersion, skipped } = collect(root)

    expect([...byVersion.keys()]).toEqual(['4.2.44.0'])
    expect(skipped).toEqual([expect.stringContaining('no <Library> element')])
  })

  it('ignores everything that is not a TMC', () => {
    write('deploy/TcIoXts.bootdata', 'binary')
    write('TwinCAT RT (x64)/TcIoXts.tmx', 'binary')
    write('TcIoXts.tmc', tmc('TcIoXts', '4.4.38.0'))

    const { byVersion } = collect(root)

    expect([...byVersion.keys()]).toEqual(['4.4.38.0'])
  })
})
