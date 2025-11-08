import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { pubsub, EVENTS } from '../src/utils/pubsub'
import { UserModel } from '../src/models/User'
import { TaskModel } from '../src/models/Task'
import { CommentModel } from '../src/models/Comment'

async function run() {
  const mms = await MongoMemoryServer.create()
  const uri = mms.getUri()
  console.log('Inproc test: starting in-memory mongo at', uri)
  await mongoose.connect(uri)

  try {
    await UserModel.deleteMany({})
    await TaskModel.deleteMany({})
    await CommentModel.deleteMany({})

    const user = await UserModel.create({ name: 'Tester', email: 'tester@example.com', passwordHash: 'x', role: 'MEMBER' })
    const task = await TaskModel.create({ title: 'Task for comments', description: 'inproc', createdBy: user._id })

    const iterator = pubsub.asyncIterator([EVENTS.COMMENT_ADDED])
    const nextPromise = iterator.next()

    const comment = await CommentModel.create({ text: 'Hello from inproc test', author: user._id, task: task._id })
    await pubsub.publish(EVENTS.COMMENT_ADDED, { commentAdded: comment })

    const result = await Promise.race([
      nextPromise,
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout waiting for subscription event')), 5000)),
    ])

    console.log('Received subscription payload:', JSON.stringify((result as any).value, null, 2))

    const payload = (result as any).value.commentAdded
    if (!payload || payload.text !== 'Hello from inproc test') throw new Error('Payload mismatch')

    console.log('In-process comment publish/subscribe test: PASS')
  } catch (err) {
    console.error('In-process test failed:', err)
    process.exitCode = 2
  } finally {
    await mongoose.disconnect()
    await mms.stop()
  }
}

run().catch((err) => {
  console.error('Fatal error running inproc test', err)
  process.exit(1)
})
