import { PubSub } from 'graphql-subscriptions'

export const pubsub = new PubSub()

export const EVENTS = {
  TASK_CREATED: 'TASK_CREATED',
  TASK_UPDATED: 'TASK_UPDATED',
  TASK_DELETED: 'TASK_DELETED',
  COMMENT_ADDED: 'COMMENT_ADDED',
  PENDING_CREATED: 'PENDING_CREATED',
  PENDING_DELETED: 'PENDING_DELETED',
  USER_CREATED: 'USER_CREATED',
}

export default pubsub
