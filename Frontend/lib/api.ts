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

export async function login(email: string, _password: string): Promise<LoginResponse> {
  await delay()
  return {
    token: "mock-token",
    user: {
      id: "1",
      email,
      name: email.split("@")[0] || "Test User",
    },
  }
}

export async function register(name: string, email: string, _password: string): Promise<RegisterResponse> {
  await delay()
  return {
    token: "mock-token",
    user: {
      id: "2",
      email,
      name,
    },
  }
}

