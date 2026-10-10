/*
 * Copyright (c) 2026, s0up and the autobrr contributors.
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

// The columns the user can reorder and hide, in default order. The actions column
// is pinned last and never listed here.
export const SEARCH_TABLE_COLUMN_IDS = [
  "title",
  "indexer",
  "size",
  "seeders",
  "category",
  "source",
  "collection",
  "group",
  "freeleech",
  "published",
] as const

export type SearchTableColumnId = typeof SEARCH_TABLE_COLUMN_IDS[number]
// The shape usePersistedColumnSizing stores; an id without an entry has its default width.
export type SearchTableColumnWidths = Record<string, number>

// Takes the spare width, and is always shown.
export const SEARCH_TABLE_TITLE_COLUMN: SearchTableColumnId = "title"

const SEARCH_TABLE_DEFAULT_WIDTHS: Record<SearchTableColumnId, number> = {
  title: 240,
  indexer: 140,
  size: 100,
  seeders: 100,
  category: 140,
  source: 110,
  collection: 140,
  group: 110,
  freeleech: 100,
  published: 150,
}

const SEARCH_TABLE_ACTIONS_WIDTH = 80
export const SEARCH_TABLE_MIN_COLUMN_WIDTH = 60
export const SEARCH_TABLE_MAX_COLUMN_WIDTH = 800

export function clampSearchColumnWidth(width: number): number {
  return Math.min(Math.max(Math.round(width), SEARCH_TABLE_MIN_COLUMN_WIDTH), SEARCH_TABLE_MAX_COLUMN_WIDTH)
}

/** The shown columns in display order. The title column cannot be hidden. */
export function getVisibleSearchColumns(
  order: readonly string[],
  visibility: Record<string, boolean>
): SearchTableColumnId[] {
  const known = new Set<string>(SEARCH_TABLE_COLUMN_IDS)
  return order.filter((id): id is SearchTableColumnId =>
    known.has(id) && (id === SEARCH_TABLE_TITLE_COLUMN || visibility[id] !== false)
  )
}

function widthOf(widths: SearchTableColumnWidths, id: SearchTableColumnId): number {
  return widths[id] ?? SEARCH_TABLE_DEFAULT_WIDTHS[id]
}

// The title absorbs spare space, so its width is the minimum it can shrink to.
export function buildSearchGridTemplate(
  columns: readonly SearchTableColumnId[],
  widths: SearchTableColumnWidths
): string {
  return [
    ...columns.map(id => id === SEARCH_TABLE_TITLE_COLUMN ? `minmax(${widthOf(widths, id)}px, 1fr)` : `${widthOf(widths, id)}px`),
    `${SEARCH_TABLE_ACTIONS_WIDTH}px`,
  ].join(" ")
}

export function getSearchTableMinWidth(columns: readonly SearchTableColumnId[], widths: SearchTableColumnWidths): number {
  return columns.reduce((sum, id) => sum + widthOf(widths, id), SEARCH_TABLE_ACTIONS_WIDTH)
}
