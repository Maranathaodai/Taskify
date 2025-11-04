"use client"

const GRAPHQL_URL = typeof window !== "undefined" && (process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:4000/graphql")

export function useToggleComplete() {
  const toggle = async (id: string) => {
    if (!GRAPHQL_URL) throw new Error("GRAPHQL_URL not defined")
    const token = localStorage.getItem("authToken")
    const query = `mutation ToggleTask($id: ID!) { toggleTaskComplete(id: $id) { id completed } }`
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
    return json.data.toggleTaskComplete
  }

  return { toggle }
}
