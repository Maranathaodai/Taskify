"use client"

import { gql } from "@apollo/client"
import { useQuery } from "@tanstack/react-query"
import { apolloClient } from "@/lib/apollo/client"

const USERS_QUERY = gql`
  query Users {
    users { id name email role }
  }
`

export function useUsers() {
  const key = ["users"]

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null
      const res = await apolloClient.query({ query: USERS_QUERY, fetchPolicy: "network-only", context: { headers: token ? { Authorization: `Bearer ${token}` } : {} } })
      const data = (res as any).data
      return data?.users || []
    },
    staleTime: 1000 * 30,
  })

  return { users: query.data || [], loading: query.isLoading, error: query.error, refetch: query.refetch }
}
