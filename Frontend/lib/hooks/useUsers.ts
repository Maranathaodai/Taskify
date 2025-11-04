"use client"

import { useEffect, useState } from "react"

const GRAPHQL_URL = typeof window !== "undefined" && (process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:4000/graphql")

export function useUsers() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    const fetchUsers = async () => {
      if (!GRAPHQL_URL) return
      setLoading(true)
      setError(null)
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null
        const query = `query { users { id name email role } }`
        const res = await fetch(GRAPHQL_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ query }),
        })
        const json = await res.json()
        if (json.errors) throw new Error(json.errors[0]?.message || "GraphQL error")
        setUsers(json.data.users || [])
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  return { users, loading, error }
}
