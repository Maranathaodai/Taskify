"use client"

import React from "react"

// Lightweight placeholder provider — the app currently uses direct fetch calls
// to the GraphQL endpoint. Keep this component so imports don't break when
// switching between implementations.
export function ApolloClientProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
