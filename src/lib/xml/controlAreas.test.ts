import { describe, it, expect } from 'vitest'
import { parseControlAreas } from './controlAreas'

/** Builds a SoftDrive ParameterValues container holding the given control areas. */
function buildRoot(areas: Array<{ enabled: string; start?: number; end?: number; transition?: number }>): Element {
  const values = areas
    .map(
      (a, i) => `
      <Value><Name>ControlAreas[${i}].IsEnabled</Name><EnumText>${a.enabled}</EnumText></Value>
      <Value><Name>ControlAreas[${i}].reserved</Name><Value>0</Value></Value>
      <Value><Name>ControlAreas[${i}].StartPosition</Name><Value>${a.start ?? 0}</Value></Value>
      <Value><Name>ControlAreas[${i}].EndPosition</Name><Value>${a.end ?? 0}</Value></Value>
      <Value><Name>ControlAreas[${i}].TransitionLength</Name><Value>${a.transition ?? 0}</Value></Value>`
    )
    .join('')

  const doc = new DOMParser().parseFromString(
    `<Root><ParameterValues>${values}</ParameterValues></Root>`,
    'text/xml'
  )
  return doc.documentElement
}

describe('parseControlAreas', () => {
  it('returns only enabled areas', () => {
    const root = buildRoot([
      { enabled: 'FALSE', start: 100, end: 200 },
      { enabled: 'TRUE', start: 300, end: 400, transition: 20 },
      { enabled: 'FALSE' },
      { enabled: 'TRUE', start: 500, end: 600, transition: 10 },
    ])

    expect(parseControlAreas(root)).toEqual([
      { index: 1, startPosition: 300, endPosition: 400, transitionLength: 20 },
      { index: 3, startPosition: 500, endPosition: 600, transitionLength: 10 },
    ])
  })

  it('returns an empty list when every area is disabled', () => {
    // This is the case in all the bundled sample files.
    expect(parseControlAreas(buildRoot([{ enabled: 'FALSE' }, { enabled: 'FALSE' }]))).toEqual([])
  })

  it('accepts numeric 1 as enabled', () => {
    const doc = new DOMParser().parseFromString(
      `<Root><ParameterValues>
        <Value><Name>ControlAreas[0].IsEnabled</Name><Value>1</Value></Value>
        <Value><Name>ControlAreas[0].StartPosition</Name><Value>50</Value></Value>
        <Value><Name>ControlAreas[0].EndPosition</Name><Value>150</Value></Value>
        <Value><Name>ControlAreas[0].TransitionLength</Name><Value>5</Value></Value>
      </ParameterValues></Root>`,
      'text/xml'
    )

    expect(parseControlAreas(doc.documentElement)).toEqual([
      { index: 0, startPosition: 50, endPosition: 150, transitionLength: 5 },
    ])
  })

  it('stops at the first missing index', () => {
    const doc = new DOMParser().parseFromString(
      `<Root><ParameterValues>
        <Value><Name>ControlAreas[0].IsEnabled</Name><EnumText>TRUE</EnumText></Value>
        <Value><Name>ControlAreas[2].IsEnabled</Name><EnumText>TRUE</EnumText></Value>
      </ParameterValues></Root>`,
      'text/xml'
    )

    expect(parseControlAreas(doc.documentElement)).toHaveLength(1)
  })

  it('defaults missing positions to zero', () => {
    const doc = new DOMParser().parseFromString(
      `<Root><ParameterValues>
        <Value><Name>ControlAreas[0].IsEnabled</Name><EnumText>TRUE</EnumText></Value>
      </ParameterValues></Root>`,
      'text/xml'
    )

    expect(parseControlAreas(doc.documentElement)).toEqual([
      { index: 0, startPosition: 0, endPosition: 0, transitionLength: 0 },
    ])
  })

  it('returns an empty list for a null root', () => {
    expect(parseControlAreas(null)).toEqual([])
  })
})
