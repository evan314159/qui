/*
 * Copyright (c) 2026, s0up and the autobrr contributors.
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import { act, cleanup, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { parseSearchType } from "@/lib/search-derived-params"

import { usePersistedSearchType } from "./usePersistedSearchType"

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

describe("usePersistedSearchType", () => {
  it("starts on Movies when nothing was chosen", () => {
    const { result } = renderHook(() => usePersistedSearchType())

    expect(result.current[0]).toBe("movies")
  })

  it("remembers the type that was last chosen", () => {
    const first = renderHook(() => usePersistedSearchType())

    act(() => first.result.current[1]("music"))
    expect(first.result.current[0]).toBe("music")
    expect(window.localStorage.getItem("qui-search-type")).toBe("\"music\"")

    // A later visit starts from it.
    first.unmount()
    const second = renderHook(() => usePersistedSearchType())
    expect(second.result.current[0]).toBe("music")
  })

  it("falls back to Movies for a stored value that is not a search type", () => {
    for (const stored of ["\"podcasts\"", "\"constructor\"", "7", "null", "not json"]) {
      window.localStorage.setItem("qui-search-type", stored)

      const { result, unmount } = renderHook(() => usePersistedSearchType())

      expect(result.current[0], stored).toBe("movies")
      unmount()
    }
  })
})

describe("parseSearchType", () => {
  it.each(["movies", "tv", "music", "books", "apps", "xxx"])("accepts %s", (type) => {
    expect(parseSearchType(JSON.stringify(type))).toBe(type)
  })

  it("rejects anything else", () => {
    expect(() => parseSearchType("\"toString\"")).toThrow()
    expect(() => parseSearchType("42")).toThrow()
  })
})
