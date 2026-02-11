# Beckhoff XTS Parameter Converter

A web-based tool for converting Beckhoff XTS SoftDrive parameters to MoverController parameters. This tool simplifies the migration process when upgrading from SoftDrive-based to MoverController-based XTS configurations.


## Disclaimer

This project is an independent, community-driven tool. It is **not affiliated with, endorsed by, supported by, or maintained by Beckhoff Automation GmbH & Co. KG** in any way. This is **not a Beckhoff product** and Beckhoff bears no responsibility for its content, functionality, or maintenance. "Beckhoff", "XTS", "TwinCAT", and related names are trademarks of Beckhoff Automation. All converted parameter values should be thoroughly reviewed and validated before being used in any production environment. The authors assume no liability for any damages or losses resulting from the use of this tool. Use at your own risk.

## Usage

1. **Import Parameters**: Load a SoftDrive parameter XML file or use the default values.
2. **Select Mover Type**: Choose the target mover type from the settings panel.
3. **Review & Edit**: Compare source and converted parameters side by side.

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
