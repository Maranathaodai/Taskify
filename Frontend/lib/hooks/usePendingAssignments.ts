"use client"

import { gql } from "@apollo/client"
import { useQuery, useMutation } from "@tanstack/react-query"
import { apolloClient } from "@/lib/apollo/client"

const PENDING_QUERY = gql`
  query PendingAssignments {
    pendingAssignments {
      id
      email
      task { id title }
      invitedBy { id name email }
      createdAt
      updatedAt
    }
  }
`

const RESEND_MUTATION = gql`
  mutation Resend($id: ID!) {
    resendPendingAssignment(id: $id) {
      id
      email
      task { id }
      invitedBy { id name }
      createdAt
      updatedAt
    }
  }
`

const CANCEL_MUTATION = gql`
  mutation Cancel($id: ID!) {
    cancelPendingAssignment(id: $id)
  }
`

export function usePendingAssignments() {
  const key = ["pendingAssignments"]

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const res = await apolloClient.query({ query: PENDING_QUERY, fetchPolicy: "network-only" })
      const data = (res as any).data
      return data?.pendingAssignments || []
    },
    staleTime: 1000 * 30,
  })

  const resendMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null
      const res = await apolloClient.mutate({ mutation: RESEND_MUTATION, variables: { id }, context: { headers: token ? { Authorization: `Bearer ${token}` } : {} } })
      const data = (res as any).data
      if (!res || !data) throw new Error("Resend failed")
      return data.resendPendingAssignment
    },
    onSuccess: () => query.refetch(),
  })

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null
      const res = await apolloClient.mutate({ mutation: CANCEL_MUTATION, variables: { id }, context: { headers: token ? { Authorization: `Bearer ${token}` } : {} } })
      const data = (res as any).data
      if (!res || !data) throw new Error("Cancel failed")
      return data.cancelPendingAssignment
    },
    onSuccess: () => query.refetch(),
  })

  return {
    pending: query.data || [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    resend: (id: string) => resendMutation.mutateAsync(id),
    cancel: (id: string) => cancelMutation.mutateAsync(id),
  }
}
