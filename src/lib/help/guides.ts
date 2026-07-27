import exportParameterSetImg from '@/assets/help/ExportMoverWithSoftdriveParameterSet.png'
import saveMoverAxisXtiImg from '@/assets/help/SaveMoverSoftdrive.png'
import importParameterSetImg from '@/assets/help/ImportParameterSet.png'

export type HelpGuideId = 'exportParameterSet' | 'saveMoverAxisXti' | 'importParameterSet'

export interface HelpGuide {
  id: HelpGuideId
  title: string
  intro: string
  steps: string[]
  image: { src: string; alt: string }
  note?: string
}

export const HELP_GUIDES: Record<HelpGuideId, HelpGuide> = {
  exportParameterSet: {
    id: 'exportParameterSet',
    title: 'Exporting a Parameter Set from the XTS Configurator',
    intro:
      'This exports the SoftDrive parameters of a single mover as an XML file, which you can then load here.',
    steps: [
      'Open the XTS Configurator and switch to the Movers page.',
      'In the Mover List, click the parameter set icon in the Source Set column of the mover you want to migrate.',
      'The Export Parameter Set… dialog opens. Pick the parameter set to export under Choose Parameter Set.',
      'Click Export As.. and save the file.',
      'Load that file here using Import Parameter Set.',
    ],
    image: {
      src: exportParameterSetImg,
      alt: 'XTS Configurator Movers page with the Export Parameter Set dialog open',
    },
  },

  saveMoverAxisXti: {
    id: 'saveMoverAxisXti',
    title: 'Saving a Mover Axis as an XTI file',
    intro:
      'The Mover Axis contains the SoftDrive object with all its parameters. Saving the axis exports them as an XTI file.',
    steps: [
      'In the TwinCAT Solution Explorer, open MOTION → NC-Task 1 SAF → Axes.',
      'Right-click the mover axis you want to migrate, for example Mover Axis 1.',
      'Choose Save Mover Axis 1 As… — not Save Mover Axis 1.xti, which writes to the existing path without asking.',
      'Save the .xti file.',
      'Load that file here using Import Mover Axis XTI.',
    ],
    image: {
      src: saveMoverAxisXtiImg,
      alt: 'TwinCAT Solution Explorer context menu on Mover Axis 1 with Save Mover Axis 1 As… highlighted',
    },
  },

  importParameterSet: {
    id: 'importParameterSet',
    title: 'Importing the converted parameter set into TwinCAT',
    intro:
      'The generated XTI file is a MoverController parameter set. It is added as a TcCOM object and can then be assigned to movers in the XTS Configurator.',
    steps: [
      'In the TwinCAT Solution Explorer, open SYSTEM and right-click TcCOM Objects.',
      'Choose Add Existing Item… (Shift+Alt+A).',
      'Select the downloaded .xti file.',
      'In the XTS Configurator, assign the imported parameter set to the mover in the Parameter Set column.',
    ],
    image: {
      src: importParameterSetImg,
      alt: 'TwinCAT Solution Explorer context menu on TcCOM Objects with Add Existing Item… highlighted',
    },
    note:
      'If an area parameter set was exported as well, import both files and assign the area set to the position ranges of the Control Areas.',
  },
}
