/*
 * Copyright (c) 2026, s0up and the autobrr contributors.
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import { describe, expect, it } from "vitest"

import { filterBySearchText, parseSearchTerms } from "./search-terms"

describe("parseSearchTerms", () => {
  it("reads plain, required and excluded words", () => {
    expect(parseSearchTerms("1080p +x264 -cam")).toEqual([
      { text: "1080p", excluded: false },
      { text: "x264", excluded: false },
      { text: "cam", excluded: true },
    ])
  })

  it("lower-cases and ignores extra whitespace", () => {
    expect(parseSearchTerms("  -CAM   1080P ")).toEqual([
      { text: "cam", excluded: true },
      { text: "1080p", excluded: false },
    ])
  })

  it("ignores a plus or minus on its own", () => {
    expect(parseSearchTerms("-")).toEqual([])
    expect(parseSearchTerms("+")).toEqual([])
    expect(parseSearchTerms("artist - title")).toEqual([
      { text: "artist", excluded: false },
      { text: "title", excluded: false },
    ])
    expect(parseSearchTerms("1080p -")).toEqual([{ text: "1080p", excluded: false }])
  })

  it("only treats a leading plus or minus as special", () => {
    expect(parseSearchTerms("x264-GRP c++")).toEqual([
      { text: "x264-grp", excluded: false },
      { text: "c++", excluded: false },
    ])
  })

  it("keeps a second hyphen in the term", () => {
    expect(parseSearchTerms("--foo")).toEqual([{ text: "-foo", excluded: true }])
  })

  it("is empty for an empty search", () => {
    expect(parseSearchTerms("")).toEqual([])
    expect(parseSearchTerms("   ")).toEqual([])
  })
})

interface Row {
  title: string
  group: string
}

const rows: Row[] = [
  { title: "Some.Movie.2024.1080p.BluRay.x264-GRP", group: "GRP" },
  { title: "Some.Movie.2024.1080p.CAM.x264-TSGRP", group: "TSGRP" },
  { title: "Other.Show.S01E01.1080p.WEB.DL.x265-GRP", group: "GRP" },
  { title: "Other.Show.S01E02.1080p.WEB-DL.x265-GRP", group: "GRP" },
  { title: "Plain.Linux.ISO", group: "" },
]
const fields = (row: Row) => [row.title, row.group]
const titles = (items: Row[]) => items.map((row) => row.title)

describe("filterBySearchText", () => {
  it("needs every word, wherever each one is", () => {
    expect(filterBySearchText(rows, "1080p", fields)).toHaveLength(4)
    expect(titles(filterBySearchText(rows, "movie bluray", fields))).toEqual(["Some.Movie.2024.1080p.BluRay.x264-GRP"])
    expect(titles(filterBySearchText(rows, "bluray movie", fields))).toEqual(["Some.Movie.2024.1080p.BluRay.x264-GRP"])
    expect(filterBySearchText(rows, "movie show", fields)).toHaveLength(0)
  })

  it("drops results containing an excluded word", () => {
    expect(titles(filterBySearchText(rows, "1080p -cam", fields))).toEqual([
      "Some.Movie.2024.1080p.BluRay.x264-GRP",
      "Other.Show.S01E01.1080p.WEB.DL.x265-GRP",
      "Other.Show.S01E02.1080p.WEB-DL.x265-GRP",
    ])
  })

  it("excludes on its own", () => {
    expect(titles(filterBySearchText(rows, "-1080p", fields))).toEqual(["Plain.Linux.ISO"])
  })

  it("treats a plus as a plain word", () => {
    expect(filterBySearchText(rows, "+1080p -cam", fields)).toEqual(filterBySearchText(rows, "1080p -cam", fields))
  })

  it("checks every field, not only the title", () => {
    expect(titles(filterBySearchText(rows, "movie -tsgrp", fields))).toEqual(["Some.Movie.2024.1080p.BluRay.x264-GRP"])
  })

  it("matches plain text, so separators must match", () => {
    expect(titles(filterBySearchText(rows, "1080p -web-dl", fields))).toEqual([
      "Some.Movie.2024.1080p.BluRay.x264-GRP",
      "Some.Movie.2024.1080p.CAM.x264-TSGRP",
      "Other.Show.S01E01.1080p.WEB.DL.x265-GRP",
    ])
  })

  it("is not case sensitive", () => {
    expect(filterBySearchText(rows, "-CAM", fields)).toHaveLength(4)
    expect(filterBySearchText(rows, "BLURAY", fields)).toHaveLength(1)
  })

  it("does not read a hyphen inside a word as an exclusion", () => {
    expect(titles(filterBySearchText(rows, "x264-GRP", fields))).toEqual(["Some.Movie.2024.1080p.BluRay.x264-GRP"])
  })

  it("returns every item for an empty search or a lone plus or minus", () => {
    for (const search of ["", "   ", "-", "+", "- +"]) {
      expect(filterBySearchText(rows, search, fields)).toEqual(rows)
    }
  })
})
