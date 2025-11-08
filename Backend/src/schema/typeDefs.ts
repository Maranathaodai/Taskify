export const typeDefs = /* GraphQL */ `#graphql
  scalar Date

  enum Role {
    ADMIN
    MEMBER
  }

  type User {
    id: ID!
    email: String!
    name: String!
    role: Role!
    createdAt: Date!
    updatedAt: Date!
  }

  type Task {
    id: ID!
    title: String!
    description: String
    assignedTo: User
    createdBy: User!
    completed: Boolean!
    createdAt: Date!
    updatedAt: Date!
  }

  type PendingAssignment {
    id: ID!
    email: String!
    task: Task!
    invitedBy: User!
    createdAt: Date!
    updatedAt: Date!
  }

  input TaskFilter {
    mine: Boolean
    completed: Boolean
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    me: User
    tasks(filter: TaskFilter): [Task!]!
    users: [User!]!
    pendingAssignments: [PendingAssignment!]!
  }

  type Subscription {
    taskCreated: Task!
    taskUpdated: Task!
    taskDeleted: ID!
    pendingAssignmentCreated: PendingAssignment!
  }

  type Mutation {
    register(name: String!, email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!

    createTask(title: String!, description: String): Task!
    updateTask(id: ID!, title: String, description: String, completed: Boolean): Task!
    toggleTaskComplete(id: ID!): Task!
    deleteTask(id: ID!): Boolean!
    assignTask(id: ID!, userId: ID): Task!
    # Assign a task by email. If user exists, assigns immediately. If not, creates a PendingAssignment that will be resolved when the user registers.
    assignTaskByEmail(id: ID!, email: String!): Task!
    # Admins may resend a pending assignment (no-op for now but updates timestamp) or cancel it.
    resendPendingAssignment(id: ID!): PendingAssignment!
    cancelPendingAssignment(id: ID!): Boolean!
  }
`


