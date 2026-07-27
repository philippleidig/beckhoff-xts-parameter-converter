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
   SoftDrive gains into the force-based MoverController gains.
3. **Convert** — see a summary of the result. *Show details* opens a side-by-side view of the
   source and converted parameters, where the SoftDrive values can still be edited.
4. **Export** — download the generated `.xti` and import it in TwinCAT under
   *SYSTEM → TcCOM Objects → Add Existing Item…*

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
