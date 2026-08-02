import { describe, expect, it } from 'vitest'
import { compareVersions, credentialsFromEnv, FeedError, parseFeedPage } from './feed.mjs'

/**
 * A recorded-shape OData v2 response.
 *
 * The live feed needs credentials this project does not have, so the parser is held to
 * the protocol's documented shape rather than to a real capture. Anything the real
 * feed does differently will surface as the deliberate "no entries" failure rather
 * than as a silent empty result.
 */
const ATOM_PAGE = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:d="http://schemas.microsoft.com/ado/2007/08/dataservices"
      xmlns:m="http://schemas.microsoft.com/ado/2007/08/dataservices/metadata">
  <entry>
    <content type="application/zip" src="https://feed.example/api/v1/feeds/Stable/package/TF5850.XTS.XAE/4.4.22.0" />
    <m:properties>
      <d:Id>TF5850.XTS.XAE</d:Id>
      <d:Version>4.4.22.0</d:Version>
      <d:Published m:type="Edm.DateTime">2024-11-04T09:12:00Z</d:Published>
    </m:properties>
  </entry>
  <entry>
    <content type="application/zip" src="https://feed.example/api/v1/feeds/Stable/package/TF5850.XTS.XAE/4.4.23.0" />
    <m:properties>
      <d:Id>TF5850.XTS.XAE</d:Id>
      <d:Version>4.4.23.0</d:Version>
      <d:Published m:type="Edm.DateTime">2025-02-17T11:00:00Z</d:Published>
    </m:properties>
  </entry>
  <link rel="next" href="https://feed.example/api/v1/feeds/Stable/FindPackagesById()?id=&apos;TF5850.XTS.XAE&apos;&amp;$skiptoken=&apos;4.4.23.0&apos;" />
</feed>`

describe('parseFeedPage', () => {
  it('reads id, version, publication date and download URL from each entry', () => {
    const { packages } = parseFeedPage(ATOM_PAGE)

    expect(packages).toEqual([
      {
        id: 'TF5850.XTS.XAE',
        version: '4.4.22.0',
        published: '2024-11-04T09:12:00Z',
        contentUrl: 'https://feed.example/api/v1/feeds/Stable/package/TF5850.XTS.XAE/4.4.22.0',
      },
      {
        id: 'TF5850.XTS.XAE',
        version: '4.4.23.0',
        published: '2025-02-17T11:00:00Z',
        contentUrl: 'https://feed.example/api/v1/feeds/Stable/package/TF5850.XTS.XAE/4.4.23.0',
      },
    ])
  })

  /**
   * Paging is driven by `$skip`/`$top` rather than by this link, because the server does
   * not always emit one and a missing link is indistinguishable from a last page. The
   * link is still parsed, since it is the cheapest cross-check that a page was
   * understood at all.
   */
  it('reads the paging link when the server sends one, with entities decoded', () => {
    const { next } = parseFeedPage(ATOM_PAGE)

    expect(next).toBe(
      "https://feed.example/api/v1/feeds/Stable/FindPackagesById()?id='TF5850.XTS.XAE'&$skiptoken='4.4.23.0'"
    )
  })

  it('counts a page without a paging link as ordinary', () => {
    const page = parseFeedPage(ATOM_PAGE.replace(/<link rel="next"[\s\S]*?\/>/, ''))

    expect(page.next).toBeUndefined()
    expect(page.packages).toHaveLength(2)
  })

  it('refuses an entry without a version instead of inventing one', () => {
    const broken = ATOM_PAGE.replace('<d:Version>4.4.22.0</d:Version>', '')

    expect(() => parseFeedPage(broken)).toThrow(FeedError)
  })
})

describe('compareVersions', () => {
  // '4.4.9.0' sorts after '4.4.22.0' as a string, which would make the newest release
  // look older than the one before it and pin the app to a stale default.
  it('orders four-part versions numerically', () => {
    expect(['4.4.22.0', '4.4.9.0', '4.5.0.0', '4.4.22.1'].sort(compareVersions)).toEqual([
      '4.4.9.0',
      '4.4.22.0',
      '4.4.22.1',
      '4.5.0.0',
    ])
  })

  it('treats a missing part as zero', () => {
    expect(compareVersions('4.4', '4.4.0.0')).toBe(0)
  })
})

describe('credentialsFromEnv', () => {
  it('reads the pair the workflow provides', () => {
    expect(credentialsFromEnv({ TCPKG_USERNAME: 'user', TCPKG_PASSWORD: 'secret' })).toEqual({
      username: 'user',
      password: 'secret',
    })
  })

  /**
   * The feed serves some networks anonymously. Refusing to run without credentials
   * failed every scheduled run before a single request went out, which is what this
   * returning null instead of throwing fixes.
   */
  it('goes without when the secrets are not set', () => {
    expect(credentialsFromEnv({})).toBeNull()
  })

  it('goes without when only one half is set', () => {
    expect(credentialsFromEnv({ TCPKG_USERNAME: 'user' })).toBeNull()
  })
})
