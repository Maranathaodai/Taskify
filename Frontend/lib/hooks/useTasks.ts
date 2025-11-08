"use client"

import { gql } from "@apollo/client"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { apolloClient } from "@/lib/apollo/client"
import { useEffect } from "react"

const TASKS_QUERY = gql`
  query Tasks($filter: TaskFilter) {
    tasks(filter: $filter) {
      id
      title
      description
      completed
      createdAt
      updatedAt
      createdBy { id name email }
      assignedTo { id name email }
    }
  }
`

export function useTasks(filter?: { mine?: boolean; completed?: boolean }) {
  const key = ["tasks", filter ?? { mine: true }]

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const vars = { filter: typeof filter !== 'undefined' ? filter : { mine: true } }
      const res = await apolloClient.query({ query: TASKS_QUERY, variables: vars, fetchPolicy: 'network-only' })
      const data = (res as any).data
      return data?.tasks || []
    },
    staleTime: 1000 * 30,
  })

  
  const qc = useQueryClient()
  useEffect(() => {
    let sub: any
    try {
      const createdSub = apolloClient.subscribe({ query: gql`subscription { taskCreated { id } }` })
      const updatedSub = apolloClient.subscribe({ query: gql`subscription { taskUpdated { id } }` })
      const deletedSub = apolloClient.subscribe({ query: gql`subscription { taskDeleted }` })
  sub = createdSub.subscribe({ next: () => qc.invalidateQueries({ queryKey: key }) })
      // also listen for updated and deleted
  const sub2 = updatedSub.subscribe({ next: () => qc.invalidateQueries({ queryKey: key }) })
  const sub3 = deletedSub.subscribe({ next: () => qc.invalidateQueries({ queryKey: key }) })
      return () => {
        sub.unsubscribe && sub.unsubscribe()
        sub2.unsubscribe && sub2.unsubscribe()
        sub3.unsubscribe && sub3.unsubscribe()
      }
    } catch (err) {
      return () => {}
    }
  }, [qc, JSON.stringify(filter)])

  return { tasks: query.data || [], loading: query.isLoading, error: query.error, refetch: query.refetch }
}
