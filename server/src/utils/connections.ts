import { Connection } from '../models/Connection.js'

export async function areUsersConnected(userIdA: string, userIdB: string): Promise<boolean> {
  if (!userIdA || !userIdB) return false
  if (userIdA === userIdB) return true

  const a = userIdA
  const b = userIdB
  const existing = await Connection.findOne({
    $or: [
      { userAId: a, userBId: b },
      { userAId: b, userBId: a },
    ],
  }).select({ _id: 1 })

  return Boolean(existing)
}

export async function getConnectionIfMember(userId: string, connectionId: string) {
  if (!userId || !connectionId) return null
  const conn = await Connection.findById(connectionId)
  if (!conn) return null
  const isMember = String(conn.userAId) === userId || String(conn.userBId) === userId
  if (!isMember) return null
  return conn
}
