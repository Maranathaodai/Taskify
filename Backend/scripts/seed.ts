import dotenv from 'dotenv'
dotenv.config()

import { connectMongo } from '../src/utils/db'
import { UserModel } from '../src/models/User'
import { TaskModel } from '../src/models/Task'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

async function signToken(userId: string) {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET not set')
  return jwt.sign({ userId }, secret, { expiresIn: '7d' })
}

async function seed() {
  await connectMongo()

  console.log('Clearing existing users and tasks (development only)')
  await TaskModel.deleteMany({})
  await UserModel.deleteMany({})

  const usersData = [
    { name: 'Mara Admin', email: 'mara@gmail.com', password: 'password', role: 'ADMIN' },
    { name: 'Natha Member', email: 'natha@gmail.com', password: 'password', role: 'MEMBER' },
    { name: 'Bob Member', email: 'bob@gmail.com', password: 'password', role: 'MEMBER' },
  ]

  const createdUsers: Array<any> = []

  for (const u of usersData) {
    const passwordHash = await bcrypt.hash(u.password, 10)
    const user = await UserModel.create({ name: u.name, email: u.email, passwordHash, role: u.role })
    const token = await signToken(user.id)
    createdUsers.push({ id: user.id, email: user.email, role: user.role, token })
  }

  console.log('\nSeeded users:')
  for (const u of createdUsers) {
    console.log(`- ${u.email} (${u.role}) token: ${u.token}`)
  }

  // create a couple tasks
  const admin = await UserModel.findOne({ email: 'mara@gmail.com' })
  const natha = await UserModel.findOne({ email: 'natha@gmail.com' })

  if (admin) {
    const t1 = await TaskModel.create({ title: 'Admin task 1', description: 'Owned by Mara', createdBy: admin._id })
    const t2 = await TaskModel.create({ title: 'Assign to Natha', description: 'Please take this', createdBy: admin._id, assignedTo: natha?._id })
    console.log('\nCreated sample tasks:')
    console.log(`- ${t1.title} (id=${t1.id})`)
    console.log(`- ${t2.title} (id=${t2.id}, assignedTo=${natha?.email})`)
  }

  console.log('\nSeeding complete')
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
