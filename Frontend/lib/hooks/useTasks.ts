"use client"

import { useEffect, useState, useCallback } from "react"

const GRAPHQL_URL = typeof window !== "undefined" && (process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:4000/graphql")

export function useTasks(filter?: { mine?: boolean; completed?: boolean }) {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)

  const fetchTasks = useCallback(async (vars?: any) => {
    if (!GRAPHQL_URL) return
    setLoading(true)
    setError(null)
    try {
      const query = `query Tasks($filter: TaskFilter) { tasks(filter: $filter) { id title description completed createdAt updatedAt createdBy { id name email } assignedTo { id name email } } }`
      // Default to fetching only tasks belonging to the current user unless
      // an explicit filter is provided. This prevents showing all tasks to any
      // authenticated user.
      const effectiveFilter = typeof vars !== "undefined" ? vars : (filter ?? { mine: true })

      const res = await fetch(GRAPHQL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables: { filter: effectiveFilter } }),
      })
      const json = await res.json()
      if (json.errors) throw new Error(json.errors[0]?.message || "GraphQL error")
      setTasks(json.data.tasks || [])
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  return { tasks, loading, error, refetch: fetchTasks }
}
