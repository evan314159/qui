/*
 * Copyright (c) 2026, s0up and the autobrr contributors.
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import { useEffect, useRef } from "react"
import { toast } from "sonner"

import { consumeOIDCAutoLoginSkip, OIDC_ERROR_PARAM, recordOIDCAutoLoginAttempt } from "@/lib/oidc-autologin"

interface OIDCAutoLoginOptions {
  autoLoginUrl: string
  autoLoginBlocked: boolean
  ready: boolean
  failedMessage: string
}

export function useOIDCAutoLogin({ autoLoginUrl, autoLoginBlocked, ready, failedMessage }: OIDCAutoLoginOptions) {
  const handled = useRef(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (handled.current) return

      const params = new URLSearchParams(window.location.search)
      if (params.has(OIDC_ERROR_PARAM)) {
        handled.current = true
        params.delete(OIDC_ERROR_PARAM)
        const search = params.toString()
        window.history.replaceState(null, "", `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`)
        toast.error(failedMessage)
        return
      }

      if (!autoLoginUrl || !ready) return

      handled.current = true
      consumeOIDCAutoLoginSkip()
      if (autoLoginBlocked) return

      recordOIDCAutoLoginAttempt()
      window.location.href = autoLoginUrl
    }, 0)
    return () => {
      window.clearTimeout(timer)
    }
  }, [autoLoginUrl, autoLoginBlocked, ready, failedMessage])
}
