import { SD_ICONS, MC_ICONS } from '@/lib/icons/imageData'

export interface ModuleDescriptor {
  key: string
  label: string
  iconHex: string
}

/**
 * The SoftDrive modules in the order TwinCAT shows them. `softDrive` holds the
 * parameters stored on the object itself; it has no icon of its own, so it borrows
 * the General icon of its MoverController counterpart.
 */
export const SD_MODULES: ModuleDescriptor[] = [
  { key: 'softDrive', label: 'SoftDrive', iconHex: MC_ICONS.general },
  { key: 'interpolator', label: 'Interpolator', iconHex: SD_ICONS.interpolator },
  { key: 'encoder', label: 'Encoder', iconHex: SD_ICONS.encoder },
  { key: 'positionControl', label: 'Position Control', iconHex: SD_ICONS.positionControl },
  { key: 'velocityControl', label: 'Velocity Control', iconHex: SD_ICONS.velocityControl },
  { key: 'filter', label: 'Filter', iconHex: SD_ICONS.filter },
  { key: 'feedForward', label: 'Feed Forward', iconHex: SD_ICONS.feedForward },
]

/** The MoverController modules, in the order they appear in a parameter set. */
export const MC_MODULES: ModuleDescriptor[] = [
  { key: 'general', label: 'General', iconHex: MC_ICONS.general },
  { key: 'encoder', label: 'Encoder', iconHex: MC_ICONS.encoder },
  { key: 'positionControl', label: 'Position Control', iconHex: MC_ICONS.positionControl },
  { key: 'velocityControl', label: 'Velocity Control', iconHex: MC_ICONS.velocityControl },
  { key: 'filter', label: 'Filter', iconHex: MC_ICONS.filter },
  { key: 'feedForward', label: 'Feed Forward', iconHex: MC_ICONS.feedForward },
]
