export const ACCEPTED_EXTENSIONS = ['.xml', '.xti']

/** Generous ceiling: the bundled samples are 40–250 kB. */
export const MAX_FILE_BYTES = 32 * 1024 * 1024

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} kB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Reads a parameter file as text, rejecting anything that cannot be one before it is
 * opened. Parameter exports are a few hundred kB; a much larger file is not one of
 * them, and parsing it would lock up the browser.
 *
 * Rejects with an `Error` whose message names the file and is safe to show as is.
 */
export function readParameterFile(file: File): Promise<string> {
  if (!ACCEPTED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext))) {
    return Promise.reject(new Error(`'${file.name}' is not an .xml or .xti file.`))
  }
  if (file.size === 0) {
    return Promise.reject(new Error(`'${file.name}' is empty.`))
  }
  if (file.size > MAX_FILE_BYTES) {
    return Promise.reject(
      new Error(
        `'${file.name}' is ${formatBytes(file.size)}, larger than the ${formatBytes(MAX_FILE_BYTES)} limit ` +
        `for a parameter export. Check that this is the right file.`
      )
    )
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error(`'${file.name}' could not be read.`))
    reader.onload = (e) => {
      const content = e.target?.result
      if (typeof content !== 'string') {
        reject(new Error(`'${file.name}' could not be read as text.`))
        return
      }
      resolve(content)
    }

    try {
      reader.readAsText(file)
    } catch {
      reject(new Error(`'${file.name}' could not be read.`))
    }
  })
}

/** Picks the single dropped file, or reports why the drop is unusable. */
export function singleDroppedFile(files: File[]): { file: File } | { error: string } {
  if (files.length === 0) {
    return { error: 'No file was dropped. Drop a single .xml or .xti file.' }
  }
  if (files.length > 1) {
    return { error: `${files.length} files were dropped. Drop a single .xml or .xti file.` }
  }
  return { file: files[0] }
}
