"use client"

export function useDeleteTask() {
  const del = async (id: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null
    const GRAPHQL_URL = typeof window !== "undefined" ? process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:4000/graphql" : undefined
    if (!GRAPHQL_URL) throw new Error("GRAPHQL_URL not defined")
    const query = `mutation Delete($id: ID!) { deleteTask(id: $id) }`
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
    return json.data.deleteTask
  }

  return { del }
}
