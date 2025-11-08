"use client"

export function useUpdateTask() {
  const update = async (id: string, title?: string, description?: string, completed?: boolean) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null
    const GRAPHQL_URL = typeof window !== "undefined" ? process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:4000/graphql" : undefined
    if (!GRAPHQL_URL) throw new Error("GRAPHQL_URL not defined")
    const query = `mutation Update($id: ID!, $title: String, $description: String, $completed: Boolean) { updateTask(id: $id, title: $title, description: $description, completed: $completed) { id title description completed } }`
    const res = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ query, variables: { id, title, description, completed } }),
    })
    const json = await res.json()
    if (json.errors) throw new Error(json.errors[0]?.message || "GraphQL error")
    return json.data.updateTask
  }

  return { update }
}
