/**
 * Identifiers of the MoverController modules inside a `.xti` written by TwinCAT.
 *
 * A MoverController parameter set is a `<TcSmItem ClassName="CTComObjDef">` whose
 * `<Module>` elements are identified by the `GUID` attribute of their `<TmcDesc>` —
 * the same structure a Mover Axis XTI uses for the SoftDrive, only with a different
 * set of GUIDs. They are taken from the shipped export template
 * (`src/lib/xti/template.xti`), which is a verbatim TwinCAT export.
 */
export const MOVER_CONTROLLER_TYPE_IDS = ['b055b40d-dec1-4d72-961c-d151e31a9ba5'] as const

export const MC_MODULE_TYPE_IDS = {
  general: '98bec76d-d436-4208-9f8b-486be57865bd',
  encoder: '2a657c12-787c-40c0-8e6c-d68fb6d58760',
  positionControl: '57584e44-d085-4d23-86e4-3be2859f4ec5',
  velocityControl: 'e9d8b517-6857-41d8-a4a3-60c89603d74a',
  filter: 'faeb97d8-ed6e-4986-8449-630c65d48156',
  feedForward: '7e8b155e-1e66-48e1-9d28-0607fa48fc11',
} as const

export type McModuleKey = keyof typeof MC_MODULE_TYPE_IDS
