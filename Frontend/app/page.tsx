"use client"

import { useState, useEffect } from "react"
import { AuthPage } from "@/components/auth-page"
import { DashboardPage } from "@/components/dashboard-page"

export default function Home() {
  // Track whether the user is authenticated using localStorage token.
  // After AuthPage calls `onAuthSuccess`, we'll flip this state and show
  // the dashboard. Logging out clears storage and returns to the auth UI.
  const [authenticated, setAuthenticated] = useState(false)

  // NOTE: we intentionally do NOT auto-check localStorage for an auth
  // token on mount. The user requested that sign-in must be manual for
  // testing purposes — they should click the Sign In button to
  // transition to the dashboard. Leaving this effect in place would
  // cause the app to auto-login if a token exists from a previous run.

  const handleAuthSuccess = () => {
    // AuthPage already writes the token to localStorage; reflect that here.
    setAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem("authToken")
    localStorage.removeItem("userId")
    localStorage.removeItem("userEmail")
    localStorage.removeItem("userName")
    // Keep adminEmail as a persistent marker for the original admin account.
    // Removing it on logout caused the next user to become the admin.
    localStorage.removeItem("userRole")
    setAuthenticated(false)
  }

  // Derive role safely from localStorage. If userRole is explicitly set, use it.
  // Otherwise fall back to checking the preserved adminEmail marker; if the
  // current user email matches adminEmail they're the admin, else default to
  // member. Defaulting to "member" avoids accidentally showing admin UI when
  // userRole is missing.
  let role: "admin" | "member" = "member"
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem("userRole")
    if (stored === "admin" || stored === "member") {
      role = stored as "admin" | "member"
    } else {
      const adminEmail = localStorage.getItem("adminEmail")
      const userEmail = localStorage.getItem("userEmail")
      if (adminEmail && userEmail && adminEmail === userEmail) role = "admin"
      else role = "member"
    }
  }

  return authenticated ? (
    <DashboardPage onLogout={handleLogout} role={role} />
  ) : (
    <AuthPage onAuthSuccess={handleAuthSuccess} />
  )
}
