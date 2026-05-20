import mongoose, { type InferSchemaType } from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, maxlength: 254 },
    passwordHash: { type: String, required: true },
    isAdmin: { type: Boolean, default: false, index: true },
    plan: { type: String, enum: ['free', 'paid'], default: 'free', index: true },
    /** AI boardroom messages consumed (free plan only; paid ignores this) */
    boardroomMessagesUsed: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
)

export type UserDocument = InferSchemaType<typeof userSchema>

export const User = mongoose.models.User ?? mongoose.model('User', userSchema)
