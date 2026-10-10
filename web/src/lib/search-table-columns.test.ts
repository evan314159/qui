/*
 * Copyright (c) 2026, s0up and the autobrr contributors.
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import { describe, expect, it } from "vitest"

import {
  buildSearchGridTemplate,
  clampSearchColumnWidth,
  getSearchTableMinWidth,
  getVisibleSearchColumns,
  SEARCH_TABLE_COLUMN_IDS,
  SEARCH_TABLE_MAX_COLUMN_WIDTH,
  SEARCH_TABLE_MIN_COLUMN_WIDTH
} from "./search-table-columns"

describe("search table columns", () => {
  it("builds the original grid when nothing was changed", () => {
    expect(buildSearchGridTemplate(SEARCH_TABLE_COLUMN_IDS, {})).toBe(
      "minmax(240px, 1fr) 140px 100px 100px 140px 110px 140px 110px 100px 150px 80px"
    )
    expect(getSearchTableMinWidth(SEARCH_TABLE_COLUMN_IDS, {})).toBe(1410)
  })

  it("applies resized widths and keeps the title flexible", () => {
    const widths = { title: 400, size: 180 }
    expect(buildSearchGridTemplate(SEARCH_TABLE_COLUMN_IDS, widths)).toBe(
      "minmax(400px, 1fr) 140px 180px 100px 140px 110px 140px 110px 100px 150px 80px"
    )
    expect(getSearchTableMinWidth(SEARCH_TABLE_COLUMN_IDS, widths)).toBe(1410 + 160 + 80)
  })

  it("follows the given column order and leaves out hidden columns", () => {
    expect(buildSearchGridTemplate(["size", "title"], {})).toBe("100px minmax(240px, 1fr) 80px")
    expect(getSearchTableMinWidth(["size", "title"], {})).toBe(100 + 240 + 80)
  })

  it("clamps widths to the allowed range", () => {
    expect(clampSearchColumnWidth(1)).toBe(SEARCH_TABLE_MIN_COLUMN_WIDTH)
    expect(clampSearchColumnWidth(99999)).toBe(SEARCH_TABLE_MAX_COLUMN_WIDTH)
    expect(clampSearchColumnWidth(200.4)).toBe(200)
  })

  it("lists visible columns in order, never hiding the title and ignoring unknown ids", () => {
    expect(getVisibleSearchColumns(["size", "title", "bogus", "group"], { size: false, title: false, group: true })).toEqual(["title", "group"])
    expect(getVisibleSearchColumns(SEARCH_TABLE_COLUMN_IDS, {})).toEqual([...SEARCH_TABLE_COLUMN_IDS])
  })
})
