import { verifyToken } from '../../../../../utils/verify-token'

export default defineEventHandler(async (event) => {
  // Phase 1 stub
  const decodedToken = await verifyToken(event)
  // Phase 4 will implement admin candidates index
  return { success: true }
})
