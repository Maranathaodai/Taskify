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
  }

  type Mutation {
    register(name: String!, email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!

    createTask(title: String!, description: String): Task!
    updateTask(id: ID!, title: String, description: String, completed: Boolean): Task!
    toggleTaskComplete(id: ID!): Task!
    deleteTask(id: ID!): Boolean!
    assignTask(id: ID!, userId: ID): Task!
  }
`


