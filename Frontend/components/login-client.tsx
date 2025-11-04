"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthPage } from "@/components/auth-page"

export default function LoginClient() {
  const router = useRouter()

  // Do NOT auto-redirect if a token exists — require the user to
  // explicitly sign in. Keep the router replace on success so the
  // app navigates to the dashboard after an explicit login.
  return <AuthPage onAuthSuccess={() => router.replace("/")} />
}
