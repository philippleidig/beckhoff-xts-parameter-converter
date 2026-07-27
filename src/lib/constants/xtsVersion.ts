/**
 * Version of the TcIoXts driver the generated parameter set is built against.
 *
 * The bundled `TcIoXts.tmc` declares this in its `<Library>` element, and the XTI
 * template carries it in every `ClassFactoryId="Beckhoff Automation GmbH|TcIoXts|…"`
 * attribute. Keeping it here means the template's occurrences are rewritten from a
 * single source instead of drifting apart.
 *
 * It cannot be derived from the imported file: a SoftDrive export describes the
 * system being migrated away from (`TcSoftDrive`, a different product), and the
 * `ParameterExport` XML carries no version at all. There is likewise no way to look
 * up the newest release at runtime, so users whose TwinCAT installation ships a
 * different TcIoXts version can override it in the export step.
 */
export const XTS_DRIVER_VERSION = '4.4.22.0'

/** TwinCAT XAE version recorded in the template's root element, for display only. */
export const TWINCAT_VERSION = '3.1.4026.20'
