"use client"

import { gql } from "@apollo/client"
import { useMutation } from "@tanstack/react-query"
import { apolloClient } from "@/lib/apollo/client"

type AssignResult = {
  id: string
  assignedTo?: { id: string; name?: string; email?: string } | null
}

const ASSIGN_TASK = gql`
  mutation AssignTask($id: ID!, $userId: ID) { assignTask(id: $id, userId: $userId) { id assignedTo { id name email } } }
`

const ASSIGN_BY_EMAIL = gql`
  mutation AssignByEmail($id: ID!, $email: String!) { assignTaskByEmail(id: $id, email: $email) { id assignedTo { id name email } } }
`

export function useAssignTask() {
  const assignMutation = useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId?: string | null }) => {
      const res = await apolloClient.mutate({ mutation: ASSIGN_TASK, variables: { id, userId } })
      const data = (res as any).data
      if (!res || !data) throw new Error('Assign failed')
      return data.assignTask as AssignResult
    }
  })

  const assignByEmailMutation = useMutation({
    mutationFn: async ({ id, email }: { id: string; email: string }) => {
      const res = await apolloClient.mutate({ mutation: ASSIGN_BY_EMAIL, variables: { id, email } })
      const data = (res as any).data
      if (!res || !data) throw new Error('Assign by email failed')
      return data.assignTaskByEmail as AssignResult
    }
  })

  const assign = async (id: string, userId?: string | null) => {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id)
    if (!isObjectId) return { id, assignedTo: userId ? { id: userId } : null }
    return assignMutation.mutateAsync({ id, userId })
  }

  const assignByEmail = async (id: string, email: string) => {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id)
    if (!isObjectId) return { id, assignedTo: null }
    return assignByEmailMutation.mutateAsync({ id, email })
  }

  return { assign, assignByEmail }
}
