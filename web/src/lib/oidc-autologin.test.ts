/*
 * Copyright (c) 2026, s0up and the autobrr contributors.
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import { afterEach, describe, expect, it } from "vitest"

import {
  consumeOIDCAutoLoginSkip,
  isOIDCAutoLoginBlocked,
  OIDC_AUTOLOGIN_RETRY_MS,
  recordOIDCAutoLoginAttempt,
  skipOIDCAutoLoginOnce
} from "./oidc-autologin"

afterEach(() => sessionStorage.clear())

describe("isOIDCAutoLoginBlocked", () => {
  it("allows a plain visit", () => {
    expect(isOIDCAutoLoginBlocked("")).toBe(false)
  })

  it("blocks after a failed sign-in", () => {
    expect(isOIDCAutoLoginBlocked("?oidc_error=1")).toBe(true)
  })

  it("blocks on the callback leg of a sign-in", () => {
    expect(isOIDCAutoLoginBlocked("?code=abc&state=xyz")).toBe(true)
    expect(isOIDCAutoLoginBlocked("?code=abc")).toBe(false)
  })

  it("blocks once after a logout and then allows again", () => {
    skipOIDCAutoLoginOnce()
    expect(isOIDCAutoLoginBlocked("")).toBe(true)
    // A read does not consume the flag; the caller does.
    expect(isOIDCAutoLoginBlocked("")).toBe(true)

    consumeOIDCAutoLoginSkip()
    expect(isOIDCAutoLoginBlocked("")).toBe(false)
  })

  it("blocks a retry shortly after an attempt but not later", () => {
    recordOIDCAutoLoginAttempt(1_000_000)
    expect(isOIDCAutoLoginBlocked("", 1_000_000 + OIDC_AUTOLOGIN_RETRY_MS - 1)).toBe(true)
    expect(isOIDCAutoLoginBlocked("", 1_000_000 + OIDC_AUTOLOGIN_RETRY_MS)).toBe(false)
  })
})
