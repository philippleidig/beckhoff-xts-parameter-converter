import { locateSoftDrive, parseXmlDocument } from './locate'
import { locateMoverController } from './moverControllerLocate'

/**
 * Which generation of parameters a file carries:
 *
 * - `softDrive`       — the old, current-based SoftDrive parameters, exported either as
 *                       a `<ParameterExport>` XML or a Mover Axis `.xti`.
 * - `moverController` — the new, force-based MoverController parameters (`.xti`).
 */
export type ParameterSetKind = 'softDrive' | 'moverController'

/**
 * Detects which generation a file holds, or null when it is neither.
 *
 * Both generations are stored inside a `<TcSmItem>`, so the root element cannot tell
 * them apart — only the module GUIDs can. The SoftDrive is tried first because its
 * lookup also covers the `<ParameterExport>` format.
 */
export function detectParameterSetKind(xmlString: string): ParameterSetKind | null {
  const parsed = parseXmlDocument(xmlString)
  if ('error' in parsed) return null

  if (locateSoftDrive(parsed.doc)) return 'softDrive'
  if (locateMoverController(parsed.doc)) return 'moverController'
  return null
}
