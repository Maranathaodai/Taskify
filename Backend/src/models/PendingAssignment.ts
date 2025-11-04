import { Schema, model } from 'mongoose'

const PendingAssignmentSchema = new Schema(
  {
    email: { type: String, required: true, index: true },
    task: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
)

export const PendingAssignmentModel = model('PendingAssignment', PendingAssignmentSchema)
