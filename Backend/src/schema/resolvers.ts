import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { UserModel } from '../models/User'
import { TaskModel } from '../models/Task'
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
  },
  Mutation: {
    register: async (_: unknown, args: { name: string; email: string; password: string }) => {
      const exists = await UserModel.findOne({ email: args.email })
      if (exists) throw new Error('Email already in use')
      const passwordHash = await bcrypt.hash(args.password, 10)
      const user = await UserModel.create({ name: args.name, email: args.email, passwordHash })
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
      if (typeof args.title === 'string') task.title = args.title
      if (typeof args.description === 'string') task.description = args.description
      if (typeof args.completed === 'boolean') task.completed = args.completed
      await task.save()
      return task
    },
    toggleTaskComplete: async (_: unknown, args: { id: string }, ctx: GraphQLContext) => {
      mustAuth(ctx)
      const task = await TaskModel.findById(args.id)
      if (!task) throw new Error('Task not found')
      task.completed = !task.completed
      await task.save()
      return task
    },
    deleteTask: async (_: unknown, args: { id: string }, ctx: GraphQLContext) => {
      mustAuth(ctx)
      const res = await TaskModel.deleteOne({ _id: args.id })
      return res.deletedCount === 1
    },
    assignTask: async (_: unknown, args: { id: string; userId?: string }, ctx: GraphQLContext) => {
      mustAuth(ctx)
      const task = await TaskModel.findById(args.id)
      if (!task) throw new Error('Task not found')
      task.assignedTo = args.userId ? new Types.ObjectId(args.userId) : undefined
      await task.save()
      return task
    },
  },
  Task: {
    id: (t: any) => t.id || t._id,
    createdBy: async (t: any) => UserModel.findById(t.createdBy),
    assignedTo: async (t: any) => (t.assignedTo ? UserModel.findById(t.assignedTo) : null),
  },
}


