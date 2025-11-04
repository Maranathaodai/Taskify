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
    setAuthenticated(false)
  }

  return authenticated ? (
    <DashboardPage onLogout={handleLogout} />
  ) : (
    <AuthPage onAuthSuccess={handleAuthSuccess} />
  )
}
