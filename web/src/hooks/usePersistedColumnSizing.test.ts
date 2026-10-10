/*
 * Copyright (c) 2026, s0up and the autobrr contributors.
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import { renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { usePersistedColumnSizing } from "./usePersistedColumnSizing"

const LEGACY_KEY = "qui-column-sizing"
const LEGACY_SIZING = JSON.stringify({ name: 321 })

afterEach(() => localStorage.clear())

describe("usePersistedColumnSizing legacy key", () => {
  it("moves the shared key into an instance's own key", () => {
    localStorage.setItem(LEGACY_KEY, LEGACY_SIZING)

    renderHook(() => usePersistedColumnSizing({}, 3))

    expect(localStorage.getItem("qui-column-sizing:3")).toBe(LEGACY_SIZING)
    expect(localStorage.getItem(LEGACY_KEY)).toBeNull()
  })

  it("leaves the shared key to the torrent list when a named table such as search uses the hook", () => {
    localStorage.setItem(LEGACY_KEY, LEGACY_SIZING)

    const { result } = renderHook(() => usePersistedColumnSizing({}, "search"))

    expect(result.current[0]).toEqual({})
    expect(localStorage.getItem(LEGACY_KEY)).toBe(LEGACY_SIZING)
    expect(localStorage.getItem("qui-column-sizing:search")).toBeNull()
  })
})
