"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthPage } from "@/components/auth-page"

export default function LoginClient() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("authToken")
    if (token) {
      router.replace("/")
    }
  }, [router])

  return <AuthPage onAuthSuccess={() => router.replace("/")} />
}
