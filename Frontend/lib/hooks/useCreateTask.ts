"use client"

import { gql } from "@apollo/client"
import { useMutation } from "@tanstack/react-query"
import { apolloClient } from "@/lib/apollo/client"

const CREATE_TASK = gql`
  mutation CreateTask($title: String!, $description: String) {
    createTask(title: $title, description: $description) {
      id
      title
      description
      completed
      createdAt
      createdBy { id name email }
      assignedTo { id name email }
    }
  }
`

export function useCreateTask() {
  const mutation = useMutation({
    mutationFn: async ({ title, description }: { title: string; description?: string }) => {
      const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null
      // Apollo client will attach headers via link if configured; we set auth header manually here
      const res = await apolloClient.mutate({ mutation: CREATE_TASK, variables: { title, description }, context: { headers: token ? { Authorization: `Bearer ${token}` } : {} } })
      const data = (res as any).data
      if (!res || !data) throw new Error('Create task failed')
      return data.createTask
    }
  })

  const createTask = (title: string, description?: string) => mutation.mutateAsync({ title, description })

  return { createTask, loading: mutation.isLoading, error: mutation.isError ? mutation.error : null }
}
