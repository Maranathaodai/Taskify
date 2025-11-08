"use client"

import { useCallback, useState, useEffect } from "react"
import { gql } from "@apollo/client"
import { apolloClient } from "@/lib/apollo/client"

type User = { id: string; name?: string; email?: string; role?: string }

const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) { token user { id name email role } }
  }
`

const REGISTER = gql`
  mutation Register($name: String!, $email: String!, $password: String!) {
    register(name: $name, email: $email, password: $password) { token user { id name email role } }
  }
`

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user")
      if (raw) setUser(JSON.parse(raw))
    } catch {
      setUser(null)
    }
  }, [])

  const save = useCallback((token: string, userObj: User) => {
    try {
      localStorage.setItem("authToken", token)
      localStorage.setItem("user", JSON.stringify(userObj))
      // store normalized role for UI checks (lowercase)
      if (userObj && userObj.role) localStorage.setItem("userRole", String(userObj.role).toLowerCase())
    } catch {}
    setUser(userObj)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await apolloClient.mutate({ mutation: LOGIN, variables: { email, password } })
    const payload = (res as any).data?.login
    if (!payload) throw new Error('Login failed')
    save(payload.token, payload.user)
    return payload.user as User
  }, [save])

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await apolloClient.mutate({ mutation: REGISTER, variables: { name, email, password } })
    const payload = (res as any).data?.register
    if (!payload) throw new Error('Register failed')
    // Do not automatically persist token/user on register — require explicit login.
    // This avoids auto-login after signup and lets the UI show a success message and prompt to sign in.
    return payload.user as User
  }, [save])

  const logout = useCallback(() => {
    try {
      localStorage.removeItem("authToken")
      localStorage.removeItem("user")
      // Keep adminEmail as a persistent marker for the seeded/original admin.
      // Removing it here caused subsequent users to be inferred as admin.
      localStorage.removeItem("userRole")
    } catch {}
    setUser(null)
  }, [])

  return { user, login, register, logout }
}
