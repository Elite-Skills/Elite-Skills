import mongoose, { type InferSchemaType } from 'mongoose'

const registrationInviteSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true, unique: true, index: true },
    plan: { type: String, enum: ['foundation', 'accelerator', 'elite'], required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    usedAt: { type: Date, default: null, index: true },
    usedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
)

export type RegistrationInviteDocument = InferSchemaType<typeof registrationInviteSchema>

export const RegistrationInvite =
  mongoose.models.RegistrationInvite ?? mongoose.model('RegistrationInvite', registrationInviteSchema)
