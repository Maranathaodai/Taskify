// Frontend-only mock API for auth.
// All backend/fetch logic removed so the app can run without a server.
// The functions below simulate a small network delay and return the
// same shapes the UI expects.

export interface LoginResponse {
  token: string
  user: {
    id: string
    email: string
    name: string
  }
}

export interface RegisterResponse {
  token: string
  user: {
    id: string
    email: string
    name: string
  }
}

function delay(ms = 200) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Adapted to call the real backend GraphQL endpoint instead of returning mocks.
// Keeps the same function signatures so existing UI code can continue to call
// `login` and `register` but will now use the backend.

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || '/graphql'

async function graphqlRequest(query: string, variables: any = {}, token?: string) {
  const headers: any = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  })
  const json = await res.json()
  if (json.errors && json.errors.length) {
    const message = json.errors.map((e: any) => e.message).join('\n')
    throw new Error(message)
  }
  return json.data
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const query = `
    mutation Login($email: String!, $password: String!) {
      login(email: $email, password: $password) { token user { id name email role } }
    }
  `
  const data = await graphqlRequest(query, { email, password })
  return data.login
}

export async function register(name: string, email: string, password: string): Promise<RegisterResponse> {
  const query = `
    mutation Register($name: String!, $email: String!, $password: String!) {
      register(name: $name, email: $email, password: $password) { token user { id name email role } }
    }
  `
  const data = await graphqlRequest(query, { name, email, password })
  return data.register
}

