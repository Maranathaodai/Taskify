import 'dotenv/config'
import express from 'express'
import http from 'http'
import cors from 'cors'
import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
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

  const server = new ApolloServer({
    typeDefs,
    resolvers,
  })
  await server.start()

  app.use(
    '/graphql',
    json(),
    expressMiddleware(server, {
      context: getContext,
    }),
  )

  const PORT = process.env.PORT || 4000
  httpServer.listen(PORT, () => {
    console.log(`GraphQL server ready at http://localhost:${PORT}/graphql`)
  })
}

start().catch((err) => {
  console.error('Failed to start server', err)
  process.exit(1)
})


