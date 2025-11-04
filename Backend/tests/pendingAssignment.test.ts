import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { beforeAll, afterAll, describe, it, expect } from 'vitest'

import { UserModel } from '../src/models/User'
import { TaskModel } from '../src/models/Task'
import { PendingAssignmentModel } from '../src/models/PendingAssignment'
import { resolvers } from '../src/schema/resolvers'

let mongo: MongoMemoryServer

beforeAll(async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'
  mongo = await MongoMemoryServer.create()
  const uri = mongo.getUri()
  await mongoose.connect(uri)
})

afterAll(async () => {
  await mongoose.disconnect()
  if (mongo) await mongo.stop()
})

describe('pending assignment flow', () => {
  it('creates a pending assignment when assigning to unknown email and resolves on register', async () => {
    // create admin
    const admin = await UserModel.create({ name: 'Admin', email: 'admin@example.com', passwordHash: 'x', role: 'ADMIN' })

    // create a task by admin
    const task = await TaskModel.create({ title: 'Test Task', description: 'desc', createdBy: admin._id })

    const ctx: any = { user: { id: admin.id, role: 'ADMIN' } }

    // assign by email that does not exist
    const res = await (resolvers as any).Mutation.assignTaskByEmail(null, { id: task.id, email: 'new@ex.com' }, ctx)
    expect(res.id).toBe(task.id)

    const pending = await PendingAssignmentModel.findOne({ email: 'new@ex.com', task: task._id })
    expect(pending).toBeTruthy()

    // register the new user via resolver
    const reg = await (resolvers as any).Mutation.register(null, { name: 'New', email: 'new@ex.com', password: 'pw' })
    expect(reg.user.email).toBe('new@ex.com')

    // task should now be assigned
    const fresh = await TaskModel.findById(task._id)
    expect(fresh?.assignedTo?.toString()).toBe(reg.user.id)

    // pending should be removed
    const pendCount = await PendingAssignmentModel.countDocuments({ email: 'new@ex.com' })
    expect(pendCount).toBe(0)
  })
})
