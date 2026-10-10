/*
 * Copyright (c) 2026, s0up and the autobrr contributors.
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cleanup, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  auth: { isAuthenticated: false, isLoading: false },
  api: {
    checkSetupRequired: vi.fn(),
    getOIDCConfig: vi.fn(),
  },
  toastError: vi.fn(),
  navigate: vi.fn(),
  authHook: {} as Record<string, unknown>,
}))

vi.mock("react-i18next", async (importOriginal) => ({
  ...await importOriginal<typeof import("react-i18next")>(),
  useTranslation: () => ({ t: (key: string) => key }),
}))
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => mocks.navigate }))
vi.mock("sonner", () => ({ toast: { error: mocks.toastError, info: vi.fn() } }))
vi.mock("@/lib/api", () => ({ api: mocks.api }))
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => Object.assign(mocks.authHook, mocks.auth, {
    login: vi.fn(),
    isLoggingIn: false,
    loginError: null,
    setIsAuthenticated: vi.fn(),
  }),
}))
vi.mock("@/components/Footer", () => ({ Footer: () => null }))
vi.mock("@/components/ui/Logo", () => ({ Logo: () => null }))
vi.mock("@/components/magicui/blur-fade", () => ({ BlurFade: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }))
vi.mock("@/components/magicui/shine-border", () => ({ ShineBorder: () => null }))

import { skipOIDCAutoLoginOnce, recordOIDCAutoLoginAttempt } from "@/lib/oidc-autologin"
import { Login } from "./Login"

const AUTH_URL = "https://idp.example.com/authorize?state=abc"
const originalLocation = window.location

function setLocation(search: string) {
  const location = { search, pathname: "/login", hash: "", href: "http://localhost/login" + search }
  Object.defineProperty(window, "location", { configurable: true, writable: true, value: location })
  return location
}

function renderLogin() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <Login />
    </QueryClientProvider>
  )
}

function oidcConfig(overrides: Partial<{ enabled: boolean; disableBuiltInLogin: boolean; autoLogin: boolean }> = {}) {
  return { enabled: true, disableBuiltInLogin: true, autoLogin: true, authorizationUrl: AUTH_URL, issuerUrl: "", ...overrides }
}

beforeEach(() => {
  // Radix's checkbox measures itself; jsdom has no ResizeObserver.
  vi.stubGlobal("ResizeObserver", class {
    observe() {}
    unobserve() {}
    disconnect() {}
  })
  mocks.auth.isAuthenticated = false
  mocks.auth.isLoading = false
  mocks.api.checkSetupRequired.mockResolvedValue(false)
  mocks.api.getOIDCConfig.mockResolvedValue(oidcConfig())
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  sessionStorage.clear()
  vi.clearAllMocks()
  Object.defineProperty(window, "location", { configurable: true, writable: true, value: originalLocation })
})

describe("Login OIDC auto-login", () => {
  it("sends the browser to the provider when auto login is on", async () => {
    const location = setLocation("")
    renderLogin()

    await waitFor(() => expect(location.href).toBe(AUTH_URL))
  })

  it("shows the sign-in page instead when auto login is off, even with the built-in login hidden", async () => {
    const location = setLocation("")
    mocks.api.getOIDCConfig.mockResolvedValue(oidcConfig({ autoLogin: false }))
    renderLogin()

    expect(await screen.findByText("login.openIdConnect")).toBeTruthy()
    expect(location.href).not.toBe(AUTH_URL)
  })

  it("redirects with auto login on while the built-in login is still available", async () => {
    const location = setLocation("")
    mocks.api.getOIDCConfig.mockResolvedValue(oidcConfig({ disableBuiltInLogin: false }))
    renderLogin()

    await waitFor(() => expect(location.href).toBe(AUTH_URL))
  })

  it("shows the sign-in page and an error after a failed sign-in", async () => {
    const location = setLocation("?oidc_error=1")
    renderLogin()

    expect(await screen.findByText("login.openIdConnect")).toBeTruthy()
    expect(mocks.toastError).toHaveBeenCalledWith("login.oidcFailed")
    expect(location.href).not.toBe(AUTH_URL)
  })

  it("shows the sign-in page once after a logout, then consumes the flag", async () => {
    const location = setLocation("")
    skipOIDCAutoLoginOnce()
    renderLogin()

    expect(await screen.findByText("login.openIdConnect")).toBeTruthy()
    await waitFor(() => expect(sessionStorage.getItem("qui_oidc_skip_autologin")).toBeNull())
    expect(location.href).not.toBe(AUTH_URL)
  })

  it("does not loop when a recent attempt did not sign in", async () => {
    const location = setLocation("")
    recordOIDCAutoLoginAttempt()
    renderLogin()

    expect(await screen.findByText("login.openIdConnect")).toBeTruthy()
    expect(location.href).not.toBe(AUTH_URL)
  })

  it("does not redirect an authenticated user", async () => {
    const location = setLocation("")
    mocks.auth.isAuthenticated = true
    renderLogin()

    await waitFor(() => expect(mocks.api.getOIDCConfig).toHaveBeenCalled())
    expect(location.href).not.toBe(AUTH_URL)
  })

  it("shows the sign-in page when the setup check fails, instead of waiting on it", async () => {
    const location = setLocation("")
    mocks.api.checkSetupRequired.mockRejectedValue(new Error("unreachable"))
    renderLogin()

    expect(await screen.findByText("login.openIdConnect")).toBeTruthy()
    expect(location.href).not.toBe(AUTH_URL)
  })

  it("does not redirect while first-run setup is required", async () => {
    const location = setLocation("")
    mocks.api.checkSetupRequired.mockResolvedValue(true)
    renderLogin()

    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith({ to: "/setup" }))
    expect(location.href).not.toBe(AUTH_URL)
  })
})
