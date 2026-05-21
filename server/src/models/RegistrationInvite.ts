import mongoose, { type InferSchemaType } from 'mongoose'

import { inviteExpiresAt } from '../utils/inviteExpiry.js'

const registrationInviteSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true, unique: true, index: true },
    plan: { type: String, enum: ['foundation', 'accelerator', 'elite'], required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    usedAt: { type: Date, default: null, index: true },
    usedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
)

registrationInviteSchema.pre('validate', function setDefaultExpiry(next) {
  if (!this.expiresAt && this.isNew) {
    const created = this.createdAt instanceof Date ? this.createdAt : new Date()
    this.expiresAt = inviteExpiresAt(created)
  }
  next()
})

export type RegistrationInviteDocument = InferSchemaType<typeof registrationInviteSchema>

export const RegistrationInvite =
  mongoose.models.RegistrationInvite ?? mongoose.model('RegistrationInvite', registrationInviteSchema)
