# Beckhoff XTS Parameter Converter

A web-based tool for converting Beckhoff XTS SoftDrive parameters to MoverController parameters. This tool simplifies the migration process when upgrading from SoftDrive-based to MoverController-based XTS configurations.


## Disclaimer

This project is an independent, community-driven tool. It is **not affiliated with, endorsed by, supported by, or maintained by Beckhoff Automation GmbH & Co. KG** in any way. This is **not a Beckhoff product** and Beckhoff bears no responsibility for its content, functionality, or maintenance. "Beckhoff", "XTS", "TwinCAT", and related names are trademarks of Beckhoff Automation. All converted parameter values should be thoroughly reviewed and validated before being used in any production environment. The authors assume no liability for any damages or losses resulting from the use of this tool. Use at your own risk.

## Usage

The tool guides you through four steps. Each step that involves TwinCAT has a **?** button
that opens a short illustrated walkthrough.

1. **Import** — load the SoftDrive parameters from one of three sources:
   - **Parameter Set (`.xml`)** exported from the XTS Configurator via *Export Parameter Set…*
   - **Mover Axis (`.xti`)** saved from the TwinCAT Solution Explorer via *Save Mover Axis As…*
   - **Defaults**, to start from typical SoftDrive values
2. **Magnet Plate Set** — pick the magnet plate. Its force factor converts the current-based
   SoftDrive gains into the force-based MoverController gains. When the source file's motor
   force constant (`SoftDriveMotorPara.TorqueConstant`) matches a known plate exactly, that
   plate is preselected and marked *detected from source* — confirm it or pick another one.
3. **Convert** — see a summary of the result. *Show details* opens a side-by-side view of the
   source and converted parameters, where the SoftDrive values can still be edited.
4. **Export** — download the generated `.xti` and import it in TwinCAT under
   *SYSTEM → TcCOM Objects → Add Existing Item…*

### Driver version of the generated file

The exported `.xti` references a TcIoXts driver version, which appears in every
`ClassFactoryId` attribute. It defaults to the version declared by the bundled
`TcIoXts.tmc` and is shown in the export step.

It cannot be taken from the imported file and cannot be resolved to "the latest release":
a SoftDrive export describes the system being migrated *away from* (`TcSoftDrive`, a
different product with its own version), and the `ParameterExport` XML carries no version
at all. If your TwinCAT installation ships a different TcIoXts version, set it in the
export step — all occurrences are rewritten.

### Validation

Imported files are checked before anything is converted. The import is rejected — rather
than silently producing plausible-looking values — when a parameter cannot be read as a
number. `1,5` is not accepted as 1.5 and would otherwise be truncated to 1, `12 mm` is not
accepted as 12, and out-of-range values such as `1e999` are not accepted at all. The error
names the module and parameter concerned.

### What is not transferred

Some SoftDrive parameters have no MoverController equivalent and are therefore dropped:
`Kp_ffv`, `KpVeloFFT`, `OpenLoopMoveCurrent`, `PhaseAdvanceSpeed`, `CommutationFilter`,
`AreaCurrentLimit`, `SimulationOffset`, `HardwareModulo` and `MaxCurrentOutput`.

`MaxCurrentOutput` deserves a note: it is an amplifier *current* limit, not a control
*force* limit, so it is not mapped onto `ForceLimit`. Doing so would enable a force limit
that was previously off and change the behaviour of the drive. The MoverController force
limits stay disabled and must be configured deliberately if they are wanted.

### Control areas

The SoftDrive applies a separate set of `_area` parameters while a mover is inside an enabled
control area. The MoverController has no equivalent concept — instead a second parameter set is
assigned to those position ranges. Because SoftDrive holds exactly one `_area` variant per
parameter, a source configuration maps to **at most two** MoverController parameter sets.

When the source uses area-dependent control — an `*_AREA` loop type, a filter restricted to
`INSIDE_AREA`/`OUTSIDE_AREA`, or an enabled control area — the export step offers a second
**area parameter set** derived from the `_area` values, and lists the position ranges to assign
it to.

## Development

This project is built with React, TypeScript, and Vite.

### Prerequisites

- Node.js (v18 or later)
- npm

### Setup

```bash
npm install
```

### Run Locally

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Tests

```bash
npm test
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.md) file for details.
