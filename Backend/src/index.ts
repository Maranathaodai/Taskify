import 'dotenv/config'
import express from 'express'
import http from 'http'
import cors from 'cors'
import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { WebSocketServer } from 'ws'
import { useServer } from 'graphql-ws/lib/use/ws'
import jwt from 'jsonwebtoken'
import { UserModel } from './models/User'
import { pubsub } from './utils/pubsub'
import { json } from 'body-parser'
import { typeDefs } from './schema/typeDefs'
import { resolvers } from './schema/resolvers'
import { getContext } from './middleware/context'
import { connectMongo } from './utils/db'

async function start() {
  await connectMongo()

  const app = express()
  app.use(cors())

  const httpServer = http.createServer(app)

  const schema = makeExecutableSchema({ typeDefs, resolvers } as any)
  const server = new ApolloServer({ schema } as any)
  await server.start()

  app.use(
    '/graphql',
    json(),
    expressMiddleware(server, {
      context: getContext,
    }),
  )

  const PORT = process.env.PORT || 4000
  // Start the HTTP server
  httpServer.listen(PORT, () => {
    console.log(`GraphQL server ready at http://localhost:${PORT}/graphql`)
  })

  // Set up WebSocket server for GraphQL subscriptions (graphql-ws)
  try {
    const wsServer = new WebSocketServer({ server: httpServer, path: '/graphql' })
    useServer({
      schema,
      
      onConnect: (ctx: any) => {
        try {
          console.log('WS onConnect connectionParams=', ctx.connectionParams)
        } catch (e) {}
      },
      onSubscribe: (ctx: any, msg: any) => {
        try {
          console.log('WS onSubscribe message=', msg)
        } catch (e) {}
      },
      onError: (ctx: any, msg: any, errors: any) => {
        try {
          console.error('WS onError', errors)
        } catch (e) {}
      },
      context: async (ctx: any) => {
        // connectionParams may contain an Authorization header
        const connectionParams = (ctx.connectionParams || {}) as any
        console.log('WS context: connectionParams keys=', Object.keys(connectionParams || {}))
        const auth = connectionParams.Authorization || connectionParams.authorization || ''
        if (!auth || !auth.startsWith('Bearer ')) return { user: null, pubsub }
        const token = auth.slice('Bearer '.length)
        try {
          const secret = process.env.JWT_SECRET
          if (!secret) return { user: null, pubsub }
          const payload = jwt.verify(token, secret) as { userId: string }
          const user = await UserModel.findById(payload.userId)
          if (!user) return { user: null, pubsub }
          console.log('WS context resolved user id=', user.id)
          return { user: Object.assign(user.toObject(), { id: user.id }), pubsub }
        } catch (err) {
          console.warn('WS context auth failed', err)
          return { user: null, pubsub }
        }
      },
    }, wsServer)
    console.log('WebSocket server for subscriptions started at ws://localhost:' + PORT + '/graphql')
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Failed to start WS server for subscriptions', err)
  }
}

start().catch((err) => {
  console.error('Failed to start server', err)
  process.exit(1)
})


