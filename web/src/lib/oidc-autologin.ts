/*
 * Copyright (c) 2026, s0up and the autobrr contributors.
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

// With QUI__OIDC_AUTO_LOGIN on, the login page sends the browser to the provider
// itself. These helpers decide when it must not: after a failure or a logout, and
// when a round trip did not sign in.

export const OIDC_ERROR_PARAM = "oidc_error"

const SKIP_KEY = "qui_oidc_skip_autologin"
const ATTEMPT_KEY = "qui_oidc_autologin_at"

// A redirect that lands back on the login page within this window did not sign
// in (for example the session cookie was dropped), so stop instead of looping.
export const OIDC_AUTOLOGIN_RETRY_MS = 30_000

function read(key: string): string | null {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) sessionStorage.removeItem(key)
    else sessionStorage.setItem(key, value)
  } catch {
    // Without sessionStorage the guards below cannot hold, and the flows that
    // set them just fall back to the plain login page.
  }
}

/** Logout calls this so the login page it lands on does not sign straight back in. */
export function skipOIDCAutoLoginOnce(): void {
  write(SKIP_KEY, "1")
}

export function consumeOIDCAutoLoginSkip(): void {
  write(SKIP_KEY, null)
}

export function recordOIDCAutoLoginAttempt(now = Date.now()): void {
  write(ATTEMPT_KEY, String(now))
}

/** Pure read, safe for a render-time initializer; `consumeOIDCAutoLoginSkip` clears the flag. */
export function isOIDCAutoLoginBlocked(search: string, now = Date.now()): boolean {
  const params = new URLSearchParams(search)
  if (params.has(OIDC_ERROR_PARAM)) return true
  // The callback leg of a sign-in is not a new attempt.
  if (params.has("code") && params.has("state")) return true
  if (read(SKIP_KEY) !== null) return true

  const attemptedAt = Number(read(ATTEMPT_KEY))
  return Number.isFinite(attemptedAt) && attemptedAt > 0 && now - attemptedAt < OIDC_AUTOLOGIN_RETRY_MS
}
