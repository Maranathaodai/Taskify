"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/button"
import { Input } from "@/components/input"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/card"
import { useTheme } from "@/components/theme-provider"
import { Moon, Sun, LogOut, Plus, Trash2, CheckCircle, Circle, ChevronDown } from "lucide-react"

interface Task {
  id: string
  title: string
  completed: boolean
  createdAt: Date
  userId: string
}

interface DashboardPageProps {
  onLogout: () => void
}

export function DashboardPage({ onLogout }: DashboardPageProps) {
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

  useEffect(() => {
    const name = localStorage.getItem("userName") || "User"
    const id = localStorage.getItem("userId") || localStorage.getItem("userEmail") || ""
    setUserName(name)
    setUserId(id)
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
  }, [])

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

  const filteredTasks = tasks.filter((t) => {
    if (filter === "myTasks") return t.userId === userId && !t.completed
    if (filter === "completed") return t.completed
    return true
  })

  const myTasks = tasks.filter((t) => t.userId === userId)
  const completedCount = tasks.filter((t) => t.completed).length
  const activeCount = tasks.filter((t) => !t.completed).length
  const myTasksCount = myTasks.filter((t) => !t.completed).length

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
              <Button variant="primary" size="sm" onClick={() => setShowModal(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                New Task
              </Button>
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
                  filteredTasks.map((task) => (
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
                      <span className={`flex-1 ${task.completed ? "line-through text-muted" : "text-foreground"}`}>
                        {task.title}
                      </span>
                      <div className="flex items-center gap-2">
                        {/* Status Dropdown */}
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
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-destructive/10 rounded-md"
                          title="Delete task"
                        >
                          <Trash2 className="w-4 h-4 text-muted hover:text-destructive" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Add Task Modal */}
      {showModal && (
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
