# TMC version store

Driver metadata files (`.tmc`) from Beckhoff, one directory per driver version,
gzip-compressed and byte-identical to the vendor's originals — CRLF line endings and
byte order mark included, so the recorded hashes are hashes of the files as shipped.

These are **Beckhoff Automation GmbH vendor files**, redistributed here unmodified so
that a parameter set can be generated for a specific driver version without a TwinCAT
installation. They are the same files a TF5850 installation places on disk. If Beckhoff
would rather they were not mirrored in a public repository, opening an issue is enough —
the pipeline can be changed to fetch and generate without committing the sources.

## Layout

```
tmc/index.json                        every known package version and where its files are
tmc/<version>/TcIoXts.tmc.gz          the MoverController driver metadata
tmc/<version>/TcSoftDrive.tmc.gz      the SoftDrive metadata, for reading imported files
```

`TcIoXts.tmc` is required; `TcSoftDrive.tmc` is not. Beckhoff's TcIoXts release archive
ships only the former, and the SoftDrive metadata describes the format a migration reads
*from* — an imported SoftDrive file states no version to match against. A release without
one is therefore described using the newest SoftDrive TMC in the store, and each
version's `dataset.json` records which one that was under `libraries.TcSoftDrive`.

A version whose TMCs are byte-identical to an earlier one gets no directory of its own.
Its manifest entry carries `sameTmcAs`, naming the version that introduced those files.
Most releases change the installer without changing the driver metadata, and gzipped
blobs do not delta in git, so this is what keeps the repository from growing by roughly
a quarter of a megabyte per release for no new information.

## Manifest entries

| Field | Meaning |
| --- | --- |
| `package` | the NuGet package version, which is **not** always the driver version |
| `tcIoXts`, `tcSoftDrive` | the versions the two files declare in their `<Library>` element |
| `sha256` | of the uncompressed vendor files, so provenance survives any zlib change |
| `status` | `ok`, `no-tmc` (the package contains none) or `error` (retried next run) |
| `sameTmcAs` | set when the files are identical to an earlier version's |
| `extractor` | `msiextract`, `7z`, `nupkg` or `import` |

`import` marks the ten versions that came from a Beckhoff release archive rather than
from the package feed — see below.

## Updating

`.github/workflows/tmc-sync.yml` checks the feed weekly. To run it by hand:

```bash
TCPKG_USERNAME=… TCPKG_PASSWORD=… npm run tmc:sync -- --dry-run   # list what would be fetched
TCPKG_USERNAME=… TCPKG_PASSWORD=… npm run tmc:sync -- --all       # backfill the whole history
```

The feed requires HTTP Basic authentication with a myBeckhoff account.

For TMCs that did not come from the feed — a release archive, or files copied out of a
TwinCAT installation — use the import instead, which needs no credentials:

```bash
npm run tmc:import -- <directory> --dry-run       # list what would be imported
npm run tmc:import -- <directory>
npm run tmc:generate
```

It scans the directory recursively and takes the version from each file's own
`<Library><Version>` element rather than from its path. Vendor archives are zipped on
Windows and extract into names containing literal backslashes, which no path-based
scheme survives — and the file is the authority on which version it describes anyway.

Nothing here is generated at build time: `scripts/generate-tmc-data.mjs` turns these
files into the artifacts the application bundles, and those are committed too.
