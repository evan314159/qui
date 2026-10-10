/*
 * Copyright (c) 2026, s0up and the autobrr contributors.
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

export const OIDC_ERROR_PARAM = "oidc_error"

const SKIP_KEY = "qui_oidc_skip_autologin"
const ATTEMPT_KEY = "qui_oidc_autologin_at"

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
    return
  }
}

export function skipOIDCAutoLoginOnce(): void {
  write(SKIP_KEY, "1")
}

export function consumeOIDCAutoLoginSkip(): void {
  write(SKIP_KEY, null)
}

export function recordOIDCAutoLoginAttempt(now = Date.now()): void {
  write(ATTEMPT_KEY, String(now))
}

export function isOIDCAutoLoginBlocked(search: string, now = Date.now()): boolean {
  const params = new URLSearchParams(search)
  if (params.has(OIDC_ERROR_PARAM)) return true
  if (params.has("code") && params.has("state")) return true
  if (read(SKIP_KEY) !== null) return true

  const attemptedAt = Number(read(ATTEMPT_KEY))
  return Number.isFinite(attemptedAt) && attemptedAt > 0 && now - attemptedAt < OIDC_AUTOLOGIN_RETRY_MS
}
