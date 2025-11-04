"use client"

import { useEffect, useState, useCallback } from "react"

const GRAPHQL_URL = typeof window !== "undefined" ? (process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:4000/graphql") : ""

export function usePendingAssignments() {
  const [pending, setPending] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)

  const fetchPending = useCallback(async () => {
    if (!GRAPHQL_URL) return
    setLoading(true)
    setError(null)
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null
  const query = `query { pendingAssignments { id email task { id title } invitedBy { id name email } createdAt updatedAt } }`
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
      setPending(json.data.pendingAssignments || [])
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPending()
  }, [fetchPending])

  const resend = async (id: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null
    const query = `mutation Resend($id: ID!) { resendPendingAssignment(id: $id) { id email task { id } invitedBy { id name } createdAt updatedAt } }`
    const res = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ query, variables: { id } }),
    })
    const json = await res.json()
    if (json.errors) throw new Error(json.errors[0]?.message || "GraphQL error")
    await fetchPending()
    return json.data.resendPendingAssignment
  }

  const cancel = async (id: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null
    const query = `mutation Cancel($id: ID!) { cancelPendingAssignment(id: $id) }`
    const res = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ query, variables: { id } }),
    })
    const json = await res.json()
    if (json.errors) throw new Error(json.errors[0]?.message || "GraphQL error")
    await fetchPending()
    return json.data.cancelPendingAssignment
  }

  return { pending, loading, error, refetch: fetchPending, resend, cancel }
}
