# Beckhoff XTS Parameter Converter

A web-based tool for working with Beckhoff XTS mover parameter sets. It converts SoftDrive
parameters to MoverController parameters, compares parameter sets against each other or
against the TwinCAT defaults, and creates new MoverController parameter sets from scratch.


## Disclaimer

This project is an independent, community-driven tool. It is **not affiliated with, endorsed by, supported by, or maintained by Beckhoff Automation GmbH & Co. KG** in any way. This is **not a Beckhoff product** and Beckhoff bears no responsibility for its content, functionality, or maintenance. "Beckhoff", "XTS", "TwinCAT", and related names are trademarks of Beckhoff Automation. All converted parameter values should be thoroughly reviewed and validated before being used in any production environment. The authors assume no liability for any damages or losses resulting from the use of this tool. Use at your own risk.

## Usage

The start page offers three tools:

| Tool | What it does |
| --- | --- |
| **Compare** | Show the differences between two parameter sets of the same generation |
| **Convert** | Migrate a SoftDrive parameter set to a MoverController parameter set |
| **Create** | Build a new MoverController parameter set and export it |

The active tool is kept in the URL (`#/compare`, `#/convert`, `#/create`), so a view can be
bookmarked and the browser's Back button returns to the start page.

## Convert

The conversion guides you through four steps. Each step that involves TwinCAT has a **?** button
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

The exported `.xti` is generated from the driver metadata of a specific TcIoXts version —
its `TmcDesc` blocks, data types and `ClassFactoryId` attributes all come from that
version's `TcIoXts.tmc`. The version is chosen in the header and applies to the whole
app: the parameter names, units and enum values shown in Convert, Create and Compare
follow it too.

It defaults to the newest version in the store and cannot be taken from the imported
file: a SoftDrive export describes the system being migrated *away from* (`TcSoftDrive`,
a different product with its own version), and the `ParameterExport` XML carries no
version at all.

If your TwinCAT installation ships a TcIoXts version that is not in the list, the export
step lets you type it. That rewrites the version number only — the file is still built
from the selected version — so prefer picking a listed version where one matches.

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

## Compare

Compare puts two parameter sets side by side and lists every parameter that differs, grouped
by module, with the relative change for numeric values. Identical parameters are hidden until
*Show identical parameters* is ticked.

Each side takes a file — a SoftDrive `Parameter Set (.xml)`, a `Mover Axis (.xti)` or a
MoverController `.xti` — or the TwinCAT default values of either generation. The generation is
detected from the file's module GUIDs rather than its root element, since both generations are
stored in a `TcSmItem`.

Only sets of the same generation can be compared: **old with old, new with new**. Converting
between them renames and rescales parameters, so a SoftDrive value and a MoverController value
are not comparable quantities — a mismatched pair is rejected with a message rather than diffed.

## Create

Create starts from the MoverController values TwinCAT writes into a fresh parameter set. Every
parameter is editable, parameters that do not apply to the selected loop or filter type are
hidden, and the result is exported as an `.xti` under a file name of your choice. An existing
MoverController `.xti` can be loaded as the starting point instead of the defaults.

## Driver metadata

Nothing about the drivers is transcribed by hand. `tmc/` holds the vendor `.tmc` files of
every known driver release, gzipped — ten of them at present, from 4.2.44.0 to 4.4.38.0 —
and `scripts/generate-tmc-data.mjs` turns them into
the per-version artifacts under `src/data/tmc/` that the app bundles — the parameter
metadata, the module icons and the XTI template. Both are committed, so a driver update
arrives as a reviewable diff rather than as behaviour that changes on the next page load.

What the TMC cannot know — which parameters to show, in what order, under what name, and
which ones the conversion transforms — lives in `scripts/lib/overlay.mjs`. Its keys are
also the allowlist: a new driver version cannot surface an unreviewed parameter, and the
generator reports those as warnings. It fails on the dangerous direction instead, a
parameter or enum value the converter uses that the driver no longer has.

`.github/workflows/tmc-sync.yml` checks the Beckhoff feed weekly. It commits only after
the regenerated data passes lint, tests and build, and opens an issue when it cannot.
Two repository secrets are required, since the feed uses HTTP Basic authentication with
a myBeckhoff account:

| Secret | |
| --- | --- |
| `TCPKG_USERNAME` | myBeckhoff user name |
| `TCPKG_PASSWORD` | myBeckhoff password |

To run it by hand:

```bash
TCPKG_USERNAME=... TCPKG_PASSWORD=... npm run tmc:sync -- --dry-run   # list what would be fetched
TCPKG_USERNAME=... TCPKG_PASSWORD=... npm run tmc:sync -- --all       # fetch the whole history
npm run tmc:generate                                                  # regenerate src/data/tmc
```

TMCs that did not come from the feed — a release archive, or files copied out of a
TwinCAT installation — are imported without credentials:

```bash
npm run tmc:import -- path/to/extracted/archive
npm run tmc:generate
```

See `tmc/README.md` for the store layout and the provenance of the vendor files.

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
