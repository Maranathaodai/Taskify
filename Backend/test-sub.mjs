// test-sub.mjs
// Usage: node test-sub.mjs <TOKEN>
// Example: node test-sub.mjs eyJhbGciOi...

import { createClient } from 'graphql-ws'

const [, , token] = process.argv

const client = createClient({
  url: 'ws://localhost:4000/graphql',
  connectionParams: token ? { Authorization: `Bearer ${token}` } : {},
  retryAttempts: 3,
})

function sub(query, label) {
  console.log('Opening subscription', label)
  const dispose = client.subscribe(
    { query },
    {
      next: (data) => console.log(`[${label}] event:`, JSON.stringify(data, null, 2)),
      error: (err) => {
        console.error(`[${label}] subscription ERROR:`, err)
        
        try {
          if (err && typeof err === 'object') console.error('err keys:', Object.keys(err))
        } catch {}
      },
      complete: () => console.log(`[${label}] complete`),
    },
  )
  return dispose
}

async function main() {
  console.log('Subscribing to taskCreated and taskUpdated with token:', token ? 'present' : 'none')
  sub('subscription { taskCreated { id title createdAt } }', 'taskCreated')
  sub('subscription { taskUpdated { id title completed } }', 'taskUpdated')
  console.log('Subscriptions active. Now trigger a mutation in another terminal to see events.')
  console.log('Press Ctrl+C to exit.')
}

main().catch((e) => {
  console.error('Fatal', e)
})