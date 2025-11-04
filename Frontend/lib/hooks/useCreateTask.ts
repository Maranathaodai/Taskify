"use client"

import { useState } from "react"

const GRAPHQL_URL = typeof window !== "undefined" && (process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:4000/graphql")

export function useCreateTask() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)

  const createTask = async (title: string, description?: string) => {
    if (!GRAPHQL_URL) throw new Error("GRAPHQL_URL not defined")
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem("authToken")
      const query = `mutation CreateTask($title: String!, $description: String) { createTask(title: $title, description: $description) { id title description completed createdAt createdBy { id name } } }`
      const res = await fetch(GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ query, variables: { title, description } }),
      })
      const json = await res.json()
      if (json.errors) throw new Error(json.errors[0]?.message || "GraphQL error")
      return json.data.createTask
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { createTask, loading, error }
}
