import { Fragment, type ReactNode } from 'react'

const MARKUP = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/

/**
 * Renders the small inline markup the tutorial content uses: `**bold**` for the labels of
 * TwinCAT UI elements and menu entries, `*italic*` for options and quoted wording, and
 * `` `code` `` for object and parameter names.
 *
 * The steps stay plain data this way — testable and translatable — without giving up the
 * typographic distinction that makes a click path readable.
 */
export function richText(text: string): ReactNode[] {
  return text.split(MARKUP).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={index}>{part.slice(1, -1)}</em>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index}>{part.slice(1, -1)}</code>
    }
    return <Fragment key={index}>{part}</Fragment>
  })
}
