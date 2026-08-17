import configuratorAddMoverImg from '@/assets/tutorial/configurator-add-mover.png'
import deleteAllMoverImg from '@/assets/tutorial/delete-all-mover.png'
import deleteAllMoverAfterImg from '@/assets/tutorial/delete-all-mover-after.png'
import encoderDirectionPositionBiasImg from '@/assets/tutorial/encoder-direction-positionbias-old.png'
import exportNcAxisParameterImg from '@/assets/tutorial/export-nc-mover-axis-parameter.png'
import importNcParameterSetImg from '@/assets/tutorial/import-nc-parameter-set.png'
import moverControllerImg from '@/assets/tutorial/mover-controller.png'
import preselectedParameterSetImg from '@/assets/tutorial/preselected-parameter-set.png'
import trackPolarityOffsetImg from '@/assets/tutorial/track-polarity-offset.png'
import exportSoftDriveSetImg from '@/assets/help/ExportMoverWithSoftdriveParameterSet.png'
import saveMoverAxisXtiImg from '@/assets/help/SaveMoverSoftdrive.png'
import importParameterSetImg from '@/assets/help/ImportParameterSet.png'

/**
 * `info` explains, `tip` saves work, `warning` prevents damage or rework. Only the
 * things that carry a real risk are warnings, so the red boxes keep their weight.
 */
export type TutorialNoteKind = 'info' | 'tip' | 'warning'

export interface TutorialNote {
  kind: TutorialNoteKind
  title: string
  text: string
}

export interface TutorialFigure {
  src: string
  alt: string
  caption: string
}

export interface TutorialLink {
  label: string
  href: string
}

export interface TutorialStep {
  id: string
  /** Position in the walkthrough. The overview is not a step and has no number. */
  number?: number
  title: string
  /** Optional steps can be skipped without leaving the migration incomplete. */
  optional?: boolean
  summary: string
  instructions: string[]
  figures: TutorialFigure[]
  notes: TutorialNote[]
  /** Renders a call to action; a `#/…` href opens the app in a new browser tab. */
  action?: { label: string; href: string }
  links: TutorialLink[]
}

export interface TutorialGroup {
  id: string
  title: string
  steps: TutorialStep[]
}

const INFOSYS = 'https://infosys.beckhoff.com/content/1033'

/**
 * Every technical claim in the walkthrough that Beckhoff documents points at the page it
 * came from. Where no page exists — the PLC interface changes and the XML parameter
 * export — the step says so instead of implying vendor guidance.
 */
const LINKS = {
  releaseNotes: {
    label: 'Feature Release Notes TF5850',
    href: 'https://www.beckhoff.com/en-en/products/automation/twincat/texxxx-twincat-3-engineering/feature-release-notes-tf5850-twincat-3-xts/',
  },
  checkVersion: {
    label: 'Check version (TF5850)',
    href: `${INFOSYS}/xts_software/13612464651.html`,
  },
  oldSystemConversion: {
    label: 'Conversion of old XTS system',
    href: `${INFOSYS}/xts_software/12800789515.html`,
  },
  checkNcAxes: {
    label: 'Check of NC axes and SoftDrive parameters',
    href: `${INFOSYS}/xts_software/12802659723.html`,
  },
  encoderParameters: {
    label: 'NC PTP — Encoder parameters',
    href: `${INFOSYS}/tf50x0_tc3_nc_ptp/10650576779.html`,
  },
  encoderEvaluation: {
    label: 'NC PTP — Encoder Evaluation',
    href: `${INFOSYS}/tf50x0_tc3_nc_ptp/3439907723.html`,
  },
  outputSettings: {
    label: 'NC PTP — Output Settings',
    href: `${INFOSYS}/tf50x0_tc3_nc_ptp/3443846923.html`,
  },
  parameterSets: {
    label: 'XTS Configurator — Parameter Sets',
    href: `${INFOSYS}/xts_software/12353809035.html`,
  },
  selectingParameterSet: {
    label: 'Selecting a Parameter Set',
    href: `${INFOSYS}/xts_software/12353810571.html`,
  },
  movers: {
    label: 'XTS Movers (SoftDrive)',
    href: `${INFOSYS}/xts_software/10518323211.html`,
  },
  removeMover: {
    label: 'Remove Mover',
    href: `${INFOSYS}/xts_software/12353803915.html`,
  },
  moverProperties: {
    label: 'Mover properties',
    href: `${INFOSYS}/xts_software/12353806987.html`,
  },
  addingMovers: {
    label: 'Adding movers',
    href: `${INFOSYS}/xts_software/12353493131.html`,
  },
  creatingNewMovers: {
    label: 'Creating new movers',
    href: `${INFOSYS}/xts_software/12353802891.html`,
  },
  xtsUtility: {
    label: 'Tc3 XTS Utility (PLC library)',
    href: `${INFOSYS}/xts_software/10350715275.html`,
  },
  controlArea: {
    label: 'Control Area — Parameter (Init)',
    href: `${INFOSYS}/xts_software/11290032139.html`,
  },
  track: {
    label: 'Track — Parameter (Init)',
    href: `${INFOSYS}/xts_software/11290028683.html`,
  },
  completingConfiguration: {
    label: 'Completing the configuration',
    href: `${INFOSYS}/xts_software/12355374859.html`,
  },
  checkingConfiguration: {
    label: 'Checking the configuration',
    href: `${INFOSYS}/xts_software/12356770315.html`,
  },
  controlLoop: {
    label: 'XTS Soft Drive — Control loop',
    href: `${INFOSYS}/xts_soft_drive/3482987659.html`,
  },
  softDriveParameters: {
    label: 'XTS Soft Drive — Parameters',
    href: `${INFOSYS}/xts_soft_drive/3483092747.html`,
  },
} satisfies Record<string, TutorialLink>

export const TUTORIAL_GROUPS: TutorialGroup[] = [
  {
    id: 'start',
    title: 'Before you start',
    steps: [
      {
        id: 'overview',
        title: 'Overview and prerequisites',
        summary:
          'This walkthrough migrates a running XTS machine from the SoftDrive to the Mover Controller: export the old parameters, convert them, let the XTS Configurator rebuild the movers, then put the parameters back.',
        instructions: [
          'Make a copy of your TwinCAT project.',
          'Check the installed version under **Control Panel** → **Programs and Features** → **Beckhoff TF5850 TC3 XTS Technology**.',
          'Make sure the machine can be put into a safe state — the movers will move again at the end of the migration.',
          'Work through the steps on the left in order. Optional steps are marked as such.',
        ],
        figures: [],
        notes: [
          {
            kind: 'warning',
            title: 'Back up the project first',
            text: 'Beckhoff states this for rebuilding an XTS project: "To be safe, make a copy of your project before starting the conversion. It cannot be guaranteed that the following steps can be applied one hundred percent to every project."',
          },
          {
            kind: 'info',
            title: 'What actually changes',
            text: 'With the SoftDrive every mover axis owned a `SoftDrive` object carrying its own parameter set. With the Mover Controller the parameter set is a central TcCOM object that all movers reference — and additional sets can be activated for a section of the track, typically a curve.',
          },
          {
            kind: 'warning',
            title: 'Check your TF5850 version',
            text: 'The Mover Controller and the XTS Parameter Set arrived with TF5850 **4.0.x**. Version **4.4.x** fixed the configurator assigning the wrong Default Parameter Set OID, so on older versions verify the assignment in step 7 before you activate.',
          },
          {
            kind: 'info',
            title: 'This is not vendor documentation',
            text: 'Beckhoff publishes no migration guide from the SoftDrive to the Mover Controller. The sequence below comes from engineering practice; everything that is documented links to the matching InfoSys page. Do not confuse it with **Conversion of old XTS system**, which describes the move from the old XTS Manager to the TF5850 TcCOM structure.',
          },
        ],
        links: [LINKS.releaseNotes, LINKS.checkVersion, LINKS.oldSystemConversion],
      },
    ],
  },

  {
    id: 'prepare',
    title: 'Prepare in TwinCAT',
    steps: [
      {
        id: 'export-nc-parameters',
        number: 1,
        optional: true,
        title: 'Export the NC axis parameters',
        summary:
          'Saves the NC settings of a mover axis — following error window, dynamic limits, modulo factor — so they can be restored on the axes the configurator creates later.',
        instructions: [
          'In the Solution Explorer open **MOTION** → **NC-Task 1 SAF** → **Axes**.',
          'Right-click the mover axis whose settings you want to keep, for example `Mover Axis 1`.',
          'Choose **Export XML Parameter…**',
          'Save the `.xml` file next to your project — step 9 reads it back.',
        ],
        figures: [
          {
            src: exportNcAxisParameterImg,
            alt: 'Solution Explorer context menu on Mover Axis 1 with Export XML Parameter… highlighted',
            caption: 'Context menu on `Mover Axis 1` with **Export XML Parameter…** selected.',
          },
        ],
        notes: [
          {
            kind: 'info',
            title: 'This step is optional',
            text: 'Skip it and the mover axes created in step 6 start from the TwinCAT default NC parameters — a valid starting point if the machine was never tuned at the NC level.',
          },
          {
            kind: 'tip',
            title: 'One file is usually enough',
            text: 'If all mover axes share the same NC settings, exporting a single axis suffices — step 9 applies that one file to every axis at once. Export individually only where axes genuinely differ.',
          },
          {
            kind: 'warning',
            title: 'Not covered by the Beckhoff documentation',
            text: '**Export XML Parameter…** and **Import XML Parameter…** are TwinCAT context menu entries without an InfoSys chapter, so their exact scope is not specified. The documented Beckhoff route is to take the parameters over manually or import them as a parameter set in the XTS Configurator. Either way, verify the values after the import in step 9.',
          },
        ],
        links: [LINKS.checkNcAxes, LINKS.encoderParameters],
      },

      {
        id: 'export-softdrive-set',
        number: 2,
        title: 'Export the SoftDrive parameter set',
        summary:
          'The SoftDrive gains are the source of the conversion. Export them from one mover — either as a parameter set from the XTS Configurator, or as the complete mover axis from the Solution Explorer.',
        instructions: [
          '**Option A — XTS Configurator:** open the **Movers** page and click the parameter set icon in the **Source Set** column of the mover you want to migrate.',
          'In **Export Parameter Set…** pick the set under **Choose Parameter Set** and click **Export As..**',
          '**Option B — Solution Explorer:** right-click the mover axis and choose **Save Mover Axis 1 As…** — not *Save Mover Axis 1.xti*, which overwrites the existing path without asking.',
          'Keep the resulting `.xml` or `.xti` file. Step 3 accepts both.',
        ],
        figures: [
          {
            src: exportSoftDriveSetImg,
            alt: 'XTS Configurator Movers page with the Export Parameter Set dialog open',
            caption:
              'Option A: the **Export Parameter Set…** dialog on the **Movers** page of the XTS Configurator.',
          },
          {
            src: saveMoverAxisXtiImg,
            alt: 'Solution Explorer context menu on Mover Axis 1 with Save Mover Axis 1 As… highlighted',
            caption:
              'Option B: **Save Mover Axis 1 As…** writes the axis including its `SoftDrive` object to an `.xti` file.',
          },
        ],
        notes: [
          {
            kind: 'info',
            title: 'From one set per mover to one set for all',
            text: 'Every SoftDrive carried its own parameter set, so export from a mover that represents your machine. The Mover Controller keeps the set centrally: all movers reference the same object, and a change there applies to all of them.',
          },
          {
            kind: 'tip',
            title: 'Sections that need different gains',
            text: 'You still export a single source set here. Track sections that behave differently — a curve, for example — get their own set assigned later, in step 7.',
          },
        ],
        links: [LINKS.parameterSets, LINKS.movers],
      },
    ],
  },

  {
    id: 'convert',
    title: 'Convert',
    steps: [
      {
        id: 'convert-set',
        number: 3,
        title: 'Convert to a MoverController parameter set',
        summary:
          'Load the exported file into the Convert tool. It rescales the current-based SoftDrive gains into the force-based MoverController gains and writes an `.xti` that TwinCAT can import.',
        instructions: [
          'Open **Convert** — the button below opens it in a new browser tab, so you keep your place here.',
          'In **Import**, load the `.xml` or `.xti` file from step 2.',
          "In **Magnet Plate Set**, pick the magnet plate. Its force factor is what converts the gains. If the source file's motor force constant matches a known plate, that plate is preselected and marked *detected from source*.",
          'Review the result under **Convert** — *Show details* puts source and converted values side by side.',
          'In **Export**, download the generated `.xti`. Step 5 imports it.',
        ],
        action: { label: 'Open Convert in a new tab', href: '#/convert' },
        figures: [],
        notes: [
          {
            kind: 'tip',
            title: 'Pick the matching driver version',
            text: 'The version selector in the header decides which TcIoXts version the generated file is built for. Choose the version your TwinCAT installation ships — it cannot be derived from the imported file, because a SoftDrive export describes the system you are migrating away from.',
          },
          {
            kind: 'warning',
            title: 'A conversion is not a tuning',
            text: 'The tool rescales values; it does not know your machine. Review every converted parameter and validate the behaviour on the real system before running production.',
          },
        ],
        links: [LINKS.controlLoop, LINKS.softDriveParameters],
      },
    ],
  },

  {
    id: 'rebuild',
    title: 'Rebuild the movers',
    steps: [
      {
        id: 'delete-movers',
        number: 4,
        title: 'Delete the mover and axis objects',
        summary:
          'The movers must be recreated by the XTS Configurator so they get a Mover Controller instead of a SoftDrive. That starts by removing the existing mover objects and their NC axes.',
        instructions: [
          'Under **SYSTEM** → **TcCOM Objects** → **XTS ProcessingUnit 1**, select `Mover 1` … `Mover n` and delete them.',
          'Under **MOTION** → **NC-Task 1 SAF** → **Axes**, select `Mover Axis 1` … `Mover Axis n` and delete them as well.',
          'Verify the result: `Part 1` and `Track 1` are still there and **Axes** is empty.',
        ],
        figures: [
          {
            src: deleteAllMoverImg,
            alt: 'Solution Explorer with the Mover objects and the Mover Axis objects selected',
            caption: 'Select only the `Mover n` objects and the `Mover Axis n` axes.',
          },
          {
            src: deleteAllMoverAfterImg,
            alt: 'Solution Explorer after deleting, showing Part 1 and Track 1 and an empty Axes node',
            caption:
              'Afterwards `Part 1` and `Track 1` remain under the processing unit, and **Axes** is empty.',
          },
        ],
        notes: [
          {
            kind: 'warning',
            title: 'Delete only the movers and their axes',
            text: 'The `XTS ProcessingUnit`, `Part`, `Track`, the control areas and everything else you configured must stay. Removing them means rebuilding the entire XTS system instead of just the movers.',
          },
          {
            kind: 'warning',
            title: 'The naming order can change',
            text: 'Beckhoff notes that adding or removing movers may change the naming order of the mover, NC axis and controller objects. Recheck every name-based reference in PLC, HMI and recipes once the movers are back.',
          },
          {
            kind: 'tip',
            title: 'Alternative inside the configurator',
            text: "Movers can also be removed on the configurator's **Movers** page with the **x** button, or by disabling **Keep existing Movers on Apply** and applying a lower **Number of Movers** — that deletes from the end of the mover list downwards.",
          },
        ],
        links: [LINKS.removeMover, LINKS.moverProperties],
      },

      {
        id: 'import-parameter-set',
        number: 5,
        title: 'Import the converted parameter set',
        summary:
          'Add the `.xti` from step 3 as a TcCOM object before the configurator runs — then it is preselected on every mover the configurator creates.',
        instructions: [
          'In the Solution Explorer open **SYSTEM** and right-click **TcCOM Objects**.',
          'Choose **Add Existing Item…** (`Shift+Alt+A`).',
          'Select the `.xti` you exported in step 3.',
          'The set appears as `XTS ParameterSet` with its modules `Filter`, `General`, `Encoder`, `Velocity Controller`, `Position Controller` and `Feed Forward`.',
        ],
        figures: [
          {
            src: importParameterSetImg,
            alt: 'Solution Explorer context menu on TcCOM Objects with Add Existing Item… highlighted',
            caption: '**Add Existing Item…** on **TcCOM Objects** adds the generated `.xti`.',
          },
          {
            src: preselectedParameterSetImg,
            alt: 'Solution Explorer showing the imported XTS ParameterSet and the Default Parameter Set field filled in',
            caption:
              'Imported beforehand, the `XTS ParameterSet` is already selected as **Default Parameter Set** on the new movers.',
          },
        ],
        notes: [
          {
            kind: 'tip',
            title: 'Do this before starting the configurator',
            text: 'That is the whole point of the ordering: if the parameter set already exists, the configurator preselects it as **Default Parameter Set** on every mover it creates, and you do not have to assign it by hand afterwards.',
          },
          {
            kind: 'info',
            title: 'Area parameter sets',
            text: 'If the conversion also produced an area parameter set, import that file too. It is assigned to the control areas in step 7.',
          },
        ],
        links: [LINKS.parameterSets],
      },

      {
        id: 'recreate-movers',
        number: 6,
        title: 'Recreate the movers with a Mover Controller',
        summary:
          'Start the XTS Configurator again and create the movers — this time answering the controller question with the new Mover Controller.',
        instructions: [
          'Open the **XTS Tool Window** in TwinCAT and start the **XTS Configurator** from there.',
          'Go to the **Movers** page.',
          'Enter the number of movers in the field next to the processing unit and click the add button.',
          'The **XTS Mover Controller** dialog opens. Choose **Use new XTS Controller**.',
          'Select the **Mover Type** and the **MagnetPlate Type** that match your hardware.',
        ],
        figures: [
          {
            src: configuratorAddMoverImg,
            alt: 'XTS Configurator Movers page with the New XTS Controller dialog and the Use new XTS Controller button highlighted',
            caption:
              'The **New XTS Controller** dialog — choose **Use new XTS Controller**, not **Use XTS SoftDrive**.',
          },
        ],
        notes: [
          {
            kind: 'warning',
            title: 'Do not tick Remember Answer yet',
            text: '**Use XTS SoftDrive** recreates exactly the configuration you are migrating away from. Once **Remember Answer** is ticked the dialog stops asking, and a wrong answer becomes silent.',
          },
          {
            kind: 'warning',
            title: 'PLC interfaces may need adapting',
            text: 'The dialog says so itself: "Note that PLC interfaces may need to be adapted for the new Controller." Beckhoff does not document what changes. Expect direct accesses to `SoftDrive` objects and their cyclic variables to break, because those objects no longer exist — the NC/MC2 axis interface itself stays.',
          },
          {
            kind: 'tip',
            title: 'No leftover axes',
            text: 'If NC axes with a SoftDrive object were still present and unlinked, the configurator would offer to reuse them. After step 4 there are none — which is what you want, because the axes should be created fresh.',
          },
        ],
        links: [LINKS.addingMovers, LINKS.creatingNewMovers, LINKS.xtsUtility],
      },

      {
        id: 'assign-parameter-sets',
        number: 7,
        title: 'Assign the parameter sets',
        summary:
          'Every mover needs a default parameter set. Track sections that behave differently — a curve, typically — get their own set through a control area.',
        instructions: [
          "In the configurator's **Mover List**, select a mover.",
          'Under **Mover Details** → **Controller Settings**, pick the set in the **Default Parameter Set** drop-down. After step 5 it is already preselected — confirm it.',
          'Repeat for every mover, so all of them reference the same central set.',
          'For a section that needs different gains, configure a **Control Area** on the part and assign the area parameter set to it.',
          "Set the area's `StartPosition` and `EndPosition` to that section — the curve, for instance — and give it a `BlendInLength` and a `BlendOutLength`.",
        ],
        figures: [
          {
            src: preselectedParameterSetImg,
            alt: 'Mover Details with the Default Parameter Set drop-down highlighted',
            caption:
              '**Mover Details** → **Controller Settings**: the **Default Parameter Set** drop-down assigns the central set to the selected mover.',
          },
        ],
        notes: [
          {
            kind: 'info',
            title: 'How an area hands over',
            text: '`BlendInLength` is the length from the start of the area until the new parameters are fully used. `BlendOutLength` is the length before the end of the area where the previously used set is started to be used again. That ramp is what keeps the transition into and out of a curve smooth instead of abrupt.',
          },
          {
            kind: 'warning',
            title: 'Parameter sets assume unloaded movers',
            text: 'Beckhoff: "The Parameter Sets are defined for movers without load. If you use the movers with a load, the Parameter Sets must be adjusted." For loaded applications, contact the product specialist responsible for your region.',
          },
          {
            kind: 'warning',
            title: 'Verify the assignment below TF5850 4.4.x',
            text: 'Version 4.4.x fixed the configurator assigning the wrong Default Parameter Set OID. On older versions, check on every single mover that the set you intended is really the one referenced.',
          },
        ],
        links: [LINKS.selectingParameterSet, LINKS.controlArea, LINKS.parameterSets],
      },

      {
        id: 'finish-configurator',
        number: 8,
        title: 'Finish the configurator and check the result',
        summary:
          'Complete the configurator so the changes are written to the project, verify the object tree, and restore the PLC links that step 4 removed.',
        instructions: [
          'Step through the remaining configurator pages and finish it — the changes are saved and the configurator closes.',
          'Check **SYSTEM** → **TcCOM Objects** → **XTS ProcessingUnit 1**: `Part 1`, `Track 1`, `Mover 1` … `Mover n` and the `XTS ParameterSet` are present.',
          'Check **MOTION** → **NC-Task 1 SAF** → **Axes**: every `Mover Axis n` now contains `Enc`, `Drive`, `Ctrl`, `Inputs`, `Outputs` and a `Mover Controller n` — and no `SoftDrive`.',
          'Restore the PLC links: double-click **Axes**, select the axes, right-click and choose **Change Axis PLC Links…**, then pick the PLC in **Select Axis PLC Reference** and confirm with **OK**.',
        ],
        figures: [
          {
            src: moverControllerImg,
            alt: 'Solution Explorer showing Mover objects and a Mover Axis containing a Mover Controller object',
            caption:
              'A successful run: each `Mover Axis` holds a `Mover Controller` instead of a `SoftDrive`.',
          },
        ],
        notes: [
          {
            kind: 'warning',
            title: 'Still a SoftDrive under the axis?',
            text: 'Then the configurator ran in SoftDrive mode. Delete the movers and axes again and repeat from step 4 — this time answering the dialog with **Use new XTS Controller**.',
          },
          {
            kind: 'tip',
            title: 'Check the modulo factor',
            text: 'After axes have been rebuilt, Beckhoff requires `Modulo Factor` under `Enc` → **Parameter** → *Encoder Evaluation* to match the length of the system. Check it before you activate the configuration.',
          },
        ],
        links: [LINKS.completingConfiguration, LINKS.checkingConfiguration, LINKS.checkNcAxes],
      },
    ],
  },

  {
    id: 'finetune',
    title: 'Restore and fine-tune',
    steps: [
      {
        id: 'import-nc-parameters',
        number: 9,
        optional: true,
        title: 'Import the NC axis parameters',
        summary:
          'Applies the NC settings exported in step 1 to the freshly created mover axes — for all of them in one go.',
        instructions: [
          'Under **MOTION** → **NC-Task 1 SAF** → **Axes**, select all mover axes (`Shift` or `Ctrl` for a multi-selection).',
          'Right-click the selection and choose **Import XML Parameter…**',
          'Select the `.xml` you exported in step 1.',
          'Check the imported values — in particular the following error window, the dynamic limits and `Modulo Factor`.',
        ],
        figures: [
          {
            src: importNcParameterSetImg,
            alt: 'All mover axes selected in the Solution Explorer with Import XML Parameter… highlighted in the context menu',
            caption:
              'With all mover axes selected, **Import XML Parameter…** applies the exported NC parameters to every one of them at once.',
          },
        ],
        notes: [
          {
            kind: 'info',
            title: 'Only if you exported in step 1',
            text: 'Without that export the axes simply keep the TwinCAT default NC parameters.',
          },
          {
            kind: 'warning',
            title: 'Do not take everything over blindly',
            text: 'Application values — following error monitoring, velocity, acceleration, jerk, modulo factor — transfer well. Hardware- and wiring-specific encoder and drive entries have to match the newly created objects, so verify them rather than assuming.',
          },
        ],
        links: [LINKS.encoderEvaluation, LINKS.checkNcAxes],
      },

      {
        id: 'track-polarity-offset',
        number: 10,
        title: 'Move direction and offset to the Track',
        summary:
          'With the SoftDrive, a reversed direction or a position offset had to be set on every single mover axis. With the Mover Controller, set it once on the `Track` object.',
        instructions: [
          'This only applies if the SoftDrive setup used `Invert Encoder Counting Direction` or `Position Bias` under `Enc`, or `Invert Motor Polarity` under `Drive`.',
          'Open **SYSTEM** → **TcCOM Objects** → **XTS ProcessingUnit 1** → `Track 1` and switch to the **Parameter (Init)** tab.',
          'Under **General**, set `Polarity` to the direction the track has in the global context.',
          'Set `Offset` to the zero point shift that `Position Bias` used to provide.',
          'Leave the per-axis encoder and drive settings at their defaults, so the track stays the single place where this is defined.',
        ],
        figures: [
          {
            src: encoderDirectionPositionBiasImg,
            alt: 'NC encoder parameters showing Invert Encoder Counting Direction and Position Bias, and NC drive parameters showing Invert Motor Polarity',
            caption:
              'Before: `Invert Encoder Counting Direction` and `Position Bias` under `Enc`, `Invert Motor Polarity` under `Drive` — on every mover axis.',
          },
          {
            src: trackPolarityOffsetImg,
            alt: 'Track 1 Parameter (Init) tab with the Polarity and Offset parameters highlighted',
            caption: 'After: `Polarity` and `Offset` set once on `Track 1` under **Parameter (Init)**.',
          },
        ],
        notes: [
          {
            kind: 'warning',
            title: 'Risk of unexpected movements',
            text: 'Beckhoff\'s warning on the NC encoder and drive pages: "If the counting direction of the encoder and the motor polarity do not match, the axis will perform unexpected movements." Change these values only on a secured system with the emergency stop within reach, then verify the direction by jogging a single mover carefully at low velocity.',
          },
          {
            kind: 'tip',
            title: 'Once instead of n times',
            text: 'Setting direction and offset on the track applies them to the whole track. You no longer repeat the setting on every mover axis — and can no longer forget one.',
          },
        ],
        links: [LINKS.track, LINKS.encoderEvaluation, LINKS.outputSettings],
      },
    ],
  },
]

/** Flat order of the walkthrough, used for previous/next navigation. */
export const TUTORIAL_STEPS: TutorialStep[] = TUTORIAL_GROUPS.flatMap((group) => group.steps)

export const FIRST_STEP_ID = TUTORIAL_STEPS[0].id

export function findStep(id: string): TutorialStep {
  return TUTORIAL_STEPS.find((step) => step.id === id) ?? TUTORIAL_STEPS[0]
}
