import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { readTmc } from './store.mjs'
import { parseTmc } from './tmc.mjs'
import { renderXtiTemplate } from './xti.mjs'

// Vitest resolves its root to the repository root.
const read = (relativePath) => readFileSync(resolve(process.cwd(), relativePath), 'utf8')

/** The version the repository was seeded with; the reference for every gate here. */
const SEEDED_VERSION = '4.4.22.0'

/** The vendor TMCs live in the version store, gzipped, rather than loose in the tree. */
const readVendorTmc = (fileName) => readTmc(resolve(process.cwd()), SEEDED_VERSION, fileName)

/**
 * The reference: a parameter set TwinCAT itself exported for TcIoXts 4.4.22.0. It was
 * the application's only template until the generator replaced it, and is kept as a
 * fixture because it is the one artifact here that no code of ours produced.
 */
const REFERENCE_TEMPLATE = 'scripts/lib/__fixtures__/template-4.4.22.0.xti'

/** The TwinCAT XAE build that wrote the reference export. It is not part of the TMC. */
const TWINCAT_VERSION = '3.1.4026.20'

describe('renderXtiTemplate', () => {
  const model = parseTmc(readVendorTmc('TcIoXts.tmc'))

  /**
   * The load-bearing test of the whole pipeline.
   *
   * `src/lib/xti/template.xti` was exported by TwinCAT itself. If the generator can
   * reproduce it character for character from the matching TMC, then the rewrite rules
   * it applies are complete and correct for that version — which is the only evidence
   * that a template generated for a *different* version can be trusted.
   *
   * When this fails after a TMC update, the fix is to work out which rule the new file
   * exposes, not to loosen the comparison.
   */
  it('reproduces the TwinCAT export for 4.4.22.0 byte for byte', () => {
    const generated = renderXtiTemplate(model, { twinCatVersion: TWINCAT_VERSION })

    expect(generated).toBe(read(REFERENCE_TEMPLATE))
  })

  it('carries the driver version from the TMC into every ClassFactoryId', () => {
    const generated = renderXtiTemplate(model, { twinCatVersion: TWINCAT_VERSION })
    const versions = new Set(
      [...generated.matchAll(/ClassFactoryId="[^"]*\|TcIoXts\|([\d.]+)"/g)].map((match) => match[1])
    )

    expect([...versions]).toEqual([model.library.version])
  })

  /**
   * `buildXtiXml()` splices the six sub-module blocks and refuses to export when it
   * finds a different number, so a generated template that broke this invariant would
   * take the export path down with it.
   */
  it('emits one ParameterValues block for the root module and one per sub-module', () => {
    const generated = renderXtiTemplate(model, { twinCatVersion: TWINCAT_VERSION })

    expect(generated.match(/<ParameterValues>/g)).toHaveLength(7)
  })
})
