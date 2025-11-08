"use client"

import { useState } from "react"
import { useUsers } from "@/lib/hooks/useUsers"
import { useAssignTask } from "@/lib/hooks/useAssignTask"
import { Search, User, Mail, UserX, Loader2 } from "lucide-react"
import { Input } from "@/components/input"
import { Button } from "@/components/button"

interface UserPickerProps {
  taskId: string
  onAssigned?: (result: any) => void
}

export function UserPicker({ taskId, onAssigned }: UserPickerProps) {
  const { users, loading } = useUsers()
  const { assign, assignByEmail } = useAssignTask()
  const [email, setEmail] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")

  const handleAssign = async (userId?: string | null) => {
    try {
      setBusy(true)
      setError(null)
      const res = userId ? await assign(taskId, userId) : await assign(taskId, undefined)
      onAssigned?.(res)
    } catch (err: any) {
      setError(err?.message || "Failed to assign")
    } finally {
      setBusy(false)
    }
  }

  const handleInvite = async () => {
    if (!email) return
    try {
      setBusy(true)
      setError(null)
      const res = await assignByEmail(taskId, email)
      onAssigned?.(res)
      setEmail("")
    } catch (err: any) {
      setError(err?.message || "Failed to invite")
    } finally {
      setBusy(false)
    }
  }

  const filtered = users ? users.filter((u: any) => `${u.name} ${u.email}`.toLowerCase().includes(query.toLowerCase())) : []

  return (
    <div className="w-full min-w-[360px] max-w-md">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Assign Task</h3>
        <p className="text-xs text-muted-foreground mt-1">Select a team member or invite by email</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Search Section */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9 w-full"
            placeholder="Search team members..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Unassign Option */}
        <button
          onClick={() => handleAssign(undefined)}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground hover:bg-background hover:text-foreground transition-colors rounded-md border border-border"
          disabled={busy}
        >
          <UserX className="w-4 h-4" />
          <span>Unassign</span>
        </button>

        {/* Members List */}
        <div className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1 mb-2">
            Team Members
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span className="text-sm">Loading members...</span>
            </div>
          ) : filtered.length > 0 ? (
            <div className="max-h-64 overflow-y-auto space-y-1 rounded-md border border-border">
              {filtered.map((u: any) => (
                <button
                  key={u.id}
                  onClick={() => handleAssign(u.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={busy}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-foreground truncate">{u.name || "Unknown"}</div>
                    <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground border border-border rounded-md">
              {query ? "No members found matching your search" : "No team members available"}
            </div>
          )}
        </div>

        {/* Invite Section */}
        <div className="pt-4 border-t border-border space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <label className="text-sm font-medium text-foreground">Invite by Email</label>
          </div>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                className="flex-1"
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !busy && email.trim() && handleInvite()}
                disabled={busy}
              />
              <Button
                variant="primary"
                size="sm"
                onClick={handleInvite}
                disabled={busy || !email.trim()}
                className="px-4"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Invite"}
              </Button>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                <span>{error}</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              An invitation will be sent to this email address
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
