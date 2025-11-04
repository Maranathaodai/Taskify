"use client"

type AssignResult = {
  id: string
  assignedTo?: { id: string; name?: string; email?: string } | null
}

export function useAssignTask() {
  const assign = async (id: string, userId?: string | null) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null

    const query = `mutation AssignTask($id: ID!, $userId: ID) { assignTask(id: $id, userId: $userId) { id assignedTo { id name email } } }`

    const res = await fetch("http://localhost:4000/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ query, variables: { id, userId } }),
    })

    const json = await res.json()
    if (json.errors) throw new Error(json.errors[0]?.message || "GraphQL error")

    return json.data.assignTask as AssignResult
  }

  const assignByEmail = async (id: string, email: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null

    const query = `mutation AssignByEmail($id: ID!, $email: String!) { assignTaskByEmail(id: $id, email: $email) { id assignedTo { id name email } } }`

    const res = await fetch("http://localhost:4000/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ query, variables: { id, email } }),
    })

    const json = await res.json()
    if (json.errors) throw new Error(json.errors[0]?.message || "GraphQL error")

    return json.data.assignTaskByEmail as AssignResult
  }

  return { assign, assignByEmail }
}
