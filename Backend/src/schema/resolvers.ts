import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { UserModel } from '../models/User'
import { TaskModel } from '../models/Task'
import { PendingAssignmentModel } from '../models/PendingAssignment'
import type { GraphQLContext } from '../middleware/context'
import { Types } from 'mongoose'

function mustAuth(ctx: GraphQLContext) {
  if (!ctx.user) throw new Error('Unauthorized')
}

function signToken(userId: string) {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET not set')
  return jwt.sign({ userId }, secret, { expiresIn: '7d' })
}

export const resolvers = {
  Query: {
    me: async (_: unknown, __: unknown, ctx: GraphQLContext) => ctx.user,
    tasks: async (_: unknown, args: { filter?: { mine?: boolean; completed?: boolean } }, ctx: GraphQLContext) => {
      mustAuth(ctx)
      const query: any = {}
      if (args.filter?.mine) query.$or = [{ createdBy: ctx.user!.id }, { assignedTo: ctx.user!.id }]
      if (typeof args.filter?.completed === 'boolean') query.completed = args.filter.completed
      return TaskModel.find(query).sort({ createdAt: -1 })
    },
    users: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      // Only allow admins to list all users
      mustAuth(ctx)
      if (ctx.user!.role !== 'ADMIN') throw new Error('Forbidden')
      return UserModel.find().sort({ createdAt: 1 })
    },
    pendingAssignments: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      mustAuth(ctx)
      // Admins see all pending assignments; members see only those they created
      if (ctx.user!.role === 'ADMIN') return PendingAssignmentModel.find().sort({ createdAt: -1 })
      return PendingAssignmentModel.find({ invitedBy: new Types.ObjectId(ctx.user!.id) }).sort({ createdAt: -1 })
    },
  },
  Mutation: {
    register: async (_: unknown, args: { name: string; email: string; password: string }) => {
      const exists = await UserModel.findOne({ email: args.email })
      if (exists) throw new Error('Email already in use')
      const passwordHash = await bcrypt.hash(args.password, 10)
      const usersCount = await UserModel.countDocuments()
      const role: 'ADMIN' | 'MEMBER' = usersCount === 0 ? 'ADMIN' : 'MEMBER'
      const user = await UserModel.create({ name: args.name, email: args.email, passwordHash, role })

      // Resolve any pending assignments created for this email
      try {
        const pendings = await PendingAssignmentModel.find({ email: args.email })
        for (const p of pendings) {
          const task = await TaskModel.findById(p.task)
          if (task) {
            task.assignedTo = new Types.ObjectId(user.id)
            await task.save()
          }
          await PendingAssignmentModel.deleteOne({ _id: p._id })
        }
      } catch (err) {
        // Non-fatal: log and continue
        // eslint-disable-next-line no-console
        console.warn('Failed to resolve pending assignments for', args.email, err)
      }

      const token = signToken(user.id)
      return { token, user }
    },
    login: async (_: unknown, args: { email: string; password: string }) => {
      const user = await UserModel.findOne({ email: args.email })
      if (!user) throw new Error('Invalid credentials')
      const ok = await bcrypt.compare(args.password, user.passwordHash)
      if (!ok) throw new Error('Invalid credentials')
      const token = signToken(user.id)
      return { token, user }
    },
    createTask: async (_: unknown, args: { title: string; description?: string }, ctx: GraphQLContext) => {
      mustAuth(ctx)
      const task = await TaskModel.create({
        title: args.title,
        description: args.description,
        createdBy: new Types.ObjectId(ctx.user!.id),
      })
      return task
    },
    updateTask: async (
      _: unknown,
      args: { id: string; title?: string; description?: string; completed?: boolean },
      ctx: GraphQLContext,
    ) => {
      mustAuth(ctx)
      const task = await TaskModel.findById(args.id)
      if (!task) throw new Error('Task not found')

      const isAdmin = ctx.user!.role === 'ADMIN'
      const isAssignee = task.assignedTo ? task.assignedTo.toString() === ctx.user!.id : false
      const isCreator = task.createdBy.toString() === ctx.user!.id

      if (!isAdmin) {
        // Members: only allow toggling completed if they are assignee or creator
        if (typeof args.completed === 'boolean' && (isAssignee || isCreator)) {
          task.completed = args.completed
        } else {
          throw new Error('Forbidden')
        }
      } else {
        if (typeof args.title === 'string') task.title = args.title
        if (typeof args.description === 'string') task.description = args.description
        if (typeof args.completed === 'boolean') task.completed = args.completed
      }

      await task.save()
      return task
    },
    toggleTaskComplete: async (_: unknown, args: { id: string }, ctx: GraphQLContext) => {
      mustAuth(ctx)
      const task = await TaskModel.findById(args.id)
      if (!task) throw new Error('Task not found')
      const isCreator = task.createdBy.toString() === ctx.user!.id
      const isAssignee = task.assignedTo ? task.assignedTo.toString() === ctx.user!.id : false
      if (!isCreator && !isAssignee && ctx.user!.role !== 'ADMIN') {
        throw new Error('Forbidden')
      }
      task.completed = !task.completed
      await task.save()
      return task
    },
    deleteTask: async (_: unknown, args: { id: string }, ctx: GraphQLContext) => {
      mustAuth(ctx)
      const task = await TaskModel.findById(args.id)
      if (!task) throw new Error('Task not found')
      if (task.createdBy.toString() !== ctx.user!.id && ctx.user!.role !== 'ADMIN') {
        throw new Error('Forbidden')
      }
      const res = await TaskModel.deleteOne({ _id: args.id })
      return res.deletedCount === 1
    },
    assignTask: async (_: unknown, args: { id: string; userId?: string }, ctx: GraphQLContext) => {
      mustAuth(ctx)
      const task = await TaskModel.findById(args.id)
      if (!task) throw new Error('Task not found')
      if (task.createdBy.toString() !== ctx.user!.id && ctx.user!.role !== 'ADMIN') {
        throw new Error('Forbidden')
      }
      task.assignedTo = args.userId ? new Types.ObjectId(args.userId) : undefined
      await task.save()
      return task
    },
    assignTaskByEmail: async (_: unknown, args: { id: string; email: string }, ctx: GraphQLContext) => {
      mustAuth(ctx)
      const task = await TaskModel.findById(args.id)
      if (!task) throw new Error('Task not found')
      if (task.createdBy.toString() !== ctx.user!.id && ctx.user!.role !== 'ADMIN') {
        throw new Error('Forbidden')
      }

      // Try to find an existing user by email
      const user = await UserModel.findOne({ email: args.email })
      if (user) {
        task.assignedTo = new Types.ObjectId(user.id)
        await task.save()
        return task
      }

      // Create a pending assignment if the user does not exist yet
      await PendingAssignmentModel.create({ email: args.email, task: task._id, invitedBy: new Types.ObjectId(ctx.user!.id) })
      // Return the task as-is (unassigned) so the client can show pending state
      return task
    },
    resendPendingAssignment: async (_: unknown, args: { id: string }, ctx: GraphQLContext) => {
      mustAuth(ctx)
      const p = await PendingAssignmentModel.findById(args.id)
      if (!p) throw new Error('Pending assignment not found')
      // Only admin or inviter can resend
      if (ctx.user!.role !== 'ADMIN' && p.invitedBy.toString() !== ctx.user!.id) throw new Error('Forbidden')
      // For now, update updatedAt to signal a resend
      p.updatedAt = new Date()
      await p.save()
      return p
    },
    cancelPendingAssignment: async (_: unknown, args: { id: string }, ctx: GraphQLContext) => {
      mustAuth(ctx)
      const p = await PendingAssignmentModel.findById(args.id)
      if (!p) throw new Error('Pending assignment not found')
      if (ctx.user!.role !== 'ADMIN' && p.invitedBy.toString() !== ctx.user!.id) throw new Error('Forbidden')
      const res = await PendingAssignmentModel.deleteOne({ _id: args.id })
      return res.deletedCount === 1
    },
  },
  PendingAssignment: {
    id: (p: any) => p.id || p._id,
    task: async (p: any) => TaskModel.findById(p.task),
    invitedBy: async (p: any) => UserModel.findById(p.invitedBy),
  },
  Task: {
    id: (t: any) => t.id || t._id,
    createdBy: async (t: any) => UserModel.findById(t.createdBy),
    assignedTo: async (t: any) => (t.assignedTo ? UserModel.findById(t.assignedTo) : null),
  },
}


