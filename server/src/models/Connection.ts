import mongoose, { type InferSchemaType } from 'mongoose'

const connectionSchema = new mongoose.Schema(
  {
    userAId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userBId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'ConnectionRequest', required: true, unique: true },
  },
  { timestamps: true }
)

connectionSchema.index({ userAId: 1, userBId: 1 }, { unique: true })

export type ConnectionDocument = InferSchemaType<typeof connectionSchema>

export const Connection = mongoose.models.Connection ?? mongoose.model('Connection', connectionSchema)
