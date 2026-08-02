/**
 * Client for the Beckhoff TwinCAT package feed.
 *
 * The feed at `public.tcpkg.beckhoff-cloud.com` serves the **NuGet v2 (OData) protocol**,
 * not v3: there is no `index.json`, but `Packages()` and `FindPackagesById()` exist.
 *
 * Authentication is conditional and not under our control. The feed serves some
 * networks anonymously and answers `WWW-Authenticate: Basic realm="Package Server"` to
 * others, so credentials are sent when they are configured and omitted when they are
 * not, and a 401 is reported when it actually happens.
 *
 * The response shape is unverified from here, so everything fails loudly with the URL,
 * status and a body excerpt rather than degrading to "no versions found" — which would
 * look like "nothing new today" and stall the sync indefinitely.
 */

/** Retried on: the feed is behind CloudFront and occasionally sheds load. */
const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504])

const DEFAULT_RETRIES = 4
const DEFAULT_TIMEOUT_MS = 120_000

export class FeedError extends Error {
  constructor(message, { url, status, body } = {}) {
    super(message)
    this.name = 'FeedError'
    this.url = url
    this.status = status
    this.body = body
  }
}

/** Credentials never appear in a message; only whether they were sent. */
function describe(url, status, body) {
  const excerpt = body ? `\n  Body (first 500 chars): ${body.slice(0, 500)}` : ''
  return `\n  URL: ${url}\n  Status: ${status}${excerpt}`
}

function authHeader({ username, password }) {
  return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
}

/**
 * Reads the credentials from the environment, or `null` to go without.
 *
 * Whether the feed needs authentication depends on where the request comes from: it
 * answers 401 to some networks and serves anonymously to others. Refusing to run
 * without credentials was wrong — it failed every scheduled run before a single
 * request went out. A 401 is reported when it actually happens, and says what to do.
 */
export function credentialsFromEnv(env = process.env) {
  const username = env.TCPKG_USERNAME
  const password = env.TCPKG_PASSWORD

  return username && password ? { username, password } : null
}

async function fetchWithRetry(url, credentials, { retries = DEFAULT_RETRIES, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  let lastError

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, 2000 * 2 ** (attempt - 1)))
    }

    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/atom+xml,application/xml',
          ...(credentials ? { Authorization: authHeader(credentials) } : {}),
        },
        signal: AbortSignal.timeout(timeoutMs),
      })

      // Retrying a rejected credential just locks the account out.
      if (response.status === 401 || response.status === 403) {
        throw new FeedError(
          `The feed requires authentication from here.${describe(url, response.status)}\n` +
          (credentials
            ? '  TCPKG_USERNAME and TCPKG_PASSWORD were sent and rejected; check them.'
            : '  No credentials were sent. Set the TCPKG_USERNAME and TCPKG_PASSWORD secrets to a\n' +
              '  myBeckhoff account. The feed serves some networks anonymously and this is not one.'),
          { url, status: response.status }
        )
      }

      if (!response.ok) {
        const body = await response.text().catch(() => '')
        const error = new FeedError(`The feed returned an error.${describe(url, response.status, body)}`, {
          url,
          status: response.status,
          body,
        })
        if (!RETRYABLE_STATUS.has(response.status)) throw error
        lastError = error
        continue
      }

      return response
    } catch (error) {
      if (error instanceof FeedError && error.status === 401) throw error
      if (error instanceof FeedError && error.status && !RETRYABLE_STATUS.has(error.status)) throw error
      lastError = error
    }
  }

  throw lastError
}

const decodeXml = (text) =>
  text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')

/**
 * Parses one page of an OData Atom feed into package entries.
 *
 * Exported so it can be tested against a recorded response without network access —
 * which is the only way it can be tested at all until the credentials exist.
 */
export function parseFeedPage(xml, url = '(fixture)') {
  const entries = [...xml.matchAll(/<entry[\s>][\s\S]*?<\/entry>/g)].map((match) => match[0])

  const packages = entries.map((entry) => {
    const property = (name) => {
      const match = new RegExp(`<d:${name}[^>]*>([\\s\\S]*?)</d:${name}>`).exec(entry)
      return match ? decodeXml(match[1]).trim() : undefined
    }

    const version = property('Version') ?? property('NormalizedVersion')
    const id = property('Id')
    const contentUrl = /<content[^>]*\ssrc="([^"]+)"/.exec(entry)?.[1]

    if (!version) {
      throw new FeedError(
        `A feed entry has no <d:Version>, so it cannot be identified.${describe(url, 200, entry)}`,
        { url }
      )
    }

    return {
      id,
      version,
      published: property('Published') ?? property('Created'),
      contentUrl: contentUrl ? decodeXml(contentUrl) : undefined,
    }
  })

  const next = /<link[^>]*\srel="next"[^>]*\shref="([^"]+)"/.exec(xml)?.[1]

  return { packages, next: next ? decodeXml(next) : undefined }
}

/** Orders TwinCAT's four-part versions numerically. Never compare these as strings. */
export function compareVersions(a, b) {
  const parse = (value) => value.split(/[.+-]/).map((part) => Number.parseInt(part, 10) || 0)
  const left = parse(a)
  const right = parse(b)

  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    const diff = (left[i] ?? 0) - (right[i] ?? 0)
    if (diff !== 0) return diff
  }
  return 0
}

/** How many entries to ask for per request. The server caps the page size anyway. */
const PAGE_SIZE = 100

/**
 * Every published version of a package, oldest first.
 *
 * Paging is done with `$skip`/`$top` rather than by following `<link rel="next">`:
 * the server does not always emit a next link, and a missing one is indistinguishable
 * from a last page, which would silently truncate the history. A short page ends the
 * walk instead.
 *
 * Two routes are tried because only their existence was confirmed, not their response
 * shape — `FindPackagesById()` is the documented v2 route for listing every version of
 * one package, and `Packages()` with an `Id` filter is the general form.
 */
export async function listPackageVersions(feedUrl, packageId, credentials, options = {}) {
  const base = feedUrl.replace(/\/+$/, '')
  const routes = [
    (skip) =>
      `${base}/FindPackagesById()?id='${packageId}'&semVerLevel=2.0.0` +
      `&$orderby=Id&$top=${PAGE_SIZE}&$skip=${skip}`,
    (skip) =>
      `${base}/Packages()?$filter=Id%20eq%20'${packageId}'&semVerLevel=2.0.0` +
      `&$orderby=Id&$top=${PAGE_SIZE}&$skip=${skip}`,
  ]

  let lastError
  for (const route of routes) {
    try {
      const packages = []

      for (let skip = 0; ; skip += PAGE_SIZE) {
        const url = route(skip)
        const response = await fetchWithRetry(url, credentials, options)
        const xml = await response.text()
        const page = parseFeedPage(xml, url)

        if (page.packages.length === 0) {
          if (skip > 0) break

          throw new FeedError(
            `The feed returned no entries for '${packageId}'. The package is known to exist, so this ` +
            `is far more likely to be an unexpected response shape than an empty result.` +
            describe(url, response.status, xml),
            { url, status: response.status, body: xml }
          )
        }

        packages.push(...page.packages)
        if (page.packages.length < PAGE_SIZE) break
      }

      return packages.sort((a, b) => compareVersions(a.version, b.version))
    } catch (error) {
      if (error instanceof FeedError && (error.status === 401 || error.status === 403)) throw error
      lastError = error
    }
  }

  throw lastError
}

/** Downloads a package. The URL comes from the feed entry, so it is followed as given. */
export async function downloadPackage(pkg, feedUrl, credentials, options = {}) {
  const base = feedUrl.replace(/\/+$/, '')
  const url = pkg.contentUrl ?? `${base}/package/${pkg.id}/${pkg.version}`
  const response = await fetchWithRetry(url, credentials, options)

  return Buffer.from(await response.arrayBuffer())
}
