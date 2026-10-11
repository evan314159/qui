/*
 * Copyright (c) 2026, s0up and the autobrr contributors.
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

// The results filter works like qBittorrent's WebUI filter (containsAllTerms in
// its misc.js): words are lower-cased and every one must pass. A plain word, or
// one starting with "+", must appear in the text. A word starting with "-" must
// not. A "+" or "-" on its own is ignored. The torrent list search applies the
// same rules to its exclusions on the server (internal/qbittorrent/search_exclude.go).

interface SearchTerm {
  text: string
  excluded: boolean
}

export function parseSearchTerms(search: string): SearchTerm[] {
  const terms: SearchTerm[] = []
  for (const word of search.toLowerCase().split(/\s+/)) {
    if (word === "" || word === "+" || word === "-") continue
    if (word.startsWith("-")) terms.push({ text: word.slice(1), excluded: true })
    else if (word.startsWith("+")) terms.push({ text: word.slice(1), excluded: false })
    else terms.push({ text: word, excluded: false })
  }
  return terms
}

/**
 * Keeps the items that pass every term of the search. An item has several
 * fields, so a wanted word has to be in one of them and an excluded word in none.
 */
export function filterBySearchText<T>(items: T[], search: string, getFields: (item: T) => readonly string[]): T[] {
  const terms = parseSearchTerms(search)
  if (terms.length === 0) return items

  return items.filter((item) => {
    const fields = getFields(item).map((field) => field.toLowerCase())
    return terms.every((term) => fields.some((field) => field.includes(term.text)) !== term.excluded)
  })
}
