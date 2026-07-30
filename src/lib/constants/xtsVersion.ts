import { DEFAULT_TMC_VERSION } from '@/lib/tmc/registry'

/**
 * Version of the TcIoXts driver a generated parameter set is built against by default.
 *
 * This is the newest driver version in `src/data/tmc`, which the daily feed sync keeps
 * up to date. It is no longer a transcribed constant: the whole parameter set — the
 * template, the parameter metadata and this number — is generated from that version's
 * `TcIoXts.tmc`.
 *
 * It still cannot be derived from an imported file. A SoftDrive export describes the
 * system being migrated away from (`TcSoftDrive`, a different product with its own
 * version), and the `ParameterExport` XML carries no version at all — which is why the
 * export step lets it be chosen rather than inferring it.
 */
export const XTS_DRIVER_VERSION = DEFAULT_TMC_VERSION
