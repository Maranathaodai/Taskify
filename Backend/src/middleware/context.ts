import type { ExpressContextFunctionArgument } from '@apollo/server/express4'
import jwt from 'jsonwebtoken'
import { UserModel, type IUser } from '../models/User'

export interface GraphQLContext {
  user: (IUser & { id: string }) | null
}

export async function getContext({ req }: ExpressContextFunctionArgument): Promise<GraphQLContext> {
  const auth = req.headers.authorization || ''
  if (!auth.startsWith('Bearer ')) return { user: null }
  const token = auth.slice('Bearer '.length)
  try {
    const secret = process.env.JWT_SECRET
    if (!secret) throw new Error('JWT_SECRET is not set')
    const payload = jwt.verify(token, secret) as { userId: string }
    const user = await UserModel.findById(payload.userId)
    if (!user) return { user: null }
    return { user: Object.assign(user.toObject(), { id: user.id }) as any }
  } catch {
    return { user: null }
  }
}


