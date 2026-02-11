export interface MoverType {
  id: string
  name: string
  forceFactor: number
}

export const MOVER_TYPES: Record<string, MoverType> = {
  AT9001_0450: { id: 'AT9001_0450', name: 'AT9001-0450', forceFactor: 5.4 },
  AT9001_0550: { id: 'AT9001_0550', name: 'AT9001-0550', forceFactor: 7.7 },
  AT9001_0775: { id: 'AT9001_0775', name: 'AT9001-0775', forceFactor: 10 },
  AT9001_0AA0: { id: 'AT9001_0AA0', name: 'AT9001-0AA0', forceFactor: 16 },
  ATH9001_0550: { id: 'ATH9001_0550', name: 'ATH9001-0550', forceFactor: 7 },
}

export const CONVERSION_CONSTANT = 314

export const SOFTDRIVE_TYPE_IDS = ['SoftDrive', '272a98c0-4c87-4243-bed6-3bb69e29f02c'] as const

export const MODULE_TYPE_IDS = {
  interpolator: '13ed0df8-3244-45e9-b3ba-89c339e4dff3',
  encoder: '8d695a14-7db9-4d35-a64a-30d334b5e2d3',
  positionControl: '1a7898ef-f86a-4b73-8df4-2e8199b711ba',
  velocityControl: 'cce414ce-cccb-4126-b90c-5d2688af5025',
  filter: '3b51fb30-ac26-40e9-afb9-e5aded4491ac',
  feedForward: '68aa515c-6ba6-4d3e-86a0-1a3eb553cf37',
} as const
