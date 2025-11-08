import type { ExpressContextFunctionArgument } from '@apollo/server/express4'
import jwt from 'jsonwebtoken'
import { UserModel, type IUser } from '../models/User'

export interface GraphQLContext {
  user: (IUser & { id: string }) | null
}

export async function getContext({ req }: ExpressContextFunctionArgument): Promise<GraphQLContext> {
  const auth = (req.headers.authorization || '') as string
  // Debug: log whether an Authorization header was provided
  try {
    console.log('HTTP getContext: Authorization header present=', !!auth, 'header=', auth ? (auth.length > 80 ? auth.slice(0, 80) + '...' : auth) : '')
  } catch (e) {}

  if (!auth.startsWith('Bearer ')) return { user: null }
  const token = auth.slice('Bearer '.length)
  try {
    const secret = process.env.JWT_SECRET
    if (!secret) throw new Error('JWT_SECRET is not set')
    const payload = jwt.verify(token, secret) as { userId: string }
    const user = await UserModel.findById(payload.userId)
    if (!user) {
      console.warn('HTTP getContext: token verified but user not found id=', payload.userId)
      return { user: null }
    }
    console.log('HTTP getContext: resolved user id=', user.id, 'email=', user.email)
    return { user: Object.assign(user.toObject(), { id: user.id }) as any }
  } catch (err: any) {
    console.warn('HTTP getContext: auth/verify failed:', err && err.message ? err.message : err)
    return { user: null }
  }
}


