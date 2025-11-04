"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/button"
import { Input } from "@/components/input"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/card"
import { useTheme } from "@/components/theme-provider"
import { Moon, Sun, LogOut, Plus, Trash2, CheckCircle, Circle, ChevronDown, User as UserIcon } from "lucide-react"
import { useTasks } from "@/lib/hooks/useTasks"
import { useUsers } from "@/lib/hooks/useUsers"
import { UserPicker } from "@/components/user-picker"
import { usePendingAssignments } from "@/lib/hooks/usePendingAssignments"

interface Task {
  id: string
  title: string
  completed: boolean
  createdAt: Date
  userId: string
  assignedTo?: string | undefined
  createdBy?: string | undefined
  description?: string | undefined
}

interface TeamMember {
  id: string // use email or generated id
  name: string
  email: string
}

interface DashboardPageProps {
  onLogout: () => void
  role?: "admin" | "member"
}

export function DashboardPage({ onLogout, role = "admin" }: DashboardPageProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [filter, setFilter] = useState<"all" | "myTasks" | "completed">("all")
  const [showModal, setShowModal] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const [userName, setUserName] = useState("")
  const [userId, setUserId] = useState("")
  const [scrollY, setScrollY] = useState(0)
  const [statsVisible, setStatsVisible] = useState(false)
  const [statusDropdownOpen, setStatusDropdownOpen] = useState<string | null>(null)
  const [assignDropdownOpen, setAssignDropdownOpen] = useState<string | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [newMemberName, setNewMemberName] = useState("")
  const [newMemberEmail, setNewMemberEmail] = useState("")

  const taskFilter = useMemo(() => (role === "admin" ? { mine: false } : { mine: true }), [role])
  const { tasks: remoteTasks, loading: tasksLoading, refetch: refetchTasks } = useTasks(taskFilter)
  const { users: backendUsers, loading: usersLoading } = useUsers()

  useEffect(() => {
    const name = localStorage.getItem("userName") || "User"
    const id = localStorage.getItem("userId") || localStorage.getItem("userEmail") || ""
    setUserName(name)
    setUserId(id)

    // If backend returned tasks (we're authenticated), use them. Otherwise fall back to localStorage.
    if (remoteTasks && remoteTasks.length > 0) {
      const mapped = remoteTasks.map((t: any) => ({
        id: t.id,
        title: t.title,
        completed: t.completed,
        createdAt: new Date(t.createdAt),
        assignedTo: t.assignedTo?.id,
        createdBy: t.createdBy?.id,
        userId: t.createdBy?.id ?? "",
      }))
      setTasks(mapped)
    } else {
      const savedTasks = localStorage.getItem("tasks")
      if (savedTasks) {
        setTasks(
          JSON.parse(savedTasks).map((t: any) => ({
            ...t,
            createdAt: new Date(t.createdAt),
            userId: t.userId || id, // Ensure old tasks get userId
          })),
        )
      }
    }

    // Load team members: prefer backend users for admins, otherwise local storage
    if (role === "admin" && backendUsers && backendUsers.length > 0) {
      const members = backendUsers.map((u: any) => ({ id: u.id, name: u.name, email: u.email }))
      setTeamMembers(members)
      localStorage.setItem("teamMembers", JSON.stringify(members))
    } else {
      const savedMembers = localStorage.getItem("teamMembers")
      let members: TeamMember[] = []
      if (savedMembers) {
        members = JSON.parse(savedMembers)
      }
      if (id && !members.find((m) => m.id === id)) {
        members.push({ id, name, email: localStorage.getItem("userEmail") || id })
      }
      setTeamMembers(members)
      localStorage.setItem("teamMembers", JSON.stringify(members))
    }
  }, [remoteTasks, backendUsers])

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
      setStatsVisible(window.scrollY > 100)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const saveTasks = (newTasks: Task[]) => {
    setTasks(newTasks)
    localStorage.setItem("tasks", JSON.stringify(newTasks))
  }

  const saveMembers = (members: TeamMember[]) => {
    setTeamMembers(members)
    localStorage.setItem("teamMembers", JSON.stringify(members))
  }

  const addTask = () => {
    if (newTaskTitle.trim()) {
      const newTask: Task = {
        id: Date.now().toString(),
        title: newTaskTitle,
        completed: false,
        createdAt: new Date(),
        userId: userId,
      }
      saveTasks([newTask, ...tasks])
      setNewTaskTitle("")
      setShowModal(false)
    }
  }

  const toggleTask = (id: string) => {
    saveTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)))
  }

  const updateTaskStatus = (id: string, completed: boolean) => {
    saveTasks(tasks.map((t) => (t.id === id ? { ...t, completed } : t)))
    setStatusDropdownOpen(null)
  }

  const deleteTask = (id: string) => {
    saveTasks(tasks.filter((t) => t.id !== id))
  }

  const assignTask = (taskId: string, memberId?: string) => {
    saveTasks(
      tasks.map((t) => (t.id === taskId ? { ...t, // store assigned user id on task
        // backward compatibility: keep creator in userId, add assignedTo separately
        // we store it under a dynamic field to avoid breaking saved data
        ...(memberId !== undefined ? { assignedTo: memberId } : { assignedTo: undefined }) } : t)),
    )
    setAssignDropdownOpen(null)
  }

  const visible = (tasks as any[]).filter((t: any) => (role === "member" ? t.assignedTo === userId : true))
  const filteredTasks = visible.filter((t: any) => {
    if (filter === "myTasks") return (role === "member" ? true : t.assignedTo === userId) && !t.completed
    if (filter === "completed") return t.completed
    return true
  })

  const myTasks = tasks.filter((t: any) => t.assignedTo === userId)
  const completedCount = tasks.filter((t) => t.completed).length
  const activeCount = tasks.filter((t) => !t.completed).length
  const myTasksCount = myTasks.filter((t) => !t.completed).length
  const { pending: pendingAssignments, loading: pendingLoading, resend, cancel } = usePendingAssignments()

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Taskify</h1>
            <p className="text-sm text-muted">Welcome back, {userName}</p>
          </div>

          {statsVisible && (
            <div className="hidden md:flex items-center gap-6 transition-all duration-300 opacity-100">
              <div className="text-center">
                <p className="text-xs text-muted uppercase tracking-wide">Total</p>
                <p className="text-lg font-semibold">{tasks.length}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted uppercase tracking-wide">Completed</p>
                <p className="text-lg font-semibold text-accent">{completedCount}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted uppercase tracking-wide">Active</p>
                <p className="text-lg font-semibold">{activeCount}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md hover:bg-background transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <Button variant="outline" onClick={onLogout} className="gap-2 bg-transparent">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted">Total Tasks</p>
                  <p className="text-3xl font-semibold">{tasks.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted">Completed</p>
                  <p className="text-3xl font-semibold text-accent">{completedCount}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted">Active</p>
                  <p className="text-3xl font-semibold">{activeCount}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tasks Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Your Tasks</CardTitle>
              </div>
              {role === "admin" && (
                <Button variant="primary" size="sm" onClick={() => setShowModal(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  New Task
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex gap-2 mb-6 flex-wrap">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filter === "all"
                      ? "bg-accent text-accent-foreground"
                      : "bg-card text-foreground border border-border hover:bg-background"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter("myTasks")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filter === "myTasks"
                      ? "bg-accent text-accent-foreground"
                      : "bg-card text-foreground border border-border hover:bg-background"
                  }`}
                >
                  My Tasks
                </button>
                <button
                  onClick={() => setFilter("completed")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filter === "completed"
                      ? "bg-accent text-accent-foreground"
                      : "bg-card text-foreground border border-border hover:bg-background"
                  }`}
                >
                  Completed
                </button>
              </div>

              {/* Task List */}
              <div className="space-y-2">
                {filteredTasks.length === 0 ? (
                  <p className="text-center text-muted py-8">
                    {tasks.length === 0 ? "No tasks yet. Create one to get started!" : "No tasks in this filter."}
                  </p>
                ) : (
                  filteredTasks.map((task: any) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-4 rounded-md border border-border hover:bg-card transition-colors group"
                    >
                      <button onClick={() => toggleTask(task.id)} className="flex-shrink-0">
                        {task.completed ? (
                          <CheckCircle className="w-5 h-5 text-accent" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className={`${task.completed ? "line-through text-muted" : "text-foreground"}`}>
                          {task.title}
                        </div>
                        <div className="mt-1 text-xs text-muted flex items-center gap-2">
                          <UserIcon className="w-3.5 h-3.5" />
                          <span>
                            {(() => {
                              const pending = pendingAssignments.find((p: any) => p.task?.id === task.id)
                              if (pending) return `Invited: ${pending.email}`
                              return task.assignedTo
                                ? teamMembers.find((m) => m.id === task.assignedTo)?.name || task.assignedTo
                                : "Unassigned"
                            })()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Status Dropdown (both can update own task status; admin can update any) */}
                        <div className="relative">
                          <button
                            onClick={() => setStatusDropdownOpen(statusDropdownOpen === task.id ? null : task.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border border-border hover:bg-background transition-colors"
                          >
                            <span className="text-xs">{task.completed ? "Completed" : "Pending"}</span>
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          {statusDropdownOpen === task.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setStatusDropdownOpen(null)}
                              />
                              <div className="absolute right-0 mt-1 w-32 bg-card border border-border rounded-md shadow-lg z-20">
                                <button
                                  onClick={() => updateTaskStatus(task.id, false)}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-background transition-colors rounded-t-md"
                                >
                                  Pending
                                </button>
                                <button
                                  onClick={() => updateTaskStatus(task.id, true)}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-background transition-colors rounded-b-md"
                                >
                                  Completed
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                        {role === "admin" && (
                          <>
                            {/* Assign Dropdown */}
                            <div className="relative">
                              <button
                                onClick={() => setAssignDropdownOpen(assignDropdownOpen === task.id ? null : task.id)}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border border-border hover:bg-background transition-colors"
                                title="Assign"
                              >
                                <span className="text-xs">Assign</span>
                                <ChevronDown className="w-4 h-4" />
                              </button>
                              {assignDropdownOpen === task.id && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={() => setAssignDropdownOpen(null)} />
                                  <div className="absolute right-0 mt-1 w-44 bg-card border border-border rounded-md shadow-lg z-20 max-h-60 overflow-auto">
                                    {/* Use the backend-powered UserPicker (falls back to local members if backend not available) */}
                                    <UserPicker
                                      taskId={task.id}
                                      onAssigned={(res: any) => {
                                        // Update the local tasks store to reflect assignment change when backend responds
                                        saveTasks(
                                          tasks.map((t) => (t.id === res.id ? { ...t, assignedTo: res.assignedTo?.id ?? undefined } : t)),
                                        )
                                        setAssignDropdownOpen(null)
                                      }}
                                    />
                                  </div>
                                </>
                              )}
                            </div>
                            <button
                              onClick={() => deleteTask(task.id)}
                              className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-destructive/10 rounded-md"
                              title="Delete task"
                            >
                              <Trash2 className="w-4 h-4 text-muted hover:text-destructive" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Team Members Section (admin only) */}
          {role === "admin" && (
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
              </CardHeader>
              <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-3">
                  {teamMembers.length === 0 ? (
                    <p className="text-sm text-muted">No team members yet.</p>
                  ) : (
                    teamMembers.map((m) => (
                      <div key={m.id} className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5">
                        <UserIcon className="w-4 h-4" />
                        <div className="text-sm">
                          <div className="font-medium">{m.name}</div>
                          <div className="text-muted text-xs">{m.email}</div>
                        </div>
                        <button
                          className="ml-2 text-xs text-destructive hover:underline"
                          onClick={() => saveMembers(teamMembers.filter((tm) => tm.id !== m.id))}
                          title="Remove member"
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input placeholder="Member name" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} />
                  <Input placeholder="Member email" value={newMemberEmail} onChange={(e) => setNewMemberEmail(e.target.value)} />
                  <Button
                    variant="outline"
                    onClick={() => {
                      const name = newMemberName.trim()
                      const email = newMemberEmail.trim()
                      if (!name || !email) return
                      const exists = teamMembers.find((m) => m.id === email)
                      const next = exists
                        ? teamMembers.map((m) => (m.id === email ? { ...m, name, email } : m))
                        : [...teamMembers, { id: email, name, email }]
                      saveMembers(next)
                      setNewMemberName("")
                      setNewMemberEmail("")
                    }}
                  >
                    Add Member
                  </Button>
                </div>
                <p className="text-xs text-muted">Tip: members are stored locally for now. Backend integration will replace this.</p>
              </div>
              </CardContent>
            </Card>
          )}

          {/* Pending Assignments (admin only) */}
          {role === "admin" && (
            <Card>
              <CardHeader>
                <CardTitle>Pending Invites</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingLoading ? (
                  <div className="text-sm text-muted">Loading...</div>
                ) : pendingAssignments.length === 0 ? (
                  <div className="text-sm text-muted">No pending invites.</div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {pendingAssignments.map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between gap-3 px-3 py-2 border border-border rounded-md">
                        <div>
                          <div className="text-sm font-medium">{p.email}</div>
                          <div className="text-xs text-muted">Task: {p.task?.title || p.task?.id}</div>
                          <div className="text-xs text-muted">Invited by: {p.invitedBy?.name || p.invitedBy?.email}</div>
                        </div>
                        <div className="flex gap-2">
                          <button className="px-2 py-1 text-sm border border-border rounded-md" onClick={() => resend(p.id)}>
                            Resend
                          </button>
                          <button className="px-2 py-1 text-sm text-destructive border border-border rounded-md" onClick={() => cancel(p.id)}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Add Task Modal (admin only) */}
      {role === "admin" && showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create New Task</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Enter task description..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addTask()}
                autoFocus
              />
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={addTask}>
                  Create Task
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
