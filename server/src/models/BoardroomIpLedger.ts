import mongoose, { type InferSchemaType } from 'mongoose'

/**
 * Tracks guest boardroom trials per client key (hashed IP) and blocks guest reuse
 * after any free account from that network exhausts boardroom quota.
 */
const boardroomIpLedgerSchema = new mongoose.Schema(
  {
    ipHash: { type: String, required: true, unique: true, index: true },
    guestCount: { type: Number, default: 0, min: 0 },
    exhaustedFreeUserIds: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] },
  },
  { timestamps: true },
)

export type BoardroomIpLedgerDocument = InferSchemaType<typeof boardroomIpLedgerSchema>

export const BoardroomIpLedger =
  mongoose.models.BoardroomIpLedger ?? mongoose.model('BoardroomIpLedger', boardroomIpLedgerSchema)
