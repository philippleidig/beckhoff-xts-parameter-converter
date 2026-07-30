# TMC version store

Driver metadata files (`.tmc`) from the Beckhoff TwinCAT package `TF5850.XTS.XAE`, one
directory per driver version, gzip-compressed.

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
| `extractor` | `msiextract`, `7z`, `nupkg` or `seed` |

`seed` marks 4.4.22.0, which was committed at the repository root before this pipeline
existed and was moved here rather than re-downloaded.

## Updating

`.github/workflows/tmc-sync.yml` checks the feed daily. To run it by hand:

```bash
TCPKG_USERNAME=… TCPKG_PASSWORD=… npm run tmc:sync -- --dry-run   # list what would be fetched
TCPKG_USERNAME=… TCPKG_PASSWORD=… npm run tmc:sync -- --all       # backfill the whole history
```

The feed requires HTTP Basic authentication with a myBeckhoff account. Nothing here is
generated at build time: `scripts/generate-tmc-data.mjs` turns these files into the
artifacts the application bundles, and those are committed too.
