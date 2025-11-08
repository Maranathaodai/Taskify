import { ApolloClient, InMemoryCache, HttpLink, split } from "@apollo/client"
import { ApolloLink } from "@apollo/client/core"
import { GraphQLWsLink } from "@apollo/client/link/subscriptions"
import { createClient as createWsClient } from "graphql-ws"
import { getMainDefinition } from "@apollo/client/utilities"

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:4000/graphql"
const GRAPHQL_WS = process.env.NEXT_PUBLIC_GRAPHQL_WS || "ws://localhost:4000/graphql"

function createApolloClient() {
  const httpLink = new HttpLink({ uri: GRAPHQL_URL })

  // Attach Authorization header from localStorage for each request (client-side only)
  const authLink = new ApolloLink((operation: any, forward: any) => {
    try {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("authToken")
        const existing = operation.getContext().headers || {}
        operation.setContext({ headers: { ...existing, Authorization: token ? `Bearer ${token}` : "" } })
      }
    } catch (e) {
      // ignore
    }
    return forward(operation)
  })

  let link: any = authLink.concat(httpLink)

  try {
    if (typeof window !== "undefined" && GRAPHQL_WS) {
      // graphql-ws supports dynamic connectionParams; read token from localStorage
      const wsClient = createWsClient({
        url: GRAPHQL_WS,
        connectionParams: () => {
          try {
            const token = localStorage.getItem("authToken")
            return token ? { Authorization: `Bearer ${token}` } : {}
          } catch (e) {
            return {}
          }
        },
      })
      const wsLink = new GraphQLWsLink(wsClient)
      link = split(
        (operation: any) => {
          const def = getMainDefinition(operation.query as any)
          return def.kind === "OperationDefinition" && def.operation === "subscription"
        },
        wsLink,
        authLink.concat(httpLink),
      )
    }
  } catch (err) {
    // fallback to http only
    // eslint-disable-next-line no-console
    console.warn('WS setup failed, using HTTP only', err)
  }

  return new ApolloClient({ link, cache: new InMemoryCache() })
}

export const apolloClient = createApolloClient()
