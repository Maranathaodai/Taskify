#!/usr/bin/env node
import fetch from 'node-fetch'
import { createClient } from 'graphql-ws'
import WebSocket from 'ws'

// Usage: node test-sub.mjs <JWT>
const token = process.argv[2] || process.env.TOKEN
if (!token) {
  console.error('Usage: node test-sub.mjs <JWT>')
  process.exit(1)
}

const GRAPHQL_HTTP = process.env.GRAPHQL_URL || 'http://localhost:4000/graphql'
const GRAPHQL_WS = process.env.GRAPHQL_WS || 'ws://localhost:4000/graphql'

function wait(ms) { return new Promise((r) => setTimeout(r, ms)) }

async function run() {
  console.log('Connecting subscription client to', GRAPHQL_WS)
  const client = createClient({
    url: GRAPHQL_WS,
    webSocketImpl: WebSocket,
    connectionParams: { Authorization: `Bearer ${token}` },
  })

  // Subscribe to taskCreated
  const onNext = (data) => {
    console.log('Received subscription event:')
    console.log(JSON.stringify(data, null, 2))
  }

  const unsubscribe = client.subscribe({
    query: `subscription { taskCreated { id title description createdAt createdBy { id name email } assignedTo { id name email } } }`,
  }, {
    next: onNext,
    error: (err) => console.error('Subscription error', err),
    complete: () => console.log('Subscription complete'),
  })

  // Wait a moment to ensure subscription is active
  await wait(500)

  // Trigger createTask via HTTP
  console.log('Triggering createTask via HTTP at', GRAPHQL_HTTP)
  const mutation = `
    mutation CreateTask($title: String!, $description: String) {
      createTask(title: $title, description: $description) { id title description }
    }
  `
  const res = await fetch(GRAPHQL_HTTP, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ query: mutation, variables: { title: 'SMOKE: subscription test', description: 'created by test-sub.mjs' } }),
  })
  const j = await res.json()
  console.log('createTask response:', JSON.stringify(j, null, 2))

  // Wait to receive subscription event
  await wait(1500)

  try { unsubscribe() } catch (e) {}
  client.dispose && client.dispose()
  process.exit(0)
}

run().catch((err) => { console.error(err); process.exit(1) })
