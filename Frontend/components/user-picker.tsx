"use client"

import { useState } from "react"
import { useUsers } from "@/lib/hooks/useUsers"
import { useAssignTask } from "@/lib/hooks/useAssignTask"

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

  return (
    <div className="w-44 max-h-60 overflow-auto">
      <button
        onClick={() => handleAssign(undefined)}
        className="w-full text-left px-3 py-2 text-sm hover:bg-background transition-colors"
        disabled={busy}
      >
        Unassign
      </button>
      {loading ? (
        <div className="px-3 py-2 text-sm text-muted">Loading...</div>
      ) : (
        users.map((u: any) => (
          <button
            key={u.id}
            onClick={() => handleAssign(u.id)}
            className="w-full text-left px-3 py-2 text-sm hover:bg-background transition-colors"
            disabled={busy}
          >
            {u.name} ({u.email})
          </button>
        ))
      )}
      <div className="px-3 py-2 border-t border-border">
        <input
          className="w-full px-2 py-1 rounded-md bg-card border border-border text-sm"
          placeholder="Invite by email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className="mt-2 flex gap-2">
          <button
            onClick={handleInvite}
            className="flex-1 px-3 py-1 text-sm rounded-md bg-accent text-accent-foreground"
            disabled={busy}
          >
            Invite
          </button>
        </div>
        {error && <div className="text-xs text-destructive mt-2">{error}</div>}
      </div>
    </div>
  )
}
