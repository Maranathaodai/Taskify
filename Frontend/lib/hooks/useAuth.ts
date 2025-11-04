"use client"

import { useCallback, useState, useEffect } from "react"

const GRAPHQL_URL = typeof window !== "undefined" && (process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:4000/graphql")

type User = { id: string; name?: string; email?: string; role?: string }

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
    } catch {}
    setUser(userObj)
  }, [])

  const callGQL = useCallback(async (query: string, variables: any) => {
    if (!GRAPHQL_URL) throw new Error("GRAPHQL_URL not defined")
    const res = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
    })
    const json = await res.json()
    if (json.errors) throw new Error(json.errors[0]?.message || "GraphQL error")
    return json.data
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const query = `mutation Login($email: String!, $password: String!) { login(email: $email, password: $password) { token user { id name email role } } }`
    const data = await callGQL(query, { email, password })
    const payload = data.login
    save(payload.token, payload.user)
    return payload.user as User
  }, [callGQL, save])

  const register = useCallback(async (name: string, email: string, password: string) => {
    const query = `mutation Register($name: String!, $email: String!, $password: String!) { register(name: $name, email: $email, password: $password) { token user { id name email role } } }`
    const data = await callGQL(query, { name, email, password })
    const payload = data.register
    save(payload.token, payload.user)
    return payload.user as User
  }, [callGQL, save])

  const logout = useCallback(() => {
    try {
      localStorage.removeItem("authToken")
      localStorage.removeItem("user")
    } catch {}
    setUser(null)
  }, [])

  return { user, login, register, logout }
}
