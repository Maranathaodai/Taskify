"use client"

import React, { useEffect, useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { apolloClient } from "@/lib/apollo/client"

const queryClient = new QueryClient()

type Props = {
  children?: React.ReactNode
}

export default function ClientProviders({ children }: Props) {
  const [ApolloProviderComponent, setApolloProviderComponent] = useState<any | null>(null)

  useEffect(() => {
    // Dynamically import the Apollo React binding to avoid static import resolution issues with Turbopack
    import("@apollo/client/react")
      .then((mod) => {
        setApolloProviderComponent(() => (mod as any).ApolloProvider || (mod as any).default || null)
      })
      .catch(() => {
        // fallback to main package
        import("@apollo/client")
          .then((mod) => setApolloProviderComponent(() => (mod as any).ApolloProvider || (mod as any).default || null))
          .catch(() => setApolloProviderComponent(null))
      })
  }, [])

  if (ApolloProviderComponent) {
    const Provider = ApolloProviderComponent
    return (
      <Provider client={apolloClient}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </Provider>
    )
  }

  // If Apollo provider couldn't be loaded for some reason, still provide React Query context
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
