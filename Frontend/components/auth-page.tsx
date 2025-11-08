"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/button"
import { Input } from "@/components/input"
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/card"
import { useTheme } from "@/components/theme-provider"
import { Moon, Sun, Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/lib/hooks/useAuth"

interface AuthPageProps {
  onAuthSuccess: () => void
}

export function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")
  // No visible role switcher; we infer role in the background
  const { theme, toggleTheme } = useTheme()

  const { login, register } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (isLogin) {
        const response = await login(email, password)
        const user = response as any
        const serverRole = user?.role
        let inferredRole: "admin" | "member"
        if (serverRole) {
          inferredRole = serverRole === "ADMIN" ? "admin" : "member"
        } else {
          const existingAdmin = localStorage.getItem("adminEmail")
          inferredRole = existingAdmin ? (user.email === existingAdmin ? "admin" : "member") : "admin"
          if (!existingAdmin) localStorage.setItem("adminEmail", user.email)
        }
        localStorage.setItem("userRole", inferredRole)

        // ensure other user fields are present for older flows
        try {
          localStorage.setItem("userId", user.id)
          localStorage.setItem("userEmail", user.email)
          localStorage.setItem("userName", user.name)
        } catch {}

        onAuthSuccess()
      } else {
        // Sign up flow: create account but do NOT auto-login. Show success and return to login form.
        if (!name.trim()) {
          setError("Name is required")
          setLoading(false)
          return
        }
        await register(name, email, password)
        setSuccess("Account created successfully. Please sign in.")
        setIsLogin(true)
        setPassword("")
        // keep the email filled to make signing in easier
        setLoading(false)
        return
      }
    } catch (err) {
      // Show server-provided error message when available
  const e: any = err
  const message = e?.graphQLErrors?.[0]?.message || e?.message || "Authentication failed"
      setError(message)
      setLoading(false)
      return
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background dark:bg-dark-background p-4">
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-2 rounded-[var(--radius)] hover:bg-card dark:hover:bg-dark-card transition-colors"
        aria-label="Toggle theme"
      >
        {theme === "light" ? (
          <Moon className="w-5 h-5 text-foreground dark:text-dark-foreground" />
        ) : (
          <Sun className="w-5 h-5 text-foreground dark:text-dark-foreground" />
        )}
      </button>

      <Card className="w-full max-w-md bg-white/5 dark:bg-white/5 backdrop-blur-md border border-white/10 dark:border-white/10">
        <CardHeader className="space-y-2">
          <CardTitle className="text-3xl">Taskify</CardTitle>
          <CardDescription>{isLogin ? "Sign in to your account" : "Create your account"}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground dark:text-dark-foreground">Full Name</label>
                <Input
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground dark:text-dark-foreground">Email</label>
              <Input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2 relative">
              <label className="text-sm font-medium text-foreground dark:text-dark-foreground">Password</label>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-8 p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-background"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-3 rounded-md bg-success/10 border border-success/20">
                <p className="text-sm text-success">{success}</p>
              </div>
            )}

            {/* If backend reports no account, offer a quick create-account CTA */}
            {error === 'No account found for that email' && (
              <div className="mt-3 text-sm text-muted">
                <p>No account with these details was found.</p>
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className="text-accent dark:text-dark-accent font-medium hover:underline mt-1"
                >
                  Create an account
                </button>
              </div>
            )}

            <Button type="submit" variant="primary" className="w-full" disabled={loading}>
              {loading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted dark:text-dark-muted">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-accent dark:text-dark-accent font-medium hover:underline"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
